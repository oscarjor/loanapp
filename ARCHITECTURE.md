# Loan Application Portal - Architecture Document

## Overview

This document defines the technical architecture for the Loan Application Portal, a commercial real estate lending platform consisting of two microservices that communicate over HTTP.

---

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Main Application                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TanStack Start (React + SSR)                          │ │
│  │  - Pages & Components (Tailwind CSS)                   │ │
│  │  - Client-side tRPC queries                            │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  tRPC API Layer                                        │ │
│  │  - Loan CRUD procedures                                │ │
│  │  - Valuation request orchestration                     │ │
│  │  - Input validation (Zod)                              │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  Service Layer                                         │ │
│  │  - Business logic                                      │ │
│  │  - HTTP client for valuation service ──────┐          │ │
│  └────────────────┬───────────────────────────│──────────┘ │
│                   │                            │             │
│  ┌────────────────▼────────────────────────┐  │             │
│  │  Prisma ORM                             │  │             │
│  └────────────────┬────────────────────────┘  │             │
└───────────────────┼───────────────────────────┼─────────────┘
                    │                            │ HTTP
                    ▼                            ▼
         ┌──────────────────┐      ┌─────────────────────────┐
         │   PostgreSQL     │      │  Valuation Service      │
         │                  │      │  ┌───────────────────┐  │
         │  - loans table   │      │  │  FastAPI          │  │
         │  - valuations    │      │  │  - POST /valuate  │  │
         │    table         │      │  └─────────┬─────────┘  │
         └──────────────────┘      │            │             │
                                   │  ┌─────────▼─────────┐  │
                                   │  │ Valuation Engine  │  │
                                   │  │ - Property logic  │  │
                                   │  └───────────────────┘  │
                                   └─────────────────────────┘
```

### Technology Stack

#### Main Application (Port: 3000)
- **Framework**: TanStack Start (React with SSR)
- **Styling**: Tailwind CSS
- **API**: tRPC (type-safe RPC)
- **ORM**: Prisma (PostgreSQL)
- **Validation**: Zod
- **HTTP Client**: fetch / axios
- **Language**: TypeScript

#### Valuation Service (Port: 8000)
- **Framework**: FastAPI
- **Validation**: Pydantic
- **Language**: Python 3.9+
- **Runtime**: Uvicorn

#### Database
- **RDBMS**: PostgreSQL 14+
- **Access**: Via Prisma ORM from main app only

---

## Repository Structure

```
loan-application-portal/
├── main_app/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── index.tsx                 # Home page (loan list)
│   │   │   ├── loans/
│   │   │   │   ├── new.tsx               # Create loan form
│   │   │   │   └── [id].tsx              # Loan detail/edit
│   │   │   └── __root.tsx                # Root layout
│   │   ├── components/
│   │   │   ├── LoanForm.tsx              # Loan entry form
│   │   │   ├── LoanList.tsx              # Applications table
│   │   │   ├── ValuationResults.tsx      # Display valuation
│   │   │   └── ErrorBoundary.tsx         # Error handling
│   │   └── styles/
│   │       └── globals.css               # Tailwind imports
│   ├── server/
│   │   ├── trpc/
│   │   │   ├── router.ts                 # Root tRPC router
│   │   │   ├── context.ts                # Request context
│   │   │   └── routers/
│   │   │       └── loan.ts               # Loan procedures
│   │   ├── services/
│   │   │   ├── loanService.ts            # Business logic
│   │   │   ├── valuationClient.ts        # HTTP client
│   │   │   └── ltvCalculator.ts          # LTV logic
│   │   └── db/
│   │       ├── client.ts                 # Prisma instance
│   │       └── seed.ts                   # Optional seed data
│   ├── prisma/
│   │   ├── schema.prisma                 # Database schema
│   │   └── migrations/                   # Migration history
│   ├── app.config.ts                     # TanStack Start config
│   ├── tailwind.config.ts                # Tailwind config
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── valuation_service/
│   ├── app/
│   │   ├── main.py                       # FastAPI app entry
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py                 # API endpoints
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── request.py                # Pydantic request models
│   │   │   └── response.py               # Pydantic response models
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── valuation_engine.py       # Valuation logic
│   │   └── config.py                     # Configuration
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_valuation.py             # Unit tests
│   ├── requirements.txt
│   └── .env.example
│
├── README.md
├── requirements.md
└── ARCHITECTURE.md (this file)
```

---

## Data Model

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum PropertyType {
  MULTIFAMILY
  RETAIL
  OFFICE
  INDUSTRIAL
}

enum LoanStatus {
  DRAFT
  PENDING_VALUATION
  APPROVED
  REJECTED
}

model Loan {
  id                String       @id @default(uuid())
  
  // Borrower info
  borrowerName      String       @map("borrower_name")
  borrowerEmail     String       @map("borrower_email")
  borrowerPhone     String?      @map("borrower_phone")
  
  // Property details
  propertyType      PropertyType @map("property_type")
  propertySizeSqft  Int          @map("property_size_sqft")
  propertyAgeYears  Int          @map("property_age_years")
  propertyAddress   String?      @map("property_address")
  
  // Loan details
  loanAmount        Decimal      @map("loan_amount") @db.Decimal(15, 2)
  
  // Status
  status            LoanStatus   @default(DRAFT)
  
  // Timestamps
  createdAt         DateTime     @default(now()) @map("created_at")
  updatedAt         DateTime     @updatedAt @map("updated_at")
  
  // Relations
  valuation         Valuation?
  
  @@map("loans")
}

model Valuation {
  id                String    @id @default(uuid())
  
  // Foreign key
  loanId            String    @unique @map("loan_id")
  loan              Loan      @relation(fields: [loanId], references: [id], onDelete: Cascade)
  
  // Valuation results
  estimatedValue    Decimal   @map("estimated_value") @db.Decimal(15, 2)
  ltvRatio          Decimal   @map("ltv_ratio") @db.Decimal(5, 2)
  decision          String    // 'approved' | 'rejected'
  
  // Metadata
  valuationDate     DateTime  @default(now()) @map("valuation_date")
  methodology       String?   // Optional description
  
  @@map("valuations")
}
```

