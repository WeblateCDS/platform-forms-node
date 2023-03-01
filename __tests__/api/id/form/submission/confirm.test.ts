/**
 * @jest-environment node
 */
/* eslint-disable  @typescript-eslint/no-explicit-any */
import { createMocks, RequestMethod } from "node-mocks-http";
import confirm from "@pages/api/id/[form]/submission/confirm";
import { unstable_getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { mockClient } from "aws-sdk-client-mock";
import { logMessage } from "@lib/logger";
import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import Redis from "ioredis-mock";
import initialSettings from "../../../../../flag_initialization/default_flag_settings.json";

jest.mock("next-auth/next");
//Needed in the typescript version of the test so types are inferred correclty
const mockGetSession = jest.mocked(unstable_getServerSession, { shallow: true });

const redis = new Redis();

jest.mock("@lib/integration/redisConnector", () => ({
  getRedisInstance: jest.fn(() => redis),
}));

jest.mock("@lib/cache/flags", () => {
  const originalModule = jest.requireActual("@lib/cache/flags");
  return {
    __esModule: true,
    ...originalModule,
    checkOne: jest.fn((flag) => {
      if (flag === "vault") return true;
      return (initialSettings as Record<string, boolean>)[flag];
    }),
  };
});

jest.mock("@lib/logger");
const mockLogMessage = jest.mocked(logMessage, { shallow: true });
mockLogMessage.info.mockImplementation(jest.fn());
mockLogMessage.error.mockImplementation(jest.fn());

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("Confirm form submissions (without active session)", () => {
  it("Should not be able to use the API without an active session", async () => {
    const { req, res } = createMocks({
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: {
        managerEmail: "manager@cds-snc.ca",
        department: "department",
      },
    });

    await confirm(req, res);

    expect(res.statusCode).toEqual(401);
  });
});

describe("Confirm form submissions (with active session)", () => {
  beforeEach(() => {
    const mockSession: Session = {
      expires: "1",
      user: {
        id: "1",
        email: "a@b.com",
        name: "Testing Forms",
        privileges: [],
      },
    };

    mockGetSession.mockResolvedValue(mockSession);
  });

  afterEach(() => {
    mockGetSession.mockReset();
    ddbMock.reset();
  });

  it.each(["GET", "POST", "DELETE"])(
    "API should reject request if HTTP method is not valid",
    async (httpMethod) => {
      const { req, res } = createMocks({
        method: httpMethod as RequestMethod,
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: {
          managerEmail: "manager@cds-snc.ca",
          department: "department",
        },
      });

      await confirm(req, res);

      expect(res.statusCode).toEqual(403);
    }
  );

  it("API should reject request if payload is not valid (not an array)", async () => {
    const { req, res } = createMocks({
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: {
        key: "value",
      },
    });

    await confirm(req, res);

    expect(res.statusCode).toEqual(400);
    expect(JSON.parse(res._getData())).toMatchObject({
      error: "JSON Validation Error: instance is not of a type(s) array",
    });
  });

  it("API should reject request if payload is not valid (array of invalid strings)", async () => {
    const { req, res } = createMocks({
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: ["value1", "value2", "value3"],
    });

    await confirm(req, res);

    expect(res.statusCode).toEqual(400);
    expect(JSON.parse(res._getData()).error).toContain("does not match pattern");
  });

  it("API should reject request if payload contains more than 20 confirmation codes", async () => {
    const { req, res } = createMocks({
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      query: {
        form: 8,
      },
      body: Array(21).map(() => "2515ed36-0755-44e2-9e5c-927bc57f0570"),
    });

    await confirm(req, res);

    expect(res.statusCode).toEqual(400);
    expect(JSON.parse(res._getData()).error).toContain("Too many confirmation codes. Limit is 20.");
  });

  it("API should accept request if payload is valid", async () => {
    const { req, res } = createMocks({
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      query: {
        form: 8,
      },
      body: ["2515ed36-0755-44e2-9e5c-927bc57f0570"],
    });

    ddbMock.on(BatchGetCommand).resolves({
      Responses: {
        Vault: [
          {
            Name: "12-05-2000",
            ConfirmationCode: "2515ed36-0755-44e2-9e5c-927bc57f0570",
          },
        ],
      },
    });

    await confirm(req, res);

    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res._getData())).toEqual({
      confirmedSubmissions: ["2515ed36-0755-44e2-9e5c-927bc57f0570"],
    });
    expect(mockLogMessage.info.mock.calls.length).toBe(1);
    expect(mockLogMessage.info.mock.calls[0][0]).toContain(
      "user:a@b.com confirmed form submissions [12-05-2000] for form ID:8"
    );
  });

  it("API should skip confirmation codes corresponding to submissions that have already been confirmed", async () => {
    const { req, res } = createMocks({
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      query: {
        form: 8,
      },
      body: ["2515ed36-0755-44e2-9e5c-927bc57f0570"],
    });

    ddbMock.on(BatchGetCommand).resolves({
      Responses: {
        Vault: [
          {
            Name: "12-05-2000",
            ConfirmationCode: "2515ed36-0755-44e2-9e5c-927bc57f0570",
            RemovalDate: 1679076628000,
          },
        ],
      },
    });

    await confirm(req, res);

    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res._getData())).toEqual({
      confirmationCodesAlreadyUsed: ["2515ed36-0755-44e2-9e5c-927bc57f0570"],
    });
    expect(ddbMock.commandCalls(TransactWriteCommand)).toStrictEqual([]);
    expect(mockLogMessage.info.mock.calls.length).toBe(1);
    expect(mockLogMessage.info.mock.calls[0][0]).toContain(
      "user:a@b.com confirmed form submissions [] for form ID:8"
    );
  });

  it("API should skip confirmation codes that are not associated to any submission", async () => {
    const { req, res } = createMocks({
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      query: {
        form: 8,
      },
      body: ["2515ed36-0755-44e2-9e5c-927bc57f0570"],
    });

    ddbMock.on(BatchGetCommand).resolves({
      Responses: {
        Vault: [],
      },
    });

    await confirm(req, res);

    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res._getData())).toEqual({
      invalidConfirmationCodes: ["2515ed36-0755-44e2-9e5c-927bc57f0570"],
    });
    expect(ddbMock.commandCalls(TransactWriteCommand)).toStrictEqual([]);
    expect(mockLogMessage.info.mock.calls.length).toBe(1);
    expect(mockLogMessage.info.mock.calls[0][0]).toContain(
      "user:a@b.com confirmed form submissions [] for form ID:8"
    );
  });

  it("API request should fail if update/delete process did not succeed", async () => {
    const { req, res } = createMocks({
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      query: {
        form: 8,
      },
      body: ["2515ed36-0755-44e2-9e5c-927bc57f0570"],
    });

    ddbMock.on(BatchGetCommand).resolves({
      Responses: {
        Vault: [
          {
            Name: "12-05-2000",
            ConfirmationCode: "2515ed36-0755-44e2-9e5c-927bc57f0570",
          },
        ],
      },
    });

    ddbMock.on(TransactWriteCommand).rejects({});

    await confirm(req, res);

    expect(res.statusCode).toEqual(500);
    expect(JSON.parse(res._getData()).error).toContain("Error on server side");
  });
});