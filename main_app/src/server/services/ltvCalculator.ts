export interface LtvResult {
  ltvRatio: number
  decision: 'approved' | 'rejected'
}

export class LtvCalculator {
  private readonly APPROVAL_THRESHOLD = 75

  calculate(loanAmount: number, propertyValue: number): LtvResult {
    if (propertyValue <= 0) {
      throw new Error('Property value must be greater than zero')
    }

    const ltvRatio = (loanAmount / propertyValue) * 100
    const decision = ltvRatio <= this.APPROVAL_THRESHOLD ? 'approved' : 'rejected'

    return {
      ltvRatio: Math.round(ltvRatio * 100) / 100, // Round to 2 decimal places
      decision,
    }
  }
}
