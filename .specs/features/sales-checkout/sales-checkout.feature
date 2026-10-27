Feature: Mock sales checkout from catalog to confirmation

  Scenario: Add products from catalog search
    Given matching available products are displayed
    When the visitor adds the same product twice
    Then the cart contains one line with quantity two
    And the header count and totals reflect the cart

  Scenario: Enforce mock stock boundaries
    Given a product has reached its mock stock limit
    When the visitor attempts to add another unit
    Then the quantity remains within the limit
    And actionable feedback is displayed

  Scenario: Handle an empty cart
    When the visitor removes the last cart line
    Then an empty-cart message links back to the catalog
    And checkout cannot proceed

  Scenario: Skip prescription for unrestricted mock items
    Given no cart item requires a prescription
    When the visitor proceeds from the cart
    Then the fulfillment step is displayed

  Scenario: Complete a synthetic prescription review
    Given at least one cart item requires a prescription
    When the visitor selects a synthetic sample prescription
    Then the review is shown as pending
    And progression remains blocked until the mock adapter approves it

  Scenario Outline: Reject invalid prescription inputs
    When the visitor selects a file with <problem>
    Then a clear validation message is displayed
    And no mock approval is granted

    Examples:
      | problem               |
      | an unsupported format |
      | a size over five MB   |

  Scenario: Retry a rejected mock prescription
    Given the mock adapter rejects the selected prescription
    When the visitor replaces it and requests review again
    Then the mock adapter can approve the replacement

  Scenario: Invalidate prescription after cart changes
    Given prescription-required products have mock approval
    When their contents or quantities change
    Then the old approval is discarded
    And checkout requires review of the changed cart

  Scenario: Choose delivery
    When the visitor enters a complete address in a fixture-supported district
    Then delivery is available
    And the mock delivery fee appears in the total

  Scenario: Choose pharmacy pickup
    When the visitor selects an available fictional pharmacy
    Then pickup details appear in the summary
    And the delivery fee is zero

  Scenario: Validate contact and review the order
    Given the cart, prescription, and fulfillment steps are complete
    When the visitor provides valid contact fields and selects a synthetic payment option
    Then the full order summary is displayed before payment submission
    And earlier details can be edited

  Scenario: Complete a mock payment
    Given the visitor is reviewing a valid order
    When the visitor confirms and the mock gateway approves
    Then a demonstration order identifier and snapshot are displayed
    And the cart is cleared only after the snapshot is created

  Scenario Outline: Recover from payment failure
    Given the mock gateway returns <outcome>
    When the visitor confirms the order
    Then actionable feedback is displayed
    And the cart is preserved for retry

    Examples:
      | outcome       |
      | declined      |
      | service error |

  Scenario: Prevent duplicate payment submission
    Given a mock payment request is pending
    When the visitor confirms again
    Then only one gateway operation is started
    And cart editing is disabled until the attempt finishes

  Scenario: Prevent incomplete checkout navigation
    Given the visitor has not completed required steps
    When the visitor opens the review route directly
    Then the earliest incomplete step is displayed

  Scenario: Use the flow on mobile
    Given the viewport is 375 pixels wide
    When the visitor proceeds through cart and checkout
    Then the layout has no horizontal overflow
    And each step remains keyboard accessible