### SQL (Generated by Prisma)

```sql
-- Loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_name VARCHAR(255) NOT NULL,
  borrower_email VARCHAR(255) NOT NULL,
  borrower_phone VARCHAR(50),
  property_type VARCHAR(20) NOT NULL CHECK (property_type IN ('MULTIFAMILY', 'RETAIL', 'OFFICE', 'INDUSTRIAL')),
  property_size_sqft INTEGER NOT NULL CHECK (property_size_sqft > 0),
  property_age_years INTEGER NOT NULL CHECK (property_age_years >= 0),
  property_address TEXT,
  loan_amount DECIMAL(15, 2) NOT NULL CHECK (loan_amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_VALUATION', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Valuations table
CREATE TABLE valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL UNIQUE REFERENCES loans(id) ON DELETE CASCADE,
  estimated_value DECIMAL(15, 2) NOT NULL,
  ltv_ratio DECIMAL(5, 2) NOT NULL,
  decision VARCHAR(20) NOT NULL,
  valuation_date TIMESTAMP NOT NULL DEFAULT NOW(),
  methodology TEXT
);

-- Indexes
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_created_at ON loans(created_at DESC);
CREATE INDEX idx_valuations_loan_id ON valuations(loan_id);
```

---

## API Contracts

### tRPC Procedures (Main App)

