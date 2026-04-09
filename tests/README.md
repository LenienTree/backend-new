# LenientTree Backend Tests

This test suite uses [Jest](https://jestjs.io/) and Fastify's built-in `inject` method for high-performance API testing without requiring a running server.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```
   (Already done in this environment)

2. **Run All Tests**:
   ```bash
   npm test
   ```

3. **Run Specific Test File**:
   ```bash
   npm test tests/health.test.ts
   ```

## Test Structure

- `tests/setup.ts`: Global test configuration, including Prisma and JWT mocks.
- `tests/health.test.ts`: Tests for system health and connectivity.
- `tests/auth.test.ts`: Tests for registration, login, and token management.
- `tests/event.test.ts`: Tests for event discovery and details.
- `tests/user.test.ts`: Tests for user profiles and private data (requires auth token).

## Mocking & Authentication

- **Prisma**: The `prisma` client is globally mocked in `tests/setup.ts`. Individual tests should use `(prisma.model.method as jest.Mock).mockResolvedValue(...)` to define behavior.
- **Authentication**: To test protected routes, include a `Bearer valid-token` or `Bearer admin-token` in the `Authorization` header. These tokens are intercepted by the mocked `verifyAccessToken` in `setup.ts`.

## Adding New Tests

1. Create a new `.test.ts` file in the `tests/` directory.
2. Import `app` from `../src/app` and `prisma` from `../src/config/database`.
3. Use `app.inject()` to simulate HTTP requests.
4. Mock the necessary Prisma calls at the start of each test or in `beforeEach`.
