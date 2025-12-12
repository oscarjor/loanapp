import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './routers/index'
import { createServer as createViteServer } from 'vite'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { ValuationClient } from './services/valuationClient'
import { LtvCalculator } from './services/ltvCalculator'
import { prisma } from './db'
import { z } from 'zod'

const valuationClient = new ValuationClient()
const ltvCalculator = new LtvCalculator()

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful loan valuation assistant for a commercial real estate loan application platform.

Your role is to help users create loan applications by gathering the following required information:
1. Borrower Name
2. Borrower Email
3. Property Type (MULTIFAMILY, RETAIL, OFFICE, or INDUSTRIAL)
4. Property Size in square feet
5. Property Age in years
6. Requested Loan Amount

Guidelines:
- Be friendly and conversational
- Ask for information one or two items at a time
- Validate the information as you collect it
- Once you have all the information, confirm with the user before creating the loan application
- When you call create_loan_application, it AUTOMATICALLY performs the property valuation and approval/rejection decision
- After calling create_loan_application, ALWAYS summarize the complete results including:
  * Loan ID
  * Property estimated value
  * LTV ratio
  * Final decision (APPROVED or REJECTED)
  * Congratulate them if approved, or sympathize if rejected

IMPORTANT: The create_loan_application function does EVERYTHING in one step - it creates the loan AND gets the valuation automatically. You don't need to call request_valuation separately anymore.

Be concise and helpful!`

// Main server startup function
async function startServer() {
  const app = express()
  const PORT = process.env.PORT ?? 3000

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

  // Chat API endpoint
  app.post('/api/chat', async (req, res) => {
    const { messages } = req.body

    // Convert UIMessages to ModelMessages
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const modelMessages = convertToModelMessages(messages)

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      stopWhen: stepCountIs(5),
      tools: {
        create_loan_application: {
          description: 'Create a new loan application with borrower and property information',
          inputSchema: z.object({
            borrowerName: z.string().describe('Full name of the borrower'),
            borrowerEmail: z.string().email().describe('Email address of the borrower'),
            propertyType: z
              .enum(['MULTIFAMILY', 'RETAIL', 'OFFICE', 'INDUSTRIAL'])
              .describe('Type of commercial property'),
            propertySizeSqft: z.number().positive().describe('Property size in square feet'),
            propertyAgeYears: z.number().min(0).describe('Age of the property in years'),
            loanAmount: z.number().positive().describe('Requested loan amount in dollars'),
          }),
          execute: async ({
            borrowerName,
            borrowerEmail,
            propertyType,
            propertySizeSqft,
            propertyAgeYears,
            loanAmount,
          }) => {
            try {
              // Create loan application
              const loan = await prisma.loan.create({
                data: {
                  borrowerName,
                  borrowerEmail,
                  propertyType,
                  propertySizeSqft,
                  propertyAgeYears,
                  loanAmount,
                  status: 'DRAFT',
                },
              })

              // Automatically request valuation
              const valuationResponse = await valuationClient.requestValuation({
                property_type: loan.propertyType,
                size_sqft: loan.propertySizeSqft,
                age_years: loan.propertyAgeYears,
              })

              const ltvResult = ltvCalculator.calculate(
                Number(loan.loanAmount),
                valuationResponse.estimated_value
              )

              // Save valuation
              await prisma.valuation.create({
                data: {
                  loanId: loan.id,
                  estimatedValue: valuationResponse.estimated_value,
                  ltvRatio: ltvResult.ltvRatio,
                  decision: ltvResult.decision,
                  valuationDate: new Date(valuationResponse.valuation_date),
                },
              })

              // Update loan status
              await prisma.loan.update({
                where: { id: loan.id },
                data: {
                  status: ltvResult.decision === 'approved' ? 'APPROVED' : 'REJECTED',
                },
              })

              return {
                success: true,
                loanId: loan.id,
                estimatedValue: valuationResponse.estimated_value,
                ltvRatio: ltvResult.ltvRatio,
                decision: ltvResult.decision,
                message: `Loan application created successfully! Loan ID: ${loan.id}\n\n` +
                  `Property Valuation:\n` +
                  `• Estimated Value: $${valuationResponse.estimated_value.toLocaleString()}\n` +
                  `• Loan Amount: $${loanAmount.toLocaleString()}\n` +
                  `• LTV Ratio: ${ltvResult.ltvRatio.toFixed(2)}%\n` +
                  `• Decision: ${ltvResult.decision.toUpperCase()}\n\n` +
                  (ltvResult.decision === 'approved'
                    ? '✅ Congratulations! Your loan has been APPROVED!'
                    : '❌ Unfortunately, your loan has been REJECTED due to high LTV ratio.'),
              }
            } catch (error) {
              return {
                success: false,
                error:
                  error instanceof Error ? error.message : 'Failed to create loan application',
              }
            }
          },
        },
        request_valuation: {
          description:
            'Request property valuation for a loan application. This will call the valuation service and automatically approve/reject based on LTV ratio.',
          inputSchema: z.object({
            loanId: z.string().describe('The ID of the loan application'),
          }),
          execute: async ({ loanId }) => {
            try {
              const loan = await prisma.loan.findUnique({
                where: { id: loanId },
              })

              if (!loan) {
                return {
                  success: false,
                  error: 'Loan not found',
                }
              }

              const valuationResponse = await valuationClient.requestValuation({
                property_type: loan.propertyType,
                size_sqft: loan.propertySizeSqft,
                age_years: loan.propertyAgeYears,
              })

              const ltvResult = ltvCalculator.calculate(
                Number(loan.loanAmount),
                valuationResponse.estimated_value
              )

              await prisma.valuation.create({
                data: {
                  loanId: loan.id,
                  estimatedValue: valuationResponse.estimated_value,
                  ltvRatio: ltvResult.ltvRatio,
                  decision: ltvResult.decision,
                  valuationDate: new Date(valuationResponse.valuation_date),
                },
              })

              await prisma.loan.update({
                where: { id: loanId },
                data: {
                  status: ltvResult.decision === 'approved' ? 'APPROVED' : 'REJECTED',
                },
              })

              return {
                success: true,
                estimatedValue: valuationResponse.estimated_value,
                ltvRatio: ltvResult.ltvRatio,
                decision: ltvResult.decision,
                message: `Valuation completed! Property value: $${valuationResponse.estimated_value.toLocaleString()}, LTV: ${ltvResult.ltvRatio.toFixed(2)}%, Decision: ${ltvResult.decision}`,
              }
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to request valuation',
              }
            }
          },
        },
      },
    })

    result.pipeUIMessageStreamToResponse(res)
  })

  // Health check endpoint (before Vite middleware)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  })

  // Use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`)
    console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`)
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`)
    console.log(`\n✨ Open http://localhost:${PORT} in your browser\n`)
  })
}

startServer().catch(console.error)
