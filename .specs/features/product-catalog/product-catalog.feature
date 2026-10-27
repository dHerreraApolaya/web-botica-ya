Feature: Local featured products and catalog search
  Visitors explore fictional products using the existing landing page.

  Scenario: View featured products
    Given the local catalog contains exactly 500 products with unique IDs and SKUs
    When the visitor opens the landing page
    Then eight available featured products are displayed
    And prices are formatted in Peruvian soles

  Scenario: Search using normalized terms
    Given a product matches all requested terms across its searchable fields
    When the visitor submits those terms with different casing, accents, or spacing
    Then matching products and the total result count are displayed
    And at most twelve products are rendered on the current page

  Scenario: Submit search using the keyboard
    Given the visitor enters a product name in the labeled search input
    When the visitor presses Enter
    Then the same results appear as when clicking the search button

  Scenario: Filter using an existing category button
    When the visitor selects a category in the hero
    Then only products in that category are displayed
    And pagination starts on the first page

  Scenario: Browse the complete catalog
    When the visitor submits an empty or whitespace-only query
    Then the result count is 500
    And the first twelve products are displayed

  Scenario: Navigate results
    Given more than twelve products match the search
    When the visitor navigates to the next page
    Then the next products are displayed without duplicates from the previous page
    And pagination controls reflect the current page and available boundaries

  Scenario: Replace a search from a later page
    Given the visitor is on a later results page
    When the visitor submits a new query
    Then the new results start on the first page

  Scenario: Search has no matches
    When the visitor submits a query with no matching products
    Then an accessible empty-results message is displayed
    And the visitor can clear the search

  Scenario: Restore the initial view
    Given the visitor is viewing search results
    When the visitor clears the search
    Then the search input is cleared
    And the initial featured products view is restored

  Scenario: Use the catalog on a narrow screen
    Given the viewport is 375 pixels wide
    When featured products or search results are displayed
    Then the layout has no horizontal overflow
    And search and pagination controls remain keyboard accessible