```typescript
// server/trpc/routers/loan.ts

export const loanRouter = router({
  // Get all loans
  list: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.loan.findMany({
        include: { valuation: true },
        orderBy: { createdAt: 'desc' }
      });
    }),

  // Get single loan by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.loan.findUnique({
        where: { id: input.id },
        include: { valuation: true }
      });
    }),

  // Create new loan
  create: publicProcedure
    .input(z.object({
      borrowerName: z.string().min(1),
      borrowerEmail: z.string().email(),
      borrowerPhone: z.string().optional(),
      propertyType: z.enum(['MULTIFAMILY', 'RETAIL', 'OFFICE', 'INDUSTRIAL']),
      propertySizeSqft: z.number().int().positive(),
      propertyAgeYears: z.number().int().min(0),
      propertyAddress: z.string().optional(),
      loanAmount: z.number().positive()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.loan.create({ data: input });
    }),

  // Update existing loan
  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      // ... same fields as create
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.loan.update({
        where: { id },
        data
      });
    }),

  // Request valuation
  requestValuation: publicProcedure
    .input(z.object({ loanId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch loan
      const loan = await ctx.db.loan.findUnique({
        where: { id: input.loanId }
      });
      
      if (!loan) throw new Error('Loan not found');
      
      // 2. Update status
      await ctx.db.loan.update({
        where: { id: input.loanId },
        data: { status: 'PENDING_VALUATION' }
      });
      
      // 3. Call valuation service
      const valuationResult = await callValuationService({
        propertyType: loan.propertyType,
        sizeSqft: loan.propertySizeSqft,
        ageYears: loan.propertyAgeYears
      });
      
      // 4. Calculate LTV
      const ltvRatio = (Number(loan.loanAmount) / valuationResult.estimatedValue) * 100;
      const decision = ltvRatio <= 75 ? 'approved' : 'rejected';
      
      // 5. Save valuation
      const valuation = await ctx.db.valuation.create({
        data: {
          loanId: input.loanId,
          estimatedValue: valuationResult.estimatedValue,
          ltvRatio: ltvRatio,
          decision: decision,
          methodology: valuationResult.methodology
        }
      });
      
      // 6. Update loan status
      await ctx.db.loan.update({
        where: { id: input.loanId },
        data: { status: decision === 'approved' ? 'APPROVED' : 'REJECTED' }
      });
      
      return valuation;
    })
});
```

### REST API (Valuation Service)

**Endpoint**: `POST /api/v1/valuate`

**Request Body**:
```json
{
  "property_type": "MULTIFAMILY" | "RETAIL" | "OFFICE" | "INDUSTRIAL",
  "size_sqft": 50000,
  "age_years": 15
}
```

**Response Body (Success - 200)**:
```json
{
  "estimated_value": 8500000.00,
  "valuation_date": "2024-12-11T10:30:00Z",
  "methodology": "Base rate with age depreciation",
  "breakdown": {
    "base_value": 10000000.00,
    "depreciation_factor": 0.15,
    "final_value": 8500000.00
  }
}
```

**Response Body (Error - 422)**:
```json
{
  "detail": [
    {
      "loc": ["body", "size_sqft"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error"
    }
  ]
}
```

**Response Body (Error - 500)**:
```json
{
  "detail": "Internal server error during valuation calculation"
}
```

---

## Service Layer Design

### Main Application Services

#### 1. Loan Service (`loanService.ts`)

```typescript
export class LoanService {
  constructor(
    private db: PrismaClient,
    private valuationClient: ValuationClient
  ) {}

  async createLoan(data: CreateLoanInput): Promise<Loan> {
    // Validation and business logic
    return this.db.loan.create({ data });
  }

  async requestValuation(loanId: string): Promise<Valuation> {
    // Orchestrates the valuation workflow
    // 1. Fetch loan
    // 2. Call valuation service
    // 3. Calculate LTV
    // 4. Store results
    // 5. Update loan status
  }
}
```

#### 2. Valuation Client (`valuationClient.ts`)

```typescript
export class ValuationClient {
  private baseUrl: string;
  private timeout: number;

  async requestValuation(request: ValuationRequest): Promise<ValuationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/valuate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new ValuationServiceError(
          `Service returned ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      // Handle network errors, timeouts, etc.
      throw new ValuationServiceError('Failed to contact valuation service');
    }
  }
}
```

#### 3. LTV Calculator (`ltvCalculator.ts`)

```typescript
export class LtvCalculator {
  private readonly APPROVAL_THRESHOLD = 75;

  calculate(loanAmount: number, propertyValue: number) {
    const ltvRatio = (loanAmount / propertyValue) * 100;
    const decision = ltvRatio <= this.APPROVAL_THRESHOLD ? 'approved' : 'rejected';
    
    return { ltvRatio, decision };
  }
}
```

### Valuation Service Components

#### 1. Valuation Engine (`valuation_engine.py`)

```python
from enum import Enum
from decimal import Decimal

