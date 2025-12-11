# Automated Tests

Simple Playwright tests for the Loan Application Portal.

## Overview

This test suite covers:
- **CRUD Operations**: Create, Read, Update, Delete loan applications
- **Valuation Flow**: Property valuation and LTV-based approval/rejection

## Prerequisites

- Node.js 18+ installed
- Backend services must be running:
  - PostgreSQL (port 5432)
  - Valuation Service (port 8000)
- The main app will start automatically when running tests

## Setup

Install dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install chromium
```

## Running Tests

### Run all tests:

```bash
npm test
```

### Run specific test suites:

```bash
# CRUD tests only
npm run test:crud

# Valuation flow tests only
npm run test:valuation
```

### Run tests with visible browser:

```bash
npm run test:headed
```

### Run tests in UI mode (interactive):

```bash
npm run test:ui
```

### View test report:

```bash
npm run report
```

## Test Structure

```
automated_tests/
├── tests/
│   ├── crud.spec.js          # CRUD operation tests
│   └── valuation.spec.js     # Valuation flow tests
├── playwright.config.js       # Playwright configuration
├── package.json
└── README.md
```

## Test Coverage

**Total: 14 tests** ✅ All passing

### CRUD Tests (crud.spec.js) - 7 tests

1. ✅ Create a new loan application
2. ✅ Display all loan applications
3. ✅ Update a draft loan application
4. ✅ Delete a draft loan application
5. ✅ Validate required fields
6. ✅ Validate email format
7. ✅ Validate positive numbers for size and amount

### Valuation Flow Tests (valuation.spec.js) - 7 tests

1. ✅ Approve loan with low LTV ratio (≤75%)
2. ✅ Reject loan with high LTV ratio (>75%)
3. ✅ Display valuation details after completion
4. ✅ Prevent valuation of already submitted loan
5. ✅ Handle valuation for different property types (MULTIFAMILY, RETAIL, OFFICE, INDUSTRIAL)
6. ✅ Calculate depreciation correctly for old properties (40% max depreciation)
7. ✅ Show status transition from DRAFT to final decision

## Configuration

The tests are configured to:
- Run against `http://localhost:3000`
- Automatically start the dev server before tests
- Use Chromium browser by default
- Generate HTML reports
- Retry failed tests in CI environments

To modify these settings, edit [playwright.config.js](playwright.config.js).

## Quick Start

Before running tests, make sure backend services are running:

```bash
# Start PostgreSQL and Valuation Service using Docker Compose
cd ..
docker-compose up -d

# Run tests
cd automated_tests
npm test
```

## Notes

- **Backend services required**: PostgreSQL and Valuation Service must be running before tests
- **Main app auto-start**: The dev server starts automatically via Playwright config
- **Test isolation**: Each test creates its own data, so tests can run in parallel
- **Selectors**: Tests use ID selectors (#borrowerName, #propertyType, etc.) and text content
- **Browser**: Tests run in headless Chromium by default
- **Reports**: HTML reports are generated in `playwright-report/` directory

## Troubleshooting

### Tests fail to start

Ensure backend services are running:
```bash
# Check PostgreSQL
docker ps | grep postgres

# Check Valuation Service
curl http://localhost:8000/api/v1/health
```

### All tests fail

The main app may not have started. Check that:
- Port 3000 is available
- Dependencies are installed in `../main_app`
- Database migrations have been run

### Individual test failures

Review the error context files in `test-results/` directory for detailed debugging information.
