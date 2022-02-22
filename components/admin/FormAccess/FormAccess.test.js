import React from "react";
import { cleanup, render, fireEvent, screen, act } from "@testing-library/react";

import mockedAxios from "axios";
import FormAccess from "./FormAccess";

jest.mock("axios");

describe("Form Access Component", () => {
  const formConfig = { formID: 1 };

  afterEach(cleanup);

  it("renders without errors", async () => {
    mockedAxios.mockResolvedValue({
      status: 200,
      data: [
        {
          id: 4,
          email: "test1@cds-snc.ca",
          active: true,
        },
      ],
    });

    render(<FormAccess formID={formConfig.formID}></FormAccess>);
    expect(await screen.findByTestId("add-email")).toBeInTheDocument();
  });

  it("submits a new email address and display it in the list", async () => {
    const testEmailAddress = "test@cds-snc.ca";
    mockedAxios.mockResolvedValue({
      status: 200,
      data: [
        {
          id: 4,
          email: "test1@cds-snc.ca",
          active: true,
        },
      ],
    });

    render(<FormAccess formID={formConfig.formID}></FormAccess>);

    const input = await screen.findByLabelText("settings.formAccess.addEmailAriaLabel");
    fireEvent.change(input, { target: { value: testEmailAddress } });

    mockedAxios.mockResolvedValueOnce({
      status: 200,
      data: {
        success: {
          id: 1,
        },
      },
    });
    fireEvent.click(screen.getByTestId("add-email"));
    expect(await screen.findByText(testEmailAddress)).toBeInTheDocument;
  });

  it("submits a new email address for a form that does not exist, and receives an error from the API", async () => {
    const testEmailAddress = "test@cds-snc.ca";
    mockedAxios
      .mockResolvedValueOnce({
        status: 200,
        data: [
          {
            id: 4,
            email: "test1@cds-snc.ca",
            active: true,
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 404,
        data: { error: "The formID does not exist" },
      });

    await act(async () => {
      render(<FormAccess formID={formConfig.formID}></FormAccess>);
    });

    const input = await screen.findByLabelText("settings.formAccess.addEmailAriaLabel");

    await fireEvent.change(input, { target: { value: testEmailAddress } });

    await fireEvent.click(screen.getByTestId("add-email"));
    expect(await screen.findByTestId("alert")).toBeInTheDocument;
  });

  it("submits a new email address that is not a Government of Canada email, and receives an error from the API", async () => {
    const testEmailAddress = "test@test.ca";

    mockedAxios
      .mockResolvedValueOnce({
        status: 200,
        data: [
          {
            id: 4,
            email: "test1@cds-snc.ca",
            active: true,
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 400,
        data: { error: "The email is not a valid GC email" },
      });

    render(<FormAccess formID={formConfig.formID}></FormAccess>);

    const input = await screen.findByLabelText("settings.formAccess.addEmailAriaLabel");
    await fireEvent.change(input, { target: { value: testEmailAddress } });

    await fireEvent.click(screen.getByTestId("add-email"));
    expect(await screen.findByRole("alert")).toBeInTheDocument;
  });
});