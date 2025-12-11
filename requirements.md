# Loan Application Portal - Technical Challenge Requirements

## Project Overview

Build a commercial real estate lending platform with two services:
1. **Main Application**: TanStack Start + tRPC + Postgres (loan management)
2. **Valuation Service**: Python (FastAPI or Flask) - stateless property valuation

**Time Budget**: 2-4 hours  
**Priority**: Working end-to-end flow over extra features

---

## Technical Constraints

### Main Application
- Must use: TanStack Start, tRPC, PostgreSQL
- Must communicate with valuation service over HTTP

### Valuation Service
- Must use: Python (FastAPI or Flask)
- Must be stateless (no database)
- Must communicate over HTTP

---

## Required Features

### 1. Loan Application Data

Each loan application must capture:

**Borrower Information**
- Name and contact details

**Property Details**
- Property type: multifamily, retail, office, or industrial
- Size in square feet
- Age in years

**Loan Details**
- Requested loan amount

**Status**
- Track application status (draft, pending valuation, approved/rejected)

**Valuation Results** (when available)
- Estimated property value
- Loan-to-Value (LTV) ratio
- Approval decision

### 2. User Workflow

Must support this flow:
1. User creates a new loan application
2. User enters borrower info, property details, and loan amount
3. User saves application as draft
4. User can request a valuation when ready
5. System calls valuation service to get estimated property value
6. System calculates LTV ratio: (Loan Amount / Property Value) × 100
7. System makes pass/fail decision based on LTV
8. User can view all their applications and their current status

### 3. Property Valuation Logic

The valuation service must:
- Accept property characteristics (type, size, age)
- Return estimated property value
- Use a reasonable formula where:
  - Different property types have different valuations
  - Age affects value (e.g., 50-year-old industrial ≠ new multifamily)
  - Provide enough information for the main app to store and display

### 4. LTV Decision Rules

- Calculate: LTV = (Loan Amount / Property Value) × 100
- Decision criteria:
  - LTV ≤ 75%: Approve
  - LTV > 75%: Reject

### 5. User Interface

Must provide:
- Form to enter/edit loan applications
- Ability to save drafts
- Button to request valuation
- List view of all applications showing status
- Display of valuation results including estimated value, LTV, and decision

**Note**: Basic UI is acceptable - focus on functionality

### 6. Error Handling

Must handle gracefully:
- Valuation service unavailable/down
- Invalid input data
- Network timeouts
- Database errors
- Bad requests

Show user-friendly error messages without crashing

---

## Service Communication

- Main app must call valuation service over HTTP
- Valuation service must expose HTTP endpoint(s)
- Handle service communication failures gracefully

---

## What Will Be Evaluated

1. **Integration**: Does the TypeScript app communicate cleanly with the Python service?
2. **Data Model**: Is the database schema sensible?
3. **Error Handling**: Does the app handle errors gracefully?
4. **Code Organization**: Is the code structured in a way that could scale with more features?

---

## What Won't Be Evaluated

- Visual design or UI polish
- Authentication/authorization
- Deployment configuration
- Production-ready infrastructure

---

## Optional Bonus Features

If time permits, consider:
- Tests (unit, integration)
- AI integration (natural language input, LLM assistance, embeddings)
- Logging and observability
- Any other improvements you think add value

---

## Deliverable Requirements

Provide a GitHub repository with:

1. **README.md** that explains:
   - How to set up and run both services locally
   - Any environment variables or configuration needed
   - How to test the application

2. **Working application** that demonstrates:
   - Creating loan applications
   - Requesting valuations
   - Viewing results with LTV calculation
   - Listing all applications

3. **Both services running locally**:
   - Main application accessible via browser
   - Valuation service responding to requests

---

## Success Criteria

- End-to-end flow works: create application → request valuation → see results
- LTV calculation is correct and displayed clearly
- Error scenarios don't break the user experience
- Code is organized and readable
- Services communicate successfully over HTTP
