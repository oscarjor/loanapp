/**
 * LTV (Loan-to-Value) Calculator
 *
 * Calculates the LTV ratio and makes approval decisions based on the ratio.
 */

const APPROVAL_THRESHOLD = 75 // 75%

export interface LtvResult {
  ltvRatio: number
  decision: 'approved' | 'rejected'
}

export class LtvCalculator {
  private readonly approvalThreshold: number

  constructor(approvalThreshold: number = APPROVAL_THRESHOLD) {
    this.approvalThreshold = approvalThreshold
  }

  /**
   * Calculate LTV ratio and make approval decision
   *
   * @param loanAmount - Requested loan amount
   * @param propertyValue - Estimated property value
   * @returns LTV ratio and approval decision
   */
  calculate(loanAmount: number, propertyValue: number): LtvResult {
    if (propertyValue <= 0) {
      throw new Error('Property value must be greater than 0')
    }

    if (loanAmount < 0) {
      throw new Error('Loan amount cannot be negative')
    }

    // Calculate LTV ratio as percentage
    const ltvRatio = (loanAmount / propertyValue) * 100

    // Round to 2 decimal places
    const roundedLtvRatio = Math.round(ltvRatio * 100) / 100

    // Make decision based on threshold
    const decision = roundedLtvRatio <= this.approvalThreshold ? 'approved' : 'rejected'

    return {
      ltvRatio: roundedLtvRatio,
      decision,
    }
  }

  /**
   * Get the approval threshold
   */
  getThreshold(): number {
    return this.approvalThreshold
  }
}

// Export singleton instance
export const ltvCalculator = new LtvCalculator()
