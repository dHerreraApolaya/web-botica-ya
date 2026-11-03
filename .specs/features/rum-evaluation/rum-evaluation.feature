Feature: Isolated Better Stack evaluation
  Scenario: Default storefront and presentation remain unmonitored
    Given RUM evaluation flags are absent
    When the storefront is built or visited
    Then the Better Stack tag is not imported or requested

  Scenario: Start a synthetic pilot
    Given a dedicated free application has privacy collection settings reviewed
    And only its public browser Application Token is configured
    And the browser is on the isolated local pilot without referrer or URL parameters
    When the tester explicitly consents and starts the pilot
    Then the fixed Better Stack tag loads once
    And no storefront state is accessed

  Scenario: Privacy gate rejects unsafe contexts
    Given consent or privacy review is missing
    Or DNT or Global Privacy Control is enabled
    Or the origin is production or the route contains sensitive context
    Then no script is injected

  Scenario: Vendor unavailable
    When the remote script fails
    Then the pilot reports unavailability without logging its token
    And the storefront remains independent
