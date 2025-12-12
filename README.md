# Loan Application Portal

A commercial real estate loan application platform with property valuation, automated LTV-based approval, and an AI-powered chat assistant.

⚠️ **IMPORTANT**: Always reference these before coding:
- 📋 [requirements.md](./requirements.md) - What to build
- 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md) - How to build it

## Tech Stack

### Main Application (Port 3000)
- **Framework**: TanStack Start (React with SSR)
- **API**: tRPC (type-safe RPC)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **AI**: Vercel AI SDK with OpenAI GPT-4o-mini

### Valuation Service (Port 8000)
- **Framework**: FastAPI
- **Validation**: Pydantic
- **Language**: Python 3.11
- **Testing**: pytest

## Project Structure

```
loan-application-portal/
├── main_app/                    # Main TypeScript application
│   ├── app/                     # Frontend (TanStack Start)
│   │   ├── routes/              # Pages and routing
│   │   ├── components/          # React components
│   │   └── styles/              # CSS/Tailwind
│   ├── server/                  # Backend
│   │   ├── trpc/                # tRPC routers
│   │   │   └── routers/
│   │   │       └── loan.ts      # Loan CRUD + valuation
│   │   ├── services/
│   │   │   ├── valuationClient.ts  # HTTP client
│   │   │   └── ltvCalculator.ts    # LTV logic
│   │   └── db/
│   │       └── client.ts        # Prisma client
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── Dockerfile
│   └── package.json
│
├── valuation_service/           # Python microservice
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── api/
│   │   │   └── routes.py        # API endpoints
│   │   ├── models/
│   │   │   ├── request.py       # Pydantic models
│   │   │   └── response.py
│   │   └── services/
│   │       └── valuation_engine.py  # Valuation logic
│   ├── tests/                   # pytest test suite (64 tests)
│   ├── Dockerfile
│   └── requirements.txt
│
├── automated_tests/             # Playwright E2E tests
│   ├── tests/
│   │   ├── crud.spec.js         # CRUD operation tests
│   │   └── valuation.spec.js    # Valuation flow tests
│   ├── playwright.config.js     # Playwright configuration
│   └── package.json
│
├── docker-compose.yml           # Orchestration for all services
├── requirements.md
└── ARCHITECTURE.md
```

## Quick Start with Docker Compose

The easiest way to run the backend services:

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ (for main app)
- Ports 3000, 5432, and 8000 available

### Start Backend Services (PostgreSQL + Valuation Service)

```bash
# Start PostgreSQL and Valuation Service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Backend services will be available at:
- **Valuation Service**: http://localhost:8000/docs (API docs)
- **PostgreSQL**: localhost:5432

### Start Main Application (Locally)

Due to TanStack Start being in active development with frequent breaking changes, it's recommended to run the main app locally:

```bash
# In a new terminal
cd main_app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Main app will be available at: http://localhost:3000

## Features

### 1. Loan Application Management
- Create, read, update, and delete loan applications
- Track loan status (DRAFT, PENDING_VALUATION, APPROVED, REJECTED)
- Store borrower information and property details

### 2. Property Valuation
- Integration with external valuation microservice
- Formula-based property valuation using property type, size, and age
- Automatic LTV (Loan-to-Value) calculation
- Automated approval/rejection based on LTV threshold (≤75% = APPROVED)

### 3. AI Chat Assistant (NEW!)
- Conversational AI powered by OpenAI GPT-4o-mini
- Natural language loan application creation
- Guided data collection process
- Function calling to create loans and request valuations
- Real-time streaming responses
- Available at `/chat` route

**Chat Assistant Capabilities:**
- Asks for loan information conversationally
- Validates input as you provide it
- Creates loan applications automatically
- Requests property valuations
- Shows results with approval/rejection decisions

## Local Development Setup

### 1. PostgreSQL Database

**Option A: Using Docker**
```bash
docker run --name loanapp-postgres \
  -e POSTGRES_DB=loanapp \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:14-alpine
```

**Option B: Local PostgreSQL**
- Install PostgreSQL 14+
- Create database: `createdb loanapp`

### 2. Valuation Service

```bash
cd valuation_service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run the service
uvicorn app.main:app --reload --port 8000
```

Valuation service runs at: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### 3. Main Application

```bash
cd main_app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update DATABASE_URL in .env if needed
# DATABASE_URL="postgresql://postgres:password@localhost:5432/loanapp"

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Main app runs at: http://localhost:3000

## Database Management

```bash
cd main_app

# Generate Prisma Client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Push schema changes (dev only)
npm run db:push

# Open Prisma Studio (GUI)
npm run db:studio
```

## Testing

### Automated UI Tests (Playwright)

```bash
cd automated_tests

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run all tests
npm test

# Run specific test suites
npm run test:crud          # CRUD operation tests
npm run test:valuation     # Valuation flow tests

# Run with browser visible
npm run test:headed

# Run in interactive UI mode
npm run test:ui

# View test report
npm run report
```

**Test Coverage**: 14 E2E tests (all passing ✅):
- **CRUD Operations**: Create, read, update, delete loan applications (7 tests)
- **Valuation Flow**: Property valuation and LTV-based approval/rejection (7 tests)
- Form validation and error handling
- Different property types and depreciation scenarios

See [automated_tests/README.md](./automated_tests/README.md) for complete documentation.

### Valuation Service Tests

```bash
cd valuation_service
source venv/bin/activate

