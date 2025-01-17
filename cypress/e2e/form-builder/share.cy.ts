import { NextData } from "types";

describe("Form builder share", () => {
  beforeEach(() => {
    cy.visit("/form-builder/edit", {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
        let nextData: NextData;
        Object.defineProperty(win, "__NEXT_DATA__", {
          set(serverSideProps) {
            serverSideProps.context = {
              user: {
                acceptableUse: false,
                name: null,
                userId: "testId",
              },
            };
            nextData = serverSideProps;
          },
          get() {
            return nextData;
          },
        });
      },
    });
  });

  it("Renders share flyout with name check", () => {
    cy.get("button").contains("Share").click();
    cy.get("[role='menuitem']").should("have.length", 1);
    cy.get("span").contains("You must name").should("exist");
    cy.get("span button").contains("name your form").click();
    cy.focused().should("have.attr", "id", "formTitle");
  });

  it("Renders share flyout", () => {
    cy.get("#formTitle").type("Cypress Share Test Form");
    cy.get("button").contains("Share").click();
    cy.get("[role='menuitem']").should("have.length", 1);
    cy.get("span").contains("Share by email").click();
    cy.get("h2").contains("Share").should("exist");
    cy.get("button").contains("Download form file").should("exist");
    cy.get("summary").contains("See a preview of the email message").should("exist").click();
    cy.get("h4").contains("A GC Forms user has shared a form with you on GC Forms").should("exist");
    cy.get("button").contains("Close").click();
  });
});
