Feature: Identity API

  Scenario: Register an active customer
    Given an email address not used by an account
    When the customer submits a valid name, email and password
    Then the service creates an active customer account
    And the service returns an authenticated session

  Scenario: Reject duplicate email registration
    Given an existing account has an email address
    When another customer registers with that address using different casing
    Then the service rejects the registration

  Scenario: Authenticate an active account
    Given an active account has valid credentials
    When the customer submits the credentials
    Then the service returns an authenticated session

  Scenario: Reject a blocked account
    Given an account is blocked
    When the account owner submits valid credentials
    Then the service denies access

  Scenario: Record health-data consent
    Given an authenticated customer
    When the customer accepts a health-data policy version
    Then the service records the acceptance with its timestamp