class PropertyType(str, Enum):
    MULTIFAMILY = "MULTIFAMILY"
    RETAIL = "RETAIL"
    OFFICE = "OFFICE"
    INDUSTRIAL = "INDUSTRIAL"

class ValuationEngine:
    # Base rates per square foot
    BASE_RATES = {
        PropertyType.MULTIFAMILY: Decimal("200"),
        PropertyType.RETAIL: Decimal("150"),
        PropertyType.OFFICE: Decimal("180"),
        PropertyType.INDUSTRIAL: Decimal("100"),
    }
    
    # Depreciation: 1% per year, max 40%
    MAX_DEPRECIATION = Decimal("0.40")
    ANNUAL_DEPRECIATION = Decimal("0.01")
    
    def calculate_value(
        self,
        property_type: PropertyType,
        size_sqft: int,
        age_years: int
    ) -> dict:
        """
        Calculate estimated property value.
        
        Formula:
        1. Base value = size * base_rate[property_type]
        2. Depreciation = min(age * 0.01, 0.40)
        3. Final value = base_value * (1 - depreciation)
        """
        base_rate = self.BASE_RATES[property_type]
        base_value = Decimal(size_sqft) * base_rate
        
        depreciation = min(
            Decimal(age_years) * self.ANNUAL_DEPRECIATION,
            self.MAX_DEPRECIATION
        )
        
        estimated_value = base_value * (Decimal("1") - depreciation)
        
        return {
            "estimated_value": float(estimated_value),
            "breakdown": {
                "base_value": float(base_value),
                "depreciation_factor": float(depreciation),
                "final_value": float(estimated_value)
            },
            "methodology": f"Base rate (${base_rate}/sqft) with {float(depreciation)*100:.1f}% age depreciation"
        }
```

---

## Error Handling Strategy

### Error Categories

1. **Validation Errors** (400)
   - Invalid input data
   - Missing required fields
   - Type mismatches

2. **Service Communication Errors** (502/503)
   - Valuation service unreachable
   - Network timeouts
   - Service temporarily down

3. **Business Logic Errors** (422)
   - Invalid state transitions
   - Business rule violations

4. **Database Errors** (500)
   - Connection failures
   - Query errors
   - Constraint violations

### Error Handling Implementation

#### Main App (tRPC)

```typescript
// Custom error classes
export class ValuationServiceError extends Error {
  code = 'VALUATION_SERVICE_ERROR';
}

// Error handling in procedures
requestValuation: publicProcedure
  .mutation(async ({ ctx, input }) => {
    try {
      // ... valuation logic
    } catch (error) {
      if (error instanceof ValuationServiceError) {
        throw new TRPCError({
          code: 'SERVICE_UNAVAILABLE',
          message: 'Valuation service is temporarily unavailable. Please try again later.',
          cause: error
        });
      }
      throw error;
    }
  })
```

#### Valuation Service (FastAPI)

```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error during valuation"}
    )
```

#### UI Error Display

```typescript
// ErrorBoundary component
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="text-red-800 font-semibold">Something went wrong</h3>
      <p className="text-red-600 mt-2">{error.message}</p>
    </div>
  );
}
```

---

## Environment Configuration

### Main App (`.env`)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/loan_portal"

# Valuation Service
VALUATION_SERVICE_URL="http://localhost:8000"
VALUATION_SERVICE_TIMEOUT=5000  # milliseconds

# Server
PORT=3000
NODE_ENV=development
```

### Valuation Service (`.env`)

```bash
# Server
PORT=8000
HOST=0.0.0.0

# CORS (for local development)
ALLOWED_ORIGINS=http://localhost:3000

# Logging
LOG_LEVEL=INFO
```

---

## Development Workflow

