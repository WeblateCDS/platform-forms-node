describe("Login Page", () => {
  describe("User login screen", () => {
    beforeEach(() => {
      cy.visitPage("/en/auth/login");
    });

    it("EN page renders", () => {
      cy.get("h1").should("contain", "Sign in");
      cy.get("input[id='username']").should("be.visible");
      cy.get("input[id='password']").should("be.visible");
    });

    it("Change page language", () => {
      cy.get("a[lang='fr']").click();
      cy.url().should("contain", "/fr");
      cy.get("h1").should("contain", "Se connecter");
    });

    it("Displays an error message when submitting an empty form.", () => {
      cy.get("[type='submit']").click();
      cy.get("[data-testid='alert']").should("be.visible");
    });

    it("Displays an error message when submitting an empty username.", () => {
      cy.get("[type='submit']").click();
      cy.get("[id='errorMessageusername']").should(
        "contain",
        "Complete the required field to continue."
      );
    });
    it("Displays an error message when submitting an invalid email", () => {
      cy.get("input[id='username']").type("myemail@cds-snc");
      cy.get("[type='submit']").click();
      cy.get("[id='errorMessageusername']").should("contain", "Enter a valid email address.");
    });
    it("Displays no error message when submitting a valid email", () => {
      cy.get("input[id='username']").type("test@cds-snc.ca");
      cy.get("[type='submit']").click();
      cy.get("[id='errorMessageusername']").should("not.exist");
    });

    it("Displays an error message when submitting an empty password.", () => {
      cy.get("[type='submit']").click();
      cy.get("[id='errorMessagepassword']").should(
        "contain",
        "Complete the required field to continue."
      );
    });

    it("Displays an error message when submitting a password greater than 50 characters", () => {
      cy.get("input[id='password']").type("AAAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaH");
      cy.get("[type='submit']").click();
      cy.get("[id='errorMessagepassword']").should(
        "contain",
        "Password cannot exceed 50 characters."
      );
    });

    it("Displays no error message when submitting a valid password", () => {
      cy.get("input[id='password']").type("AAAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
      cy.get("[type='submit']").click();
      cy.get("[id='errorMessagepassword']").should("not.exist");
    });

    it("Sucessfully signs in", () => {
      cy.get("input[id='username']").type("test.user@cds-snc.ca");
      cy.get("input[id='password']").type("testTesttest");
      cy.get("[type='submit']").click();
      cy.url().should("contain", "/auth/policy");
    });
  });
});
