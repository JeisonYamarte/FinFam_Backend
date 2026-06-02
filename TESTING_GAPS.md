# Testing Gaps and Priorities

This document tracks missing high-impact unit tests and the implementation order.

## Current status

- P0 implemented:
  - `src/modules/expenses/expenses.service.spec.ts`
  - `src/modules/closure/closure.service.spec.ts`
- Unit tests added in this phase are isolated and use mocks.
- No real keys or external services are required for these unit suites.

## Critical gaps (next)

1. Invitation flow (`src/modules/invitation/invitation.service.ts`)

- TTL expiration behavior in Redis-backed flow
- Duplicate invitation conflict paths
- Accept/decline cleanup behavior

1. Homes business rules (`src/modules/home/homes.service.ts`)

- Filtering only active memberships
- Access behavior for users removed from household
- Member visibility constraints by household

1. Membership role integrity (`src/modules/member/member.service.ts`)

- Protect household from losing the last admin
- Role transition guardrails
- Active/inactive membership counting correctness

1. Auth flows (`src/modules/auth/auth.service.ts`)

- Refresh token rotation and invalid session behavior
- Logout invalidation behavior
- Token payload consistency and guard interaction

## Recommendation for CI gates

1. Keep P0/P1 unit tests mandatory in CI.
2. Keep unit tests isolated from infra and real secrets.
3. Keep e2e in separate CI job with ephemeral Postgres/Redis services.
4. Add coverage threshold gradually after P1 suites are merged.
