# Identity Service

## Objective

Provide account registration, password authentication, session management, role assignment and auditable health-data consent for Botica Ya.

## Scope

- Register customers using a normalized email and password.
- Authenticate active accounts.
- Issue short-lived access tokens and rotate refresh sessions through an HTTP-only cookie.
- Maintain many-to-many roles for customers, administrators and pharmacists.
- Record and revoke health-data processing consent.

## Out of Scope

- Email and phone verification.
- Password recovery.
- Prescription files and prescription review.
- Social authentication.

## Data Ownership

The service owns users, roles, user-role assignments, sessions and consents. Other services retain only user identifiers and never query this database directly.
