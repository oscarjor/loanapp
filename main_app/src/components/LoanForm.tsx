import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from './Button'

export interface LoanFormData {
  borrowerName: string
  borrowerEmail: string
  propertyType: 'MULTIFAMILY' | 'RETAIL' | 'OFFICE' | 'INDUSTRIAL'
  propertySizeSqft: number
  propertyAgeYears: number
  loanAmount: number
}

interface LoanFormProps {
  initialData?: Partial<LoanFormData>
  onSubmit: (data: LoanFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
}

export function LoanForm({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Create Loan',
}: LoanFormProps) {
  const [formData, setFormData] = useState<LoanFormData>({
    borrowerName: initialData.borrowerName || '',
    borrowerEmail: initialData.borrowerEmail || '',
    propertyType: initialData.propertyType || 'MULTIFAMILY',
    propertySizeSqft: initialData.propertySizeSqft || 0,
    propertyAgeYears: initialData.propertyAgeYears || 0,
    loanAmount: initialData.loanAmount || 0,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof LoanFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LoanFormData, string>> = {}

    if (!formData.borrowerName.trim()) {
      newErrors.borrowerName = 'Borrower name is required'
    }

    if (!formData.borrowerEmail.trim()) {
      newErrors.borrowerEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.borrowerEmail)) {
      newErrors.borrowerEmail = 'Invalid email format'
    }

    if (formData.propertySizeSqft <= 0) {
      newErrors.propertySizeSqft = 'Property size must be greater than 0'
    }

    if (formData.propertyAgeYears < 0) {
      newErrors.propertyAgeYears = 'Property age cannot be negative'
    }

    if (formData.loanAmount <= 0) {
      newErrors.loanAmount = 'Loan amount must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (validate()) {
      await onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Borrower Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Borrower Information</h3>

        <div>
          <label htmlFor="borrowerName" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="borrowerName"
            value={formData.borrowerName}
            onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
            className={`mt-1 block w-full rounded-md border ${
              errors.borrowerName ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          />
          {errors.borrowerName && (
            <p className="mt-1 text-sm text-red-600">{errors.borrowerName}</p>
          )}
        </div>

        <div>
          <label htmlFor="borrowerEmail" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="borrowerEmail"
            value={formData.borrowerEmail}
            onChange={(e) => setFormData({ ...formData, borrowerEmail: e.target.value })}
            className={`mt-1 block w-full rounded-md border ${
              errors.borrowerEmail ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          />
          {errors.borrowerEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.borrowerEmail}</p>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Property Details</h3>

        <div>
          <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
            Property Type
          </label>
          <select
            id="propertyType"
            value={formData.propertyType}
            onChange={(e) =>
              setFormData({
                ...formData,
                propertyType: e.target.value as LoanFormData['propertyType'],
              })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="MULTIFAMILY">Multifamily</option>
            <option value="RETAIL">Retail</option>
            <option value="OFFICE">Office</option>
            <option value="INDUSTRIAL">Industrial</option>
          </select>
        </div>

        <div>
          <label htmlFor="propertySizeSqft" className="block text-sm font-medium text-gray-700">
            Size (sq ft)
          </label>
          <input
            type="number"
            id="propertySizeSqft"
            value={formData.propertySizeSqft || ''}
            onChange={(e) =>
              setFormData({ ...formData, propertySizeSqft: Number(e.target.value) })
            }
            className={`mt-1 block w-full rounded-md border ${
              errors.propertySizeSqft ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          />
          {errors.propertySizeSqft && (
            <p className="mt-1 text-sm text-red-600">{errors.propertySizeSqft}</p>
          )}
        </div>

        <div>
          <label htmlFor="propertyAgeYears" className="block text-sm font-medium text-gray-700">
            Property Age (years)
          </label>
          <input
            type="number"
            id="propertyAgeYears"
            value={formData.propertyAgeYears || ''}
            onChange={(e) =>
              setFormData({ ...formData, propertyAgeYears: Number(e.target.value) })
            }
            className={`mt-1 block w-full rounded-md border ${
              errors.propertyAgeYears ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
            placeholder="e.g., 10"
          />
          {errors.propertyAgeYears && (
            <p className="mt-1 text-sm text-red-600">{errors.propertyAgeYears}</p>
          )}
        </div>
      </div>

      {/* Loan Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Loan Details</h3>

        <div>
          <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700">
            Requested Amount ($)
          </label>
          <input
            type="number"
            id="loanAmount"
            value={formData.loanAmount || ''}
            onChange={(e) => setFormData({ ...formData, loanAmount: Number(e.target.value) })}
            className={`mt-1 block w-full rounded-md border ${
              errors.loanAmount ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          />
          {errors.loanAmount && <p className="mt-1 text-sm text-red-600">{errors.loanAmount}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
