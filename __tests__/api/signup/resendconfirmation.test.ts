/**
 * @jest-environment node
 */

/* eslint-disable  @typescript-eslint/no-explicit-any */
import { createMocks, RequestMethod } from "node-mocks-http";
import { getCsrfToken } from "next-auth/react";
import { mocked } from "jest-mock";
import {
  CognitoIdentityProviderClient,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import resendConfirmation from "@pages/api/signup/resendconfirmation";

const mockGetCSRFToken = mocked(getCsrfToken, { shallow: true });

jest.mock("next-auth/react");
jest.mock("@aws-sdk/client-cognito-identity-provider", () => ({
  CognitoIdentityProviderClient: jest.fn(),
  ResendConfirmationCodeCommand: jest.fn(),
}));

describe("/signup/resendconfirmation", () => {
  afterEach(() => {
    mockGetCSRFToken.mockReset();
  });
  beforeAll(() => {
    process.env.COGNITO_REGION = "ca-central-1";
    process.env.COGNITO_APP_CLIENT_ID = "somemockvalue";
  });
  afterAll(() => {
    process.env.COGNITO_REGION = undefined;
    process.env.COGNITO_APP_CLIENT_ID = undefined;
  });
  describe("Access Control", () => {
    test.each(["GET", "PUT", "DELETE"])(
      "Should not allow an unaccepted method",
      async (httpVerb) => {
        const { req, res } = createMocks({
          method: httpVerb as RequestMethod,
          headers: {
            "Content-Type": "application/json",
          },
        });

        await resendConfirmation(req, res);
        expect(res.statusCode).toBe(403);
        expect(JSON.parse(res._getData())).toMatchObject({ error: "HTTP Method Forbidden" });
      }
    );

    it("does not allow a non valid CSRF token", async () => {
      mockGetCSRFToken.mockResolvedValueOnce("valid_csrf");
      const { req, res } = createMocks({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "invalid_csrf",
        },
      });

      await resendConfirmation(req, res);
      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Access Denied",
      });
    });
  });
  describe("Resend Confirmation Code", () => {
    const mockedCognitoIdentityProviderClient: any = mocked(CognitoIdentityProviderClient, {
      shallow: true,
    });
    const mockedResendConfirmationCodeCommand: any = mocked(ResendConfirmationCodeCommand, {
      shallow: true,
    });
    const sendFunctionMock = jest.fn();
    afterEach(() => {
      mockedCognitoIdentityProviderClient.mockReset();
      mockedResendConfirmationCodeCommand.mockReset();
      sendFunctionMock.mockReset();
    });
    it("handler returns 400 status code if username not provided", async () => {
      mockGetCSRFToken.mockResolvedValueOnce("valid_csrf");
      const { req, res } = createMocks({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "valid_csrf",
        },
      });

      await resendConfirmation(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        message: "username needs to be provided in the body of the request",
      });
    });
    it("handler returns empty body and cognito status code when command succeeds", async () => {
      mockGetCSRFToken.mockResolvedValueOnce("valid_csrf");
      sendFunctionMock.mockImplementationOnce(async () => ({
        $metadata: {
          httpStatusCode: 200,
        },
      }));
      mockedCognitoIdentityProviderClient.mockImplementationOnce(() => ({
        send: sendFunctionMock,
      }));

      const { req, res } = createMocks({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "valid_csrf",
        },
        body: {
          username: "test",
        },
      });

      await resendConfirmation(req, res);
      expect(res.statusCode).toBe(200);
      expect(res._getData()).toBe("");
      expect(mockedResendConfirmationCodeCommand.mock.calls[0][0]).toEqual({
        ClientId: "somemockvalue",
        Username: "test",
      });
      expect(mockedCognitoIdentityProviderClient).toBeCalledTimes(1);
    });
    it("handles error when the cognito send function fails", async () => {
      mockGetCSRFToken.mockResolvedValueOnce("valid_csrf");
      sendFunctionMock.mockRejectedValue({
        toString: () => "There is an error",
        $metadata: {
          httpStatusCode: 400,
        },
      });
      mockedCognitoIdentityProviderClient.mockImplementationOnce(() => ({
        send: sendFunctionMock,
      }));

      const { req, res } = createMocks({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "valid_csrf",
        },
        body: {
          username: "test",
        },
      });

      await resendConfirmation(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        message: "There is an error",
      });
    });
  });
});
