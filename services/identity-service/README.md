# Botica Ya Identity Service

The service owns account registration, authentication, roles, refresh sessions and health-data consent.

## Local setup

1. Copy `.env.example` to `.env` and set a unique `JWT_ACCESS_SECRET` of at least 32 characters.
2. Start PostgreSQL with `docker compose -f docker-compose.identity.yml up -d` from the repository root.
3. Run `pnpm --filter @boticaya/identity-service build`.
4. Run `pnpm --filter @boticaya/identity-service db:migrate`.
5. Run `pnpm --filter @boticaya/identity-service dev`.

## API

All endpoints are prefixed by `/v1`.

| Method | Route                   | Authentication | Purpose                                 |
| ------ | ----------------------- | -------------- | --------------------------------------- |
| POST   | `/auth/register`        | Public         | Creates a customer account and session. |
| POST   | `/auth/login`           | Public         | Authenticates an active account.        |
| POST   | `/auth/refresh`         | Refresh cookie | Rotates the refresh session.            |
| POST   | `/auth/logout`          | Public         | Revokes the current refresh session.    |
| GET    | `/users/me`             | Access token   | Returns the authenticated profile.      |
| POST   | `/users/:userId/roles`  | Administrator  | Assigns an active role.                 |
| POST   | `/consents/health-data` | Access token   | Records health-data consent.            |
| DELETE | `/consents/health-data` | Access token   | Revokes a health-data consent version.  |

The access token is returned in the response and must remain only in client memory. The refresh token is sent as an HTTP-only, SameSite=Strict cookie.
