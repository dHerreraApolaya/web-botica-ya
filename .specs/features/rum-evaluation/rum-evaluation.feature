Feature: Isolated Better Stack evaluation
  Scenario: Storefront remains unmonitored
    When the storefront is built or visited
    Then no vendor script is imported or requested

  Scenario: Direct collection remains blocked after the privacy evaluation
    Given valid pilot configuration and explicit consent
    And the browser is on the isolated local pilot without referrer or URL parameters
    When the tester starts the pilot
    Then no vendor script is injected
    And the pilot explains the requirement for backend anonymization

  Scenario: Privacy gate rejects unsafe contexts
    Given consent or privacy review is missing
    Or DNT or Global Privacy Control is enabled
    Or the origin is production or the route contains sensitive context
    When the tester starts the pilot
    Then no script is injected
