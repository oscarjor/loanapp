# Loan Application Portal - Main App

A modern full-stack application built with **TanStack Router**, **tRPC**, and **PostgreSQL** for processing commercial real estate loan applications with automated property valuations.

## Tech Stack

- **Frontend**: React 19 + TanStack Router 1.141.1
- **Backend**: Express + tRPC 11.4.3
- **Database**: PostgreSQL 14 (via Prisma ORM)
- **Styling**: Tailwind CSS 4.1
- **Build Tool**: Vite 7.2
- **Type Safety**: TypeScript 5.7

## Features

- Create and manage loan applications
- Automated property valuation integration
- LTV (Loan-to-Value) ratio calculation
- Automatic approval/rejection based on 75% LTV threshold
- Full type safety from database to frontend via tRPC
- Real-time data synchronization with React Query
- **Interactive API documentation via tRPC Panel**
- Integration tests for complete workflow verification

## Architecture

The application follows a clean architecture pattern:

```
src/
├── server/
│   ├── routers/          # tRPC route definitions
│   │   ├── loan.ts       # Loan CRUD and valuation logic
│   │   └── index.ts      # Root router
│   ├── services/         # Business logic
│   │   ├── valuationClient.ts    # External valuation service client
│   │   └── ltvCalculator.ts      # LTV calculation logic
│   ├── tests/            # Server tests
│   │   └── server_tests.js       # End-to-end workflow tests
│   ├── db.ts             # Prisma client instance
│   ├── trpc.ts           # tRPC initialization
│   └── server.ts         # Express server setup
├── routes/               # TanStack Router pages
│   ├── __root.tsx        # Root layout
│   └── index.tsx         # Home page (loan list)
└── utils/
    └── trpc.ts           # tRPC React client
```

## API Endpoints

### Interactive API Documentation

**tRPC Panel** is available at `http://localhost:3000/panel`

This provides an interactive UI to:
- Browse all available procedures
- View input/output schemas
- Test procedures with live data
- See real-time responses

### tRPC Procedures

All procedures are available at `http://localhost:3000/trpc`

**Queries** (GET):
- `loan.list` - Get all loans with valuations
- `loan.getById` - Get a specific loan by ID

**Mutations** (POST):
- `loan.create` - Create a new loan application
- `loan.update` - Update a draft loan
- `loan.requestValuation` - Request valuation and auto-approve/reject
- `loan.delete` - Delete a draft loan

### Example Usage

```javascript
// Create a loan
fetch('http://localhost:3000/trpc/loan.create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    json: {
      borrowerName: 'John Doe',
      borrowerEmail: 'john@example.com',
      propertyType: 'MULTIFAMILY',
      propertySizeSqft: 25000,
      propertyAgeYears: 5,
      loanAmount: 4000000
    }
  })
})

// Request valuation
fetch('http://localhost:3000/trpc/loan.requestValuation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    json: { loanId: '<loan-id>' }
  })
})
```

## Loan Processing Workflow

1. **Create Loan** - Borrower submits loan application (status: DRAFT)
2. **Request Valuation** - System calls external valuation service
   - Sends property details (type, size, age)
   - Receives estimated property value
3. **Calculate LTV** - System calculates Loan-to-Value ratio
   - Formula: (Loan Amount / Property Value) × 100
4. **Auto Decision** - System applies approval logic
   - LTV ≤ 75% → APPROVED
   - LTV > 75% → REJECTED
5. **Persist Result** - All data saved to PostgreSQL

## Database Schema

### Loan Table
- `id` - UUID primary key
- `borrowerName` - Borrower's full name
- `borrowerEmail` - Contact email
- `propertyType` - MULTIFAMILY | RETAIL | OFFICE | INDUSTRIAL
- `propertySizeSqft` - Property size in square feet
- `propertyAgeYears` - Age of property in years
- `loanAmount` - Requested loan amount (Decimal)
- `status` - DRAFT | PENDING_VALUATION | APPROVED | REJECTED
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Valuation Table
- `id` - UUID primary key
- `loanId` - Foreign key to Loan (one-to-one)
- `estimatedValue` - Property valuation (Decimal)
- `ltvRatio` - Calculated LTV percentage (Decimal)
- `decision` - approved | rejected
- `valuationDate` - Timestamp of valuation
- `createdAt` - Timestamp

## Development

### Prerequisites
- Node.js 20+
- pnpm (or npm)
- PostgreSQL 14+

### Environment Variables

Create a `.env` file:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/loanapp"
VALUATION_SERVICE_URL="http://localhost:8000"
PORT=3000
```

### Running Locally

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

The server will start on `http://localhost:3000`

### Database Management

```bash
# Create a new migration
pnpm db:migrate

# Open Prisma Studio (GUI)
pnpm db:studio
```

## Docker Deployment

The application is containerized and runs as part of a multi-service stack:

```yaml
services:
  - postgres       # PostgreSQL database
  - valuation_service  # Python FastAPI valuation service
  - main_app       # This application
```

Build and run with Docker Compose:

```bash
# Build image
docker-compose build main_app

# Start all services
docker-compose up -d

# View logs
docker-compose logs main_app

# Stop services
docker-compose down
```

## Type Safety

The application leverages TypeScript and tRPC for end-to-end type safety:

1. **Database** → Prisma generates TypeScript types from schema
2. **Backend** → tRPC procedures use Zod for runtime validation
3. **Frontend** → tRPC React Query hooks are fully typed
4. **No code generation needed** - Types flow automatically!

## Testing

### Server Tests

Run the included server test suite to verify the complete workflow:

```bash
# Run from project root
node main_app/src/server/tests/server_tests.js
```

This will test:
- Creating loan applications
- Requesting property valuations
- LTV calculation
- Automated approval/rejection logic
- Database persistence

### Interactive Testing with API Documentation

Open `http://localhost:3000/panel` in your browser to:
- Explore all available API procedures
- View detailed request/response schemas
- Copy curl examples for testing
- See example workflows and responses

## License

MIT
