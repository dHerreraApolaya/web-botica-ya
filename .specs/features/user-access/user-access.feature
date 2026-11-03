Feature: Mock login and registration

  Scenario: Navigate to user access
    Given the visitor is viewing the landing page
    When the visitor selects the user entry in the header
    Then the login form is displayed
    And the registration link is available

  Scenario: Submit invalid fields
    When the visitor submits an incomplete form
    Then associated Spanish validation errors are displayed
    And the mock adapter is not called

  Scenario: Toggle password visibility
    When the visitor toggles the password visibility control
    Then the password visibility changes without losing its value
    And the accessible control label reflects the current action

  Scenario: Sign in with a mock active user
    Given an active fictional user exists in the static JSON dataset
    When the visitor submits that email and a valid demonstration password
    Then a simulated session is shown in the header
    And no password or token is persisted

  Scenario Outline: Handle failed mock sign-in
    Given the mock adapter returns <outcome>
    When the visitor submits a valid login form
    Then recoverable Spanish feedback is displayed
    And the visitor can retry

    Examples:
      | outcome         |
      | unknown account |
      | blocked account |
      | service error   |

  Scenario: Prevent duplicate pending submissions
    Given the mock adapter response is delayed
    When the visitor submits the form more than once
    Then only one operation is started
    And a pending state is announced until completion

  Scenario: Register and use a simulated account
    Given the registration email does not exist in the mock dataset
    When the visitor submits valid fields and matching passwords
    Then registration succeeds in memory
    And the account can be used by the login simulation until reload

  Scenario: Reject duplicate registration
    Given a fictional user's email already exists
    When the visitor registers with that email using different casing or surrounding whitespace
    Then a duplicate-email message is displayed

  Scenario: Reject mismatched confirmation
    When the visitor submits different password and confirmation values
    Then a confirmation error is associated with the field
    And registration is not submitted

  Scenario: Sign out of a simulated session
    Given a simulated session is active
    When the visitor signs out
    Then the header displays the user entry again
    And the simulated session is cleared

  Scenario: Exercise fixture volume deterministically
    Given the JSON fixture contains 1000 unique fictional users
    When tests validate all records and query their normalized emails
    Then every user is found with the expected identity and status
    And the tests make no network requests

  Scenario: Display long user names on mobile
    Given the simulated user has a long accented name
    When the viewport is 375 pixels wide
    Then the header and forms have no horizontal overflow
    And all form controls remain accessible