# Run all tests (64 tests)
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_valuation_engine.py -v
```

Test coverage: **89%** (151/170 statements)

## Code Quality & Linting

This project enforces code quality through automated linting and pre-commit hooks.

### Pre-Commit Hooks

Pre-commit hooks automatically run before each commit to ensure code quality:

**What happens on commit:**
1. Hook detects staged TypeScript and Python files
2. Runs appropriate linters (ESLint for TS, Pylint for Python)
3. Blocks commit if any errors are found
4. Provides clear error messages for fixing

**Example successful commit:**
```bash
$ git commit -m "Add new feature"
Running pre-commit checks...
Checking TypeScript files in main_app...
✓ ESLint check passed
✓ TypeScript check passed

All pre-commit checks passed!
[main abc1234] Add new feature
```

**Example failed commit:**
```bash
$ git commit -m "Add feature"
Running pre-commit checks...
Checking TypeScript files in main_app...

/path/to/file.ts
  9:33  error  Prefer using nullish coalescing operator (`??`) instead of (`||`)

ESLint check failed!
Please fix the linting errors before committing.

Pre-commit checks failed! Commit aborted.
```

**Bypassing hooks (not recommended):**
```bash
git commit -m "Your message" --no-verify
```

### Manual Linting

**Main App (TypeScript/React):**
```bash
cd main_app
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix many issues
npm run build:client # Check TypeScript compilation
```

**Valuation Service (Python):**
```bash
cd valuation_service
make lint           # Run pylint
make test           # Run tests
make coverage       # Run with coverage

# Or manually:
source venv/bin/activate
pylint app tests
```

**Linting Configuration Files:**
- main_app: `eslint.config.js`
- valuation_service: `.pylintrc`

**Current Scores:**
- **main_app**: ESLint passing with 0 errors, 0 warnings
- **valuation_service**: Pylint **10.00/10**

### Troubleshooting

**"venv not found" for valuation_service:**
```bash
cd valuation_service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Pre-commit hook not running:**
```bash
chmod +x .git/hooks/pre-commit
```

## Environment Variables

### Main App (.env)
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/loanapp"
VALUATION_SERVICE_URL="http://localhost:8000"
PORT=3000
OPENAI_API_KEY="your-openai-api-key-here"  # Required for AI chat assistant
```

**Note:** Get your OpenAI API key from https://platform.openai.com/api-keys

### Valuation Service (.env)
```bash
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
```

## API Overview

### Main App (tRPC)

Available procedures:
- `loan.list` - List all loan applications
- `loan.getById` - Get loan by ID
- `loan.create` - Create new loan application
- `loan.update` - Update loan (DRAFT only)
- `loan.requestValuation` - Request valuation and get decision
- `loan.delete` - Delete loan (DRAFT only)

### Valuation Service (REST)

Endpoints:
- `POST /api/v1/valuate` - Calculate property valuation
- `GET /api/v1/health` - Health check

## Architecture Highlights

### Service Communication
```
Browser → Main App (tRPC) → ValuationClient (HTTP) → Valuation Service
                ↓
           PostgreSQL
```

### Valuation Flow
1. User creates loan application (DRAFT)
2. User requests valuation
3. Main app calls valuation service
4. Calculate estimated property value
5. Calculate LTV ratio
6. Make approval decision (LTV ≤ 75% = approved)
7. Save results and update loan status

### Property Valuation Formula
- **Base Value** = `size_sqft × base_rate[property_type]`
- **Depreciation** = `min(age_years × 0.01, 0.40)` (1%/year, max 40%)
- **Final Value** = `base_value × (1 - depreciation)`

### Base Rates
- Multifamily: $200/sqft
- Retail: $150/sqft
- Office: $180/sqft
- Industrial: $100/sqft

## Docker Commands

```bash
# Build images
docker-compose build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f main_app
docker-compose logs -f valuation_service

# Restart a service
docker-compose restart main_app

# Stop and remove containers
docker-compose down

# Remove volumes (deletes database data)
docker-compose down -v

# Rebuild and start
docker-compose up --build
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :8000
lsof -i :5432

# Kill the process
kill -9 <PID>
```

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists: `createdb loanapp`
- Run migrations: `npm run db:migrate`

### Valuation Service Unreachable
- Check service is running: `curl http://localhost:8000/api/v1/health`
- Verify VALUATION_SERVICE_URL in main app .env
- Check Docker network if using Docker Compose

### Prisma Issues
```bash
# Reset Prisma
npm run db:generate
npx prisma migrate reset

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

For production deployment:

1. **Update Environment Variables**
   - Use secure database credentials
   - Set `NODE_ENV=production`
   - Update CORS origins

2. **Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

3. **Build and Run**
   ```bash
   # Main app
   npm run build
   npm start

   # Valuation service
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

## License

MIT

## See Also

- [requirements.md](./requirements.md) - Detailed requirements
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture documentation
- [Valuation Service README](./valuation_service/README.md) - Service-specific docs
