Feature: Express catalog compatibility and pending orders
  Scenario: Read the existing catalog
    Given the existing boticaya_dev contains BY-0001 with 5 available units
    When GET /api/products is served by Express
    Then the response is the same JSON array contract as Spring Boot
    And BY-0001 has availableQuantity 5

  Scenario: Database access is unavailable
    Given PostgreSQL cannot execute the catalog query
    When GET /api/products is requested
    Then the response is HTTP 503 without database details or fixture products

  Scenario: Receive an order
    Given order reception is enabled and a product has 5 units
    When a valid pending order requests 2 units with a new idempotency key
    Then the order and its lines are saved atomically
    And the available quantity is 3
    And prices come from PostgreSQL

  Scenario: Retry a confirmed request
    Given a pending order has already reserved 2 units
    When the same order and idempotency key are sent again
    Then the original order is returned
    And no additional units are reserved

  Scenario: Prevent concurrent overselling
    Given a product has 5 available units
    When two different orders concurrently request 4 units each
    Then exactly one order is accepted
    And the other receives HTTP 409
    And the available quantity is 1

  Scenario: Roll back a failed multi-line order
    Given an order contains multiple available products
    When persisting a later line fails
    Then all earlier line inserts and stock changes are rolled back

  Scenario: Keep order reception disabled before cutover
    Given the default backend configuration
    When POST /api/orders is requested
    Then the response is HTTP 404
