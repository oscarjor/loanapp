import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { streamText, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { ValuationClient } from '../services/valuationClient'
import { LtvCalculator } from '../services/ltvCalculator'
import { prisma } from '../db'

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
- Use the create_loan_application function when the user confirms they want to proceed
- After creating the loan, offer to request a valuation

Available functions:
- create_loan_application: Creates a new loan application with the collected information
- request_valuation: Requests property valuation for an existing loan application

Be concise and helpful!`

export const chatRouter = router({
  // Stream chat messages with AI
  sendMessage: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const result = streamText({
        model: openai('gpt-4o-mini'),
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...input.messages,
        ],
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

                return {
                  success: true,
                  loanId: loan.id,
                  message: `Loan application created successfully! ID: ${loan.id}`,
                }
              } catch (error) {
                return {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Failed to create loan application',
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
                // Get the loan
                const loan = await prisma.loan.findUnique({
                  where: { id: loanId },
                })

                if (!loan) {
                  return {
                    success: false,
                    error: 'Loan not found',
                  }
                }

                // Request valuation from the service
                const valuationResponse = await valuationClient.requestValuation({
                  property_type: loan.propertyType,
                  size_sqft: loan.propertySizeSqft,
                  age_years: loan.propertyAgeYears,
                })

                // Calculate LTV and decision
                const ltvResult = ltvCalculator.calculate(
                  Number(loan.loanAmount),
                  valuationResponse.estimated_value
                )

                // Create valuation record
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
                  error:
                    error instanceof Error ? error.message : 'Failed to request valuation',
                }
              }
            },
          },
        },
        stopWhen: stepCountIs(5),
      })

      return result.toTextStreamResponse()
    }),
})