### Setup Steps

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd loan-application-portal
   ```

2. **Setup PostgreSQL**
   ```bash
   # Using Docker
   docker run --name loan-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14
   ```

3. **Setup Main App**
   ```bash
   cd main_app
   npm install
   cp .env.example .env
   # Edit .env with database credentials
   npx prisma migrate dev
   npx prisma generate
   npm run dev
   ```

4. **Setup Valuation Service**
   ```bash
   cd valuation_service
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   python -m uvicorn app.main:app --reload --port 8000
   ```

### Running Both Services

**Terminal 1** (Main App):
```bash
cd main_app && npm run dev
# http://localhost:3000
```

**Terminal 2** (Valuation Service):
```bash
cd valuation_service && uvicorn app.main:app --reload --port 8000
# http://localhost:8000/docs (Swagger UI)
```

---

## Testing Strategy

### Unit Tests

**Main App** (Vitest):
```typescript
// tests/ltvCalculator.test.ts
describe('LtvCalculator', () => {
  it('should approve loans with LTV <= 75%', () => {
    const calculator = new LtvCalculator();
    const result = calculator.calculate(750000, 1000000);
    expect(result.ltvRatio).toBe(75);
    expect(result.decision).toBe('approved');
  });
});
```

**Valuation Service** (pytest):
```python
# tests/test_valuation.py
def test_multifamily_valuation():
    engine = ValuationEngine()
    result = engine.calculate_value(
        property_type=PropertyType.MULTIFAMILY,
        size_sqft=10000,
        age_years=10
    )
    assert result["estimated_value"] > 0
    assert result["breakdown"]["depreciation_factor"] == 0.10
