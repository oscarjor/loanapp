# Main Application

TanStack Start application with tRPC API for managing commercial real estate loan applications.

## Features

- **Loan Management**: Create, update, view, and manage loan applications
- **Property Valuation**: Request valuations from the Python microservice
- **LTV Calculation**: Automatic Loan-to-Value calculation and approval decisions
- **Type-Safe API**: tRPC provides end-to-end type safety
- **Database**: PostgreSQL with Prisma ORM

## Tech Stack

- **Framework**: TanStack Start (React with SSR)
- **API**: tRPC v11
- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Validation**: Zod
- **Language**: TypeScript

## Project Structure

```
main_app/
├── app/                        # Frontend application
│   ├── routes/                 # Pages and routing
│   ├── components/             # React components
│   └── styles/                 # Tailwind CSS
├── server/                     # Backend
│   ├── trpc/
│   │   ├── context.ts          # tRPC context
│   │   ├── trpc.ts             # tRPC setup
│   │   ├── router.ts           # Root router
│   │   └── routers/
│   │       └── loan.ts         # Loan procedures
│   ├── services/
│   │   ├── valuationClient.ts  # HTTP client for valuation service
│   │   └── ltvCalculator.ts    # LTV calculation logic
│   └── db/
│       └── client.ts           # Prisma client
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Valuation service running on port 8000

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your database credentials
# DATABASE_URL="postgresql://postgres:password@localhost:5432/loanapp"

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Application runs at: http://localhost:3000

## Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Build
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes (dev only)
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database (if seed file exists)
```

## Database Schema

### Loan Model

```prisma
model Loan {
  id                String       @id @default(uuid())
  borrowerName      String
  borrowerEmail     String
  borrowerPhone     String?
  propertyType      PropertyType // MULTIFAMILY | RETAIL | OFFICE | INDUSTRIAL
  propertySizeSqft  Int
  propertyAgeYears  Int
  propertyAddress   String?
  loanAmount        Decimal
  status            LoanStatus   // DRAFT | PENDING_VALUATION | APPROVED | REJECTED
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  valuation         Valuation?
}
```

### Valuation Model

```prisma
model Valuation {
  id              String   @id @default(uuid())
  loanId          String   @unique
  estimatedValue  Decimal
  ltvRatio        Decimal
  decision        String   // 'approved' | 'rejected'
  valuationDate   DateTime @default(now())
  methodology     String?
  loan            Loan     @relation(fields: [loanId], references: [id])
}
```

## tRPC API

### Available Procedures

#### `loan.list`
Get all loan applications with their valuations.

```typescript
const loans = await trpc.loan.list.query()
```

#### `loan.getById`
Get a single loan by ID.

```typescript
const loan = await trpc.loan.getById.query({ id: 'uuid' })
```

#### `loan.create`
Create a new loan application.

```typescript
const loan = await trpc.loan.create.mutate({
  borrowerName: 'John Doe',
  borrowerEmail: 'john@example.com',
  borrowerPhone: '555-1234',
  propertyType: 'MULTIFAMILY',
  propertySizeSqft: 50000,
  propertyAgeYears: 15,
  propertyAddress: '123 Main St',
  loanAmount: 5000000,
})
```

#### `loan.update`
Update a loan application (only if status is DRAFT).

```typescript
const loan = await trpc.loan.update.mutate({
  id: 'uuid',
  loanAmount: 5500000,
})
```

#### `loan.requestValuation`
Request property valuation and get approval decision.

```typescript
const valuation = await trpc.loan.requestValuation.mutate({
  loanId: 'uuid',
})
```

This procedure:
1. Calls the valuation service
2. Calculates LTV ratio
3. Makes approval decision (LTV ≤ 75% = approved)
4. Updates loan status

#### `loan.delete`
Delete a loan (only if status is DRAFT).

```typescript
await trpc.loan.delete.mutate({ id: 'uuid' })
```

## Services

### ValuationClient

HTTP client for communicating with the Python valuation service.

```typescript
import { valuationClient } from '@/services/valuationClient'

const result = await valuationClient.requestValuation({
  property_type: 'MULTIFAMILY',
  size_sqft: 50000,
  age_years: 15,
})

// Health check
const isHealthy = await valuationClient.healthCheck()
```

### LtvCalculator

Calculates Loan-to-Value ratio and makes approval decisions.

```typescript
import { ltvCalculator } from '@/services/ltvCalculator'

const result = ltvCalculator.calculate(
  loanAmount: 5000000,
  propertyValue: 8500000,
)

// result: { ltvRatio: 58.82, decision: 'approved' }
```

## Environment Variables

```bash
# Database connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/loanapp"

# Valuation service
VALUATION_SERVICE_URL="http://localhost:8000"
VALUATION_SERVICE_TIMEOUT=5000

# Server
PORT=3000
NODE_ENV=development
```

## Error Handling

The tRPC API provides structured error handling:

```typescript
try {
  const valuation = await trpc.loan.requestValuation.mutate({ loanId })
} catch (error) {
  if (error.data?.code === 'NOT_FOUND') {
    // Loan not found
  } else if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
    // Valuation service error
  }
}
```

## Workflow Example

```typescript
// 1. Create a loan application
const loan = await trpc.loan.create.mutate({
  borrowerName: 'Jane Smith',
  borrowerEmail: 'jane@example.com',
  propertyType: 'OFFICE',
  propertySizeSqft: 30000,
  propertyAgeYears: 10,
  loanAmount: 4000000,
})

// Status: DRAFT

// 2. Request valuation
const valuation = await trpc.loan.requestValuation.mutate({
  loanId: loan.id,
})

// valuation: {
//   estimatedValue: 5400000,
//   ltvRatio: 74.07,
//   decision: 'approved'
// }

// Status: APPROVED

// 3. View the loan with valuation
const updatedLoan = await trpc.loan.getById.query({ id: loan.id })

console.log(updatedLoan.status) // 'APPROVED'
console.log(updatedLoan.valuation) // Valuation details
```

## Development Tips

### Database Reset

```bash
# Reset database (deletes all data)
npx prisma migrate reset

# Push schema without migrations (dev only)
npm run db:push
```

### Type Generation

Prisma automatically generates TypeScript types. After schema changes:

```bash
npm run db:generate
```

### Debugging

Enable Prisma query logging in [client.ts](server/db/client.ts):

```typescript
const db = new PrismaClient({
  log: ['query', 'error', 'warn'],
})
```

## Architecture Notes

- **Stateless Design**: Server is stateless, all state in PostgreSQL
- **Type Safety**: Full type safety from database to frontend via Prisma + tRPC
- **Error Recovery**: Valuation errors revert loan status to DRAFT
- **Validation**: Zod schemas validate all inputs
- **Service Communication**: HTTP client with timeout and error handling

## See Also

- [Root README](../README.md) - Project overview
- [Valuation Service](../valuation_service/README.md) - Python microservice
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
