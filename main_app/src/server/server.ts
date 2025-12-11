import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './routers/index'

const app = express()
const PORT = process.env.PORT || 3000

// Body parser middleware
app.use(express.json())

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// tRPC middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
  })
)

// API Documentation Page
app.get('/panel', (req, res) => {
  const documentation = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loan Application Portal API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      margin-bottom: 2rem;
      border-radius: 8px;
    }
    h1 { margin-bottom: 0.5rem; }
    .subtitle { opacity: 0.9; }
    .endpoint-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .method {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.875rem;
      margin-right: 0.5rem;
    }
    .method.query { background: #3b82f6; color: white; }
    .method.mutation { background: #10b981; color: white; }
    .endpoint-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .description {
      color: #666;
      margin: 0.5rem 0;
    }
    pre {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin: 1rem 0;
      border-left: 3px solid #667eea;
    }
    code {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9rem;
    }
    .example-title {
      font-weight: 600;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    .info-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
    }
    .section-title {
      font-size: 1.5rem;
      margin: 2rem 0 1rem;
      color: #1f2937;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🏦 Loan Application Portal API</h1>
      <p class="subtitle">tRPC Endpoint: http://localhost:${PORT}/trpc</p>
    </header>

    <div class="info-box">
      <strong>Note:</strong> All requests use SuperJSON for serialization.
      Queries use GET requests, Mutations use POST requests.
    </div>

    <h2 class="section-title">Queries (GET)</h2>

    <div class="endpoint-card">
      <div>
        <span class="method query">QUERY</span>
        <span class="endpoint-name">loan.list</span>
      </div>
      <p class="description">Get all loan applications with their valuations</p>

      <div class="example-title">Example Request:</div>
      <pre><code>GET http://localhost:${PORT}/trpc/loan.list</code></pre>

      <div class="example-title">Response:</div>
      <pre><code>{
  "result": {
    "data": {
      "json": [
        {
          "id": "uuid",
          "borrowerName": "John Doe",
          "borrowerEmail": "john@example.com",
          "propertyType": "MULTIFAMILY",
          "propertySizeSqft": 25000,
          "propertyAgeYears": 5,
          "loanAmount": "4000000",
          "status": "APPROVED",
          "valuation": {
            "estimatedValue": "5000000",
            "ltvRatio": "80.00",
            "decision": "approved"
          }
        }
      ]
    }
  }
}</code></pre>
    </div>

    <div class="endpoint-card">
      <div>
        <span class="method query">QUERY</span>
        <span class="endpoint-name">loan.getById</span>
      </div>
      <p class="description">Get a specific loan by ID</p>

      <div class="example-title">Input Schema:</div>
      <pre><code>{ "id": "string (uuid)" }</code></pre>

      <div class="example-title">Example Request:</div>
      <pre><code>GET http://localhost:${PORT}/trpc/loan.getById?input={"json":{"id":"your-loan-id"}}</code></pre>
    </div>

    <h2 class="section-title">Mutations (POST)</h2>

    <div class="endpoint-card">
      <div>
        <span class="method mutation">MUTATION</span>
        <span class="endpoint-name">loan.create</span>
      </div>
      <p class="description">Create a new loan application</p>

      <div class="example-title">Input Schema:</div>
      <pre><code>{
  "borrowerName": "string (min 1 char)",
  "borrowerEmail": "string (valid email)",
  "propertyType": "MULTIFAMILY | RETAIL | OFFICE | INDUSTRIAL",
  "propertySizeSqft": "number (positive integer)",
  "propertyAgeYears": "number (>= 0)",
  "loanAmount": "number (positive)"
}</code></pre>

      <div class="example-title">Example Request:</div>
      <pre><code>POST http://localhost:${PORT}/trpc/loan.create
Content-Type: application/json

{
  "json": {
    "borrowerName": "John Doe",
    "borrowerEmail": "john@example.com",
    "propertyType": "MULTIFAMILY",
    "propertySizeSqft": 25000,
    "propertyAgeYears": 5,
    "loanAmount": 4000000
  }
}</code></pre>
    </div>

    <div class="endpoint-card">
      <div>
        <span class="method mutation">MUTATION</span>
        <span class="endpoint-name">loan.update</span>
      </div>
      <p class="description">Update a DRAFT loan application</p>

      <div class="example-title">Input Schema:</div>
      <pre><code>{
  "id": "string (uuid) - required",
  "borrowerName": "string - optional",
  "borrowerEmail": "string - optional",
  "propertyType": "MULTIFAMILY | RETAIL | OFFICE | INDUSTRIAL - optional",
  "propertySizeSqft": "number - optional",
  "propertyAgeYears": "number - optional",
  "loanAmount": "number - optional"
}</code></pre>

      <div class="example-title">Note:</div>
      <p class="description">Only loans with status DRAFT can be updated</p>
    </div>

    <div class="endpoint-card">
      <div>
        <span class="method mutation">MUTATION</span>
        <span class="endpoint-name">loan.requestValuation</span>
      </div>
      <p class="description">Request property valuation and get automatic approval decision</p>

      <div class="example-title">Input Schema:</div>
      <pre><code>{ "loanId": "string (uuid)" }</code></pre>

      <div class="example-title">Example Request:</div>
      <pre><code>POST http://localhost:${PORT}/trpc/loan.requestValuation
Content-Type: application/json

{
  "json": {
    "loanId": "your-loan-id"
  }
}</code></pre>

      <div class="example-title">What it does:</div>
      <ol style="margin-left: 1.5rem; margin-top: 0.5rem;">
        <li>Calls external valuation service</li>
        <li>Calculates LTV ratio: (Loan Amount / Property Value) × 100</li>
        <li>Auto-approves if LTV ≤ 75%, rejects if LTV > 75%</li>
        <li>Saves valuation to database</li>
      </ol>
    </div>

    <div class="endpoint-card">
      <div>
        <span class="method mutation">MUTATION</span>
        <span class="endpoint-name">loan.delete</span>
      </div>
      <p class="description">Delete a DRAFT loan application</p>

      <div class="example-title">Input Schema:</div>
      <pre><code>{ "id": "string (uuid)" }</code></pre>

      <div class="example-title">Note:</div>
      <p class="description">Only loans with status DRAFT can be deleted</p>
    </div>

    <h2 class="section-title">Testing with curl</h2>

    <div class="endpoint-card">
      <div class="example-title">Create a loan:</div>
      <pre><code>curl -X POST "http://localhost:${PORT}/trpc/loan.create" \\
  -H "Content-Type: application/json" \\
  -d '{
    "json": {
      "borrowerName": "Jane Smith",
      "borrowerEmail": "jane@example.com",
      "propertyType": "RETAIL",
      "propertySizeSqft": 30000,
      "propertyAgeYears": 10,
      "loanAmount": 2500000
    }
  }'</code></pre>

      <div class="example-title">List all loans:</div>
      <pre><code>curl "http://localhost:${PORT}/trpc/loan.list"</code></pre>

      <div class="example-title">Request valuation:</div>
      <pre><code>curl -X POST "http://localhost:${PORT}/trpc/loan.requestValuation" \\
  -H "Content-Type: application/json" \\
  -d '{"json": {"loanId": "your-loan-id"}}'</code></pre>
    </div>

    <h2 class="section-title">Property Types</h2>
    <div class="endpoint-card">
      <ul style="margin-left: 1.5rem;">
        <li><strong>MULTIFAMILY</strong> - Base rate: $200/sqft</li>
        <li><strong>RETAIL</strong> - Base rate: $150/sqft</li>
        <li><strong>OFFICE</strong> - Base rate: $180/sqft</li>
        <li><strong>INDUSTRIAL</strong> - Base rate: $100/sqft</li>
      </ul>
      <p class="description" style="margin-top: 1rem;">
        Valuation formula: Base Value × (1 - Depreciation)<br>
        Depreciation: 1% per year, max 40%
      </p>
    </div>
  </div>
</body>
</html>
  `
  res.send(documentation)
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Loan Application Portal API',
    endpoints: {
      health: '/health',
      trpc: '/trpc',
      panel: '/panel',
    },
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`tRPC endpoint: http://localhost:${PORT}/trpc`)
  console.log(`API Documentation: http://localhost:${PORT}/panel`)
})
