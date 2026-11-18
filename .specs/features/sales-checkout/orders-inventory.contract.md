# Orders and Inventory contract

The Orders service owns the seven tables in `001_orders_schema.sql`. Apply that
file once through the migration runner in the independent Orders repository.
Use the shared local PostgreSQL database `boticaya_dev`. Identity keeps
its existing tables in `public` and Orders owns the `orders` schema. Configure
the Orders connection to use that schema and provision its own database role.
Identity owns customer and staff IDs. Catalog owns product IDs and pricing.
Inventory owns warehouse IDs, lot allocations and stock. External IDs are
references without database foreign keys.

## Checkout and pickup

- Allow guest checkout with a required contact email. Never look up an account
  by contact email to attach an order or grant access to account data.
- Issue a cryptographically random guest cart token in an HTTP-only cookie
  and store only its SHA-256 hash. Verify cart ownership on every cart and
  checkout request using that token or the authenticated session. Never
  authorize access by cart ID or contact email alone.
- Derive the order customer ID from the authenticated session when present.
  A guest cart can be claimed only after validating both its token and the
  session. Lock the affected carts and merge with the existing active cart
  if necessary, then invalidate the guest token for the claimed cart. A
  guest order keeps its customer ID empty and remains accessible in its
  originating browser through the authorized cart.
- Read prices on the server and validate applicable prescription requirements
  before creating an order. Request contact and fulfillment fields as needed.
- Lock the cart in the transaction that creates the order, its nonempty item
  snapshot and fulfillment. Calculate the subtotal from the snapshot. Return
  the existing order on retry after validating access to the cart.
- Reserve stock before starting the card charge or confirming a cash pickup.
  Retry a failed card attempt while the reservation remains valid. A late card
  capture after cancellation must be reconciled and refunded if the order
  cannot be fulfilled. Authenticate and deduplicate provider notifications.
- Card is available for delivery and pickup. Cash is available only for pickup.
  Record the authorized staff member and collection timestamp for cash.
- Start the pickup clock after successfully sending the ready notice. Cash
  expires after 24 elapsed hours. Paid card orders expire after five business
  days using the agreed pharmacy calendar in the `America/Lima` time zone.
  Persist the notice and deadline. The calendar and exact cutoff must be
  configured before enabling card pickup.
- At expiry, close the uncollected cash order and release its reservation.
  For a paid uncollected order that the pharmacy closes, release eligible
  stock and request a full refund. Keep the original payment paid and track
  the refund independently. Confirm the refund from the provider response.
- Serialize pickup and expiry decisions on the order. Reject cash collection
  and pickup at or after the persisted deadline. Allow a handover only after
  its inventory consumption is confirmed. Validate regulated dispensations
  through the applicable pharmacy workflow.

## Internal operations

| Operation | Input                                                           | Result                                                  |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Reserve   | Order ID, warehouse ID, item IDs and quantities, initial expiry | Reservation ID, state and expiry, or insufficient stock |
| Extend    | Reservation ID, new expiry                                      | Updated expiry for a held reservation                   |
| Consume   | Reservation ID, order ID                                        | Consumed state and references to inventory movements    |
| Release   | Reservation ID, order ID, reason                                | Released or already expired state                       |
| Read      | Reservation ID or order ID                                      | Current reservation state and expiry                    |

All mutating requests carry a durable idempotency key. Repeating a key with
the same input returns the original result. Reusing it with different input
returns a conflict. Reserve uses the order ID as its stable lookup key.

Inventory allocates eligible lots in earliest expiration order and reserves
all lines atomically. Held quantities reduce sellable availability. Inventory
applies expiry, consume and release under the same reservation lock. Consuming
an expired or released reservation returns a conflict. Releasing a consumed
reservation also returns a conflict. A successful consume creates the stock
movements exactly once.

Orders extends the hold for preparation and for the persisted pickup deadline.
A failed extension blocks publishing a ready notice until reconciled. If the
notice is retried, use a stable notification key and reuse the original
effective notice time. Persist pending commands and reconcile uncertain
results by reading Inventory or the payment provider before retrying.
Service calls and payment operations run outside database transactions.
The orchestration mechanism and its operational storage will be defined when
implementing the independent service.
