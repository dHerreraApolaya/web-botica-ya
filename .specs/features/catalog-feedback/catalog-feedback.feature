Feature: Mobile category filters and purchase feedback
  Scenario: Select and deselect multiple categories
    Given the categories do not fit in one mobile row
    When the customer opens the categories drawer
    And selects Medicines and Vitamins
    Then both categories are marked and their products are included
    When a selected category is pressed again
    Then only that category is deselected and the search query is preserved

  Scenario: Category search has no matches
    When the customer searches for an unknown category in the drawer
    Then an empty message is shown without clearing selected categories
    And the drawer can be closed using its close button or Escape
    And focus returns to the category trigger

  Scenario: Add a product successfully
    When a selected quantity within stock is added
    Then the cart count updates and briefly animates
    And a short cart confirmation sounds when sound is enabled

  Scenario: Stock limit or payment failure
    Given the product has reached its stock limit
    Then adding more units is disabled and no success sound plays
    When payment is declined or fails
    Then no order confirmation sound plays

  Scenario: Successful order and accessibility preferences
    When a payment is approved
    Then a distinct order confirmation sounds
    But muted sound or unavailable audio never prevents shopping
    And reduced motion disables decorative animations