```

### Integration Tests

```typescript
// tests/integration/valuation.test.ts
describe('Valuation Integration', () => {
  it('should complete end-to-end valuation flow', async () => {
    // 1. Create loan
    const loan = await trpc.loan.create.mutate({ ... });
    
    // 2. Request valuation
    const valuation = await trpc.loan.requestValuation.mutate({
      loanId: loan.id
    });
    
    // 3. Verify results
    expect(valuation.estimatedValue).toBeGreaterThan(0);
    expect(valuation.ltvRatio).toBeDefined();
    expect(valuation.decision).toMatch(/approved|rejected/);
  });
});
```

---

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields (`status`, `created_at`)
- Use of UUID for distributed systems
- Cascading deletes for data integrity

### API Optimization
- HTTP connection pooling in valuation client
- Request timeouts to prevent hanging
- Caching of valuation results (optional)

### Error Recovery
- Retry logic with exponential backoff
- Circuit breaker pattern for valuation service
- Graceful degradation when service is down

---

## Security Considerations

### Input Validation
- Zod schemas on tRPC procedures
- Pydantic models on FastAPI endpoints
- SQL injection prevention via Prisma

### CORS Configuration
- Restrict origins in production
- Development: Allow localhost:3000

### Data Privacy
- No sensitive financial data in logs
- Sanitize error messages for users

---

## Future Scalability

Future Scalability
Event-Driven Architecture Migration
Current State: Synchronous HTTP request/response
Future State: Asynchronous event-driven with message queue
Why Event-Driven for Valuation Service?

ML Model Integration: Machine learning models can take seconds to minutes
Resource Management: Decouple request handling from compute-intensive work
Reliability: Retry failed valuations without user intervention
Scalability: Independent scaling of API and processing workers

Proposed Architecture Evolution
┌─────────────────────────────────────────────────────────────────┐
│                    Main Application                              │
│                                                                  │
│  tRPC Mutation: requestValuation()                              │
│         │                                                        │
│         ├─ 1. Update loan status to PENDING_VALUATION           │
│         ├─ 2. Publish event to message queue                    │
│         └─ 3. Return immediately (non-blocking)                 │
│                                                                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  Message Queue   │
              │  (RabbitMQ/SQS/  │
              │   Redis Streams) │
              └────────┬─────────┘
                       │
                       │ Event: ValuationRequested
                       │ {
                       │   loanId, propertyType,
                       │   sizeSqft, ageYears
                       │ }
                       │
                       ▼
        ┌──────────────────────────────────┐
        │   Valuation Service Workers      │
        │                                   │
        │  ┌────────────────────────────┐  │
        │  │  1. Consume event          │  │
        │  │  2. Run ML model/formula   │  │
        │  │  3. Calculate result       │  │
        │  │  4. Publish completion     │  │
        │  └────────────────────────────┘  │
        └──────────────┬───────────────────┘
                       │
                       │ Event: ValuationCompleted
                       │ {
                       │   loanId, estimatedValue,
                       │   ltvRatio, decision
                       │ }
                       │
                       ▼
        ┌──────────────────────────────────┐
        │    Main App Event Consumer       │
        │                                   │
        │  1. Receive completion event     │
        │  2. Store valuation in DB        │
        │  3. Update loan status           │
        │  4. Optionally notify user       │
        └──────────────────────────────────┘
Implementation Roadmap
Phase 1: Current (Synchronous)

Direct HTTP calls between services
Suitable for simple formula-based valuations
Low latency (~100-500ms)

Phase 2: Hybrid (Optional Async)

Add message queue infrastructure
Support both sync and async modes
Sync for simple valuations, async for ML models

typescript// Example hybrid approach
if (useMLModel) {
  await publishValuationEvent(loanId, propertyData);
  return { status: 'pending', message: 'Valuation in progress' };
} else {
  const result = await callValuationService(propertyData);
  return result;
}
Phase 3: Full Event-Driven

All valuations are async by default
Valuation service scales independently
WebSocket/SSE for real-time UI updates

Technology Recommendations
Message Queue Options:

RabbitMQ - Full-featured, reliable, good for complex routing
AWS SQS/SNS - Managed, serverless, easy to scale
Redis Streams - Lightweight, fast, good for high throughput
Apache Kafka - High-throughput, ideal for event sourcing

Recommended for ML workloads: AWS SQS + Lambda or RabbitMQ + Celery
Event Schema Design
typescript// Event: ValuationRequested
interface ValuationRequestedEvent {
  eventId: string;
  eventType: 'valuation.requested';
  timestamp: string;
  version: '1.0';
  data: {
    loanId: string;
    propertyType: string;
    sizeSqft: number;
    ageYears: number;
    requestedBy: string; // user/system
    priority?: 'normal' | 'high';
  };
  metadata: {
    correlationId: string;
    source: 'loan-portal';
  };
}

// Event: ValuationCompleted
interface ValuationCompletedEvent {
  eventId: string;
  eventType: 'valuation.completed';
  timestamp: string;
  version: '1.0';
  data: {
    loanId: string;
    estimatedValue: number;
    ltvRatio: number;
    decision: 'approved' | 'rejected';
    confidence?: number; // For ML models
    modelVersion?: string; // Track which model was used
  };
  metadata: {
    correlationId: string;
    processingTimeMs: number;
  };
}

// Event: ValuationFailed
interface ValuationFailedEvent {
  eventId: string;
  eventType: 'valuation.failed';
  timestamp: string;
  version: '1.0';
  data: {
    loanId: string;
    errorCode: string;
    errorMessage: string;
    retryable: boolean;
  };
  metadata: {
    correlationId: string;
    attemptNumber: number;
  };
}
Database Schema Updates for Async
prisma// Add to existing Loan model
model Loan {
  // ... existing fields
  
  // Async tracking
  valuationStatus  String?   @map("valuation_status") 
                            // 'queued' | 'processing' | 'completed' | 'failed'
  valuationQueuedAt DateTime? @map("valuation_queued_at")
  valuationStartedAt DateTime? @map("valuation_started_at")
  valuationCompletedAt DateTime? @map("valuation_completed_at")
}

// Optional: Event log for debugging
model ValuationEvent {
  id          String   @id @default(uuid())
  loanId      String   @map("loan_id")
  eventType   String   @map("event_type")
  payload     Json
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@index([loanId, createdAt])
  @@map("valuation_events")
}
ML Model Integration Pattern
python# valuation_service/app/services/ml_valuation.py

class MLValuationEngine:
    """
    Future ML-powered valuation engine.
    Can be swapped in without changing the event contract.
    """
    
    def __init__(self, model_path: str):
        self.model = load_model(model_path)
        self.feature_engineer = FeatureEngineer()
    
    async def calculate_value(
        self,
        property_type: PropertyType,
        size_sqft: int,
        age_years: int,
        location: Optional[dict] = None,
        market_data: Optional[dict] = None
    ) -> dict:
        """
        ML-based valuation with confidence scores.
        """
        # 1. Feature engineering
        features = self.feature_engineer.transform({
            'property_type': property_type,
            'size_sqft': size_sqft,
            'age_years': age_years,
            'location': location,
            'market_data': market_data
        })
        
        # 2. Model inference (potentially slow)
        prediction = await self.model.predict_async(features)
        
        # 3. Return enriched results
        return {
            'estimated_value': float(prediction['value']),
            'confidence_score': float(prediction['confidence']),
            'model_version': self.model.version,
            'methodology': 'ML model with market data',
            'breakdown': {
                'base_value': float(prediction['base']),
                'location_adjustment': float(prediction['location_factor']),
                'market_adjustment': float(prediction['market_factor']),
                'final_value': float(prediction['value'])
            }
        }

# Worker implementation
class ValuationWorker:
    def __init__(self, queue_client, db_client):
        self.queue = queue_client
        self.simple_engine = ValuationEngine()  # Formula-based
        self.ml_engine = MLValuationEngine('models/v2.pkl')  # ML-based
    
    async def process_message(self, event: ValuationRequestedEvent):
        try:
            # Choose engine based on criteria
            if self.should_use_ml(event.data):
                result = await self.ml_engine.calculate_value(**event.data)
            else:
                result = self.simple_engine.calculate_value(**event.data)
            
            # Publish completion event
            await self.publish_completion(event.data.loanId, result)
            
        except Exception as e:
            await self.publish_failure(event.data.loanId, str(e))
Real-Time UI Updates
Option 1: Polling
typescript// Simple but inefficient
const { data } = trpc.loan.getById.useQuery(
  { id: loanId },
  { refetchInterval: 2000 } // Poll every 2 seconds
);
Option 2: WebSocket/SSE
typescript// Efficient real-time updates
const subscription = trpc.loan.onValuationUpdate.useSubscription(
  { loanId },
  {
    onData: (valuation) => {
      // Update UI immediately when valuation completes
      queryClient.setQueryData(['loan', loanId], valuation);
    }
  }
);
Benefits of Event-Driven Approach

ML Model Ready: Support for long-running model inference
Horizontal Scaling: Add more workers during peak times
Resilience: Automatic retries, dead-letter queues
Audit Trail: Complete event history for debugging
Multiple Consumers: Other services can react to valuations
A/B Testing: Run multiple model versions in parallel

Migration Strategy
Step 1: Add message queue alongside HTTP (no code changes)
Step 2: Implement event publishers and consumers
Step 3: Update UI to handle async responses
Step 4: Switch traffic gradually (feature flag)
Step 5: Remove synchronous HTTP endpoint

Other Scalability Considerations
Horizontal Scaling

Stateless services (both main app and valuation)
Database connection pooling
Load balancer ready

Service Extensions

Additional valuation models (location-based, market trends)
Webhook notifications for valuation completion
Multi-tenancy support
Batch valuation processing

Observability

Structured logging (Winston/Pino)
Metrics collection (Prometheus)
Distributed tracing (OpenTelemetry)
Health check endpoints
Queue metrics (message lag, processing time)

---

## Appendix

### Key Dependencies

**Main App**:
- `@tanstack/start` - Full-stack React framework
- `@trpc/server`, `@trpc/client` - Type-safe API
- `@prisma/client` - ORM
- `zod` - Validation
- `tailwindcss` - Styling

**Valuation Service**:
- `fastapi` - Web framework
- `pydantic` - Data validation
- `uvicorn` - ASGI server

### Useful Commands

```bash
# Main App
npm run dev          # Start development server
npm run build        # Build for production
npx prisma studio    # Open database GUI
npx prisma migrate   # Run migrations

# Valuation Service
uvicorn app.main:app --reload  # Development server
pytest                          # Run tests
```

---

## Summary

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Type safety across the stack
- ✅ Scalable service structure
- ✅ Comprehensive error handling
- ✅ Easy local development setup
- ✅ Foundation for future enhancements

The design prioritizes a working end-to-end flow while maintaining code quality and organization that can scale with additional features.
