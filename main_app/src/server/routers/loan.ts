import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { prisma } from '../db'
import { ValuationClient } from '../services/valuationClient'
import { LtvCalculator } from '../services/ltvCalculator'

const valuationClient = new ValuationClient()
const ltvCalculator = new LtvCalculator()

export const loanRouter = router({
  list: publicProcedure.query(async () => {
    const loans = await prisma.loan.findMany({
      include: {
        valuation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return loans
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const loan = await prisma.loan.findUnique({
        where: { id: input.id },
        include: {
          valuation: true,
        },
      })

      if (!loan) {
        throw new Error('Loan not found')
      }

      return loan
    }),

  create: publicProcedure
    .input(
      z.object({
        borrowerName: z.string().min(1),
        borrowerEmail: z.string().email(),
        propertyType: z.enum(['MULTIFAMILY', 'RETAIL', 'OFFICE', 'INDUSTRIAL']),
        propertySizeSqft: z.number().int().positive(),
        propertyAgeYears: z.number().int().min(0),
        loanAmount: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const loan = await prisma.loan.create({
        data: {
          ...input,
          status: 'DRAFT',
        },
      })
      return loan
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        borrowerName: z.string().min(1).optional(),
        borrowerEmail: z.string().email().optional(),
        propertyType: z.enum(['MULTIFAMILY', 'RETAIL', 'OFFICE', 'INDUSTRIAL']).optional(),
        propertySizeSqft: z.number().int().positive().optional(),
        propertyAgeYears: z.number().int().min(0).optional(),
        loanAmount: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input

      // Check if loan exists and is in DRAFT status
      const existingLoan = await prisma.loan.findUnique({
        where: { id },
      })

      if (!existingLoan) {
        throw new Error('Loan not found')
      }

      if (existingLoan.status !== 'DRAFT') {
        throw new Error('Only DRAFT loans can be updated')
      }

      const loan = await prisma.loan.update({
        where: { id },
        data,
      })

      return loan
    }),

  requestValuation: publicProcedure
    .input(z.object({ loanId: z.string() }))
    .mutation(async ({ input }) => {
      // Get the loan
      const loan = await prisma.loan.findUnique({
        where: { id: input.loanId },
      })

      if (!loan) {
        throw new Error('Loan not found')
      }

      if (loan.status !== 'DRAFT') {
        throw new Error('Loan has already been submitted for valuation')
      }

      // Update status to pending
      await prisma.loan.update({
        where: { id: input.loanId },
        data: { status: 'PENDING_VALUATION' },
      })

      try {
        // Request valuation from external service
        const valuationResponse = await valuationClient.requestValuation({
          property_type: loan.propertyType,
          size_sqft: loan.propertySizeSqft,
          age_years: loan.propertyAgeYears,
        })

        // Calculate LTV
        const ltvResult = ltvCalculator.calculate(
          Number(loan.loanAmount),
          valuationResponse.estimated_value
        )

        // Create valuation record
        await prisma.valuation.create({
          data: {
            loanId: input.loanId,
            estimatedValue: valuationResponse.estimated_value,
            ltvRatio: ltvResult.ltvRatio,
            decision: ltvResult.decision,
          },
        })

        // Update loan status
        const updatedLoan = await prisma.loan.update({
          where: { id: input.loanId },
          data: {
            status: ltvResult.decision === 'approved' ? 'APPROVED' : 'REJECTED',
          },
          include: {
            valuation: true,
          },
        })

        return updatedLoan
      } catch (error) {
        // Revert status on error
        await prisma.loan.update({
          where: { id: input.loanId },
          data: { status: 'DRAFT' },
        })
        throw error
      }
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Check if loan exists and is in DRAFT status
      const loan = await prisma.loan.findUnique({
        where: { id: input.id },
      })

      if (!loan) {
        throw new Error('Loan not found')
      }

      if (loan.status !== 'DRAFT') {
        throw new Error('Only DRAFT loans can be deleted')
      }

      await prisma.loan.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
