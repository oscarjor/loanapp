import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { valuationClient, ValuationServiceError } from '../../services/valuationClient'
import { ltvCalculator } from '../../services/ltvCalculator'

/**
 * Loan router - handles all loan-related procedures
 */
export const loanRouter = router({
  /**
   * List all loans with their valuations
   */
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.loan.findMany({
      include: {
        valuation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }),

  /**
   * Get a single loan by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const loan = await ctx.db.loan.findUnique({
        where: { id: input.id },
        include: {
          valuation: true,
        },
      })

      if (!loan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Loan with ID ${input.id} not found`,
        })
      }

      return loan
    }),

  /**
   * Create a new loan application
   */
  create: publicProcedure
    .input(
      z.object({
        borrowerName: z.string().min(1, 'Borrower name is required'),
        borrowerEmail: z.string().email('Valid email is required'),
        borrowerPhone: z.string().optional(),
        propertyType: z.enum(['MULTIFAMILY', 'RETAIL', 'OFFICE', 'INDUSTRIAL']),
        propertySizeSqft: z.number().int().positive('Property size must be positive'),
        propertyAgeYears: z.number().int().min(0, 'Property age cannot be negative'),
        propertyAddress: z.string().optional(),
        loanAmount: z.number().positive('Loan amount must be positive'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.loan.create({
        data: input,
      })
    }),

  /**
   * Update an existing loan application
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        borrowerName: z.string().min(1).optional(),
        borrowerEmail: z.string().email().optional(),
        borrowerPhone: z.string().optional(),
        propertyType: z.enum(['MULTIFAMILY', 'RETAIL', 'OFFICE', 'INDUSTRIAL']).optional(),
        propertySizeSqft: z.number().int().positive().optional(),
        propertyAgeYears: z.number().int().min(0).optional(),
        propertyAddress: z.string().optional(),
        loanAmount: z.number().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check if loan exists
      const existingLoan = await ctx.db.loan.findUnique({
        where: { id },
      })

      if (!existingLoan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Loan with ID ${id} not found`,
        })
      }

      // Don't allow updates if valuation has been requested
      if (existingLoan.status !== 'DRAFT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot update loan after valuation has been requested',
        })
      }

      return await ctx.db.loan.update({
        where: { id },
        data,
      })
    }),

  /**
   * Request valuation for a loan
   */
  requestValuation: publicProcedure
    .input(z.object({ loanId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch the loan
      const loan = await ctx.db.loan.findUnique({
        where: { id: input.loanId },
        include: { valuation: true },
      })

      if (!loan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Loan with ID ${input.loanId} not found`,
        })
      }

      // Check if valuation already exists
      if (loan.valuation) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Valuation already exists for this loan',
        })
      }

      try {
        // 2. Update status to PENDING_VALUATION
        await ctx.db.loan.update({
          where: { id: input.loanId },
          data: { status: 'PENDING_VALUATION' },
        })

        // 3. Call valuation service
        const valuationResult = await valuationClient.requestValuation({
          property_type: loan.propertyType,
          size_sqft: loan.propertySizeSqft,
          age_years: loan.propertyAgeYears,
        })

        // 4. Calculate LTV and make decision
        const ltvResult = ltvCalculator.calculate(
          Number(loan.loanAmount),
          valuationResult.estimated_value,
        )

        // 5. Save valuation results
        const valuation = await ctx.db.valuation.create({
          data: {
            loanId: input.loanId,
            estimatedValue: valuationResult.estimated_value,
            ltvRatio: ltvResult.ltvRatio,
            decision: ltvResult.decision,
            methodology: valuationResult.methodology,
          },
        })

        // 6. Update loan status based on decision
        await ctx.db.loan.update({
          where: { id: input.loanId },
          data: {
            status: ltvResult.decision === 'approved' ? 'APPROVED' : 'REJECTED',
          },
        })

        return valuation
      } catch (error) {
        // Revert loan status to DRAFT on error
        await ctx.db.loan.update({
          where: { id: input.loanId },
          data: { status: 'DRAFT' },
        })

        if (error instanceof ValuationServiceError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Valuation service error: ${error.message}`,
            cause: error,
          })
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to request valuation',
          cause: error,
        })
      }
    }),

  /**
   * Delete a loan (only if status is DRAFT)
   */
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const loan = await ctx.db.loan.findUnique({
        where: { id: input.id },
      })

      if (!loan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Loan with ID ${input.id} not found`,
        })
      }

      if (loan.status !== 'DRAFT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete loan after valuation has been requested',
        })
      }

      await ctx.db.loan.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
