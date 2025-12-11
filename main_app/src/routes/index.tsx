import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '../utils/trpc'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { LoanForm, LoanFormData } from '../components/LoanForm'

export const Route = createFileRoute('/')({
  component: Home,
})

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; loanId: string; data: LoanFormData }
  | { type: 'delete'; loanId: string; borrowerName: string }
  | { type: 'valuation'; loanId: string; borrowerName: string }

function Home() {
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: loans, isLoading, error: queryError } = trpc.loan.list.useQuery()

  const createMutation = trpc.loan.create.useMutation({
    onSuccess: () => {
      utils.loan.list.invalidate()
      setModalState({ type: 'none' })
      setSuccess('Loan application created successfully!')
      setTimeout(() => setSuccess(null), 5000)
    },
    onError: (err: { message: string }) => {
      setError(`Failed to create loan: ${err.message}`)
    },
  })

  const updateMutation = trpc.loan.update.useMutation({
    onSuccess: () => {
      utils.loan.list.invalidate()
      setModalState({ type: 'none' })
      setSuccess('Loan application updated successfully!')
      setTimeout(() => setSuccess(null), 5000)
    },
    onError: (err: { message: string }) => {
      setError(`Failed to update loan: ${err.message}`)
    },
  })

  const deleteMutation = trpc.loan.delete.useMutation({
    onSuccess: () => {
      utils.loan.list.invalidate()
      setModalState({ type: 'none' })
      setSuccess('Loan application deleted successfully!')
      setTimeout(() => setSuccess(null), 5000)
    },
    onError: (err: { message: string }) => {
      setError(`Failed to delete loan: ${err.message}`)
    },
  })

  const valuationMutation = trpc.loan.requestValuation.useMutation({
    onSuccess: (data: any) => {
      utils.loan.list.invalidate()
      setModalState({ type: 'none' })
      const decision = data.status === 'APPROVED' ? 'approved' : 'rejected'
      setSuccess(
        `Valuation completed! Loan ${decision}. LTV: ${Number(data.valuation?.ltvRatio).toFixed(2)}%`
      )
      setTimeout(() => setSuccess(null), 7000)
    },
    onError: (err: { message: string }) => {
      setError(
        `Failed to request valuation: ${err.message}. The valuation service may be unavailable. Please try again later.`
      )
      setModalState({ type: 'none' })
    },
  })

  const handleCreate = async (data: LoanFormData) => {
    setError(null)
    await createMutation.mutateAsync(data)
  }

  const handleUpdate = async (data: LoanFormData) => {
    if (modalState.type !== 'edit') return
    setError(null)
    await updateMutation.mutateAsync({ id: modalState.loanId, ...data })
  }

  const handleDelete = async () => {
    if (modalState.type !== 'delete') return
    setError(null)
    await deleteMutation.mutateAsync({ id: modalState.loanId })
  }

  const handleRequestValuation = async () => {
    if (modalState.type !== 'valuation') return
    setError(null)
    await valuationMutation.mutateAsync({ loanId: modalState.loanId })
  }

  const openEditModal = (loan: {
    id: string
    borrowerName: string
    borrowerEmail: string
    propertyType: 'MULTIFAMILY' | 'RETAIL' | 'OFFICE' | 'INDUSTRIAL'
    propertySizeSqft: number
    propertyAgeYears: number
    loanAmount: number
  }) => {
    setModalState({
      type: 'edit',
      loanId: loan.id,
      data: {
        borrowerName: loan.borrowerName,
        borrowerEmail: loan.borrowerEmail,
        propertyType: loan.propertyType,
        propertySizeSqft: loan.propertySizeSqft,
        propertyAgeYears: loan.propertyAgeYears,
        loanAmount: Number(loan.loanAmount),
      },
    })
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-2 text-gray-600">Loading loans...</p>
      </div>
    )
  }

  if (queryError) {
    return (
      <div className="px-4 sm:px-0">
        <Alert variant="error">
          <div>
            <p className="font-semibold">Failed to load loan applications</p>
            <p className="mt-1 text-sm">
              {queryError.message || 'The database service may be unavailable. Please try again later.'}
            </p>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0">
      {/* Success/Error Alerts */}
      {success && (
        <div className="mb-4">
          <Alert variant="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <Alert variant="error" onClose={() => setError(null)}>
            <div>
              <p className="font-semibold">Error</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Loan Applications</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage loan applications, request valuations, and view approval decisions.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button variant="primary" onClick={() => setModalState({ type: 'create' })}>
            New Loan Application
          </Button>
        </div>
      </div>

      {/* Loan Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {!loans || loans.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No loan applications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new loan application.
                </p>
                <div className="mt-6">
                  <Button variant="primary" onClick={() => setModalState({ type: 'create' })}>
                    Create Loan Application
                  </Button>
                </div>
              </div>
            ) : (
              <div className="shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                        Borrower
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Property
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Loan Amount
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Valuation
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loans.map((loan) => (
                      <tr key={loan.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                          <div className="font-medium text-gray-900">{loan.borrowerName}</div>
                          <div className="text-gray-500">{loan.borrowerEmail}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className="text-gray-900">{loan.propertyType}</div>
                          <div className="text-gray-500">
                            {loan.propertySizeSqft.toLocaleString()} sq ft, {loan.propertyAgeYears}{' '}
                            yrs
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                          ${Number(loan.loanAmount).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              loan.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : loan.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : loan.status === 'PENDING_VALUATION'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {loan.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {loan.valuation ? (
                            <div>
                              <div className="text-gray-900 font-medium">
                                LTV: {Number(loan.valuation.ltvRatio).toFixed(2)}%
                              </div>
                              <div className="text-gray-500">
                                Value: ${Number(loan.valuation.estimatedValue).toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not valuated</span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-2">
                            {loan.status === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => openEditModal(loan)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    setModalState({
                                      type: 'valuation',
                                      loanId: loan.id,
                                      borrowerName: loan.borrowerName,
                                    })
                                  }
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Request Valuation
                                </button>
                                <button
                                  onClick={() =>
                                    setModalState({
                                      type: 'delete',
                                      loanId: loan.id,
                                      borrowerName: loan.borrowerName,
                                    })
                                  }
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                            {loan.status !== 'DRAFT' && (
                              <span className="text-gray-400">No actions available</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={modalState.type === 'create'}
        onClose={() => setModalState({ type: 'none' })}
        title="Create Loan Application"
      >
        <LoanForm
          onSubmit={handleCreate}
          onCancel={() => setModalState({ type: 'none' })}
          isLoading={createMutation.isPending}
          submitLabel="Create Loan"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={modalState.type === 'edit'}
        onClose={() => setModalState({ type: 'none' })}
        title="Edit Loan Application"
      >
        {modalState.type === 'edit' && (
          <LoanForm
            initialData={modalState.data}
            onSubmit={handleUpdate}
            onCancel={() => setModalState({ type: 'none' })}
            isLoading={updateMutation.isPending}
            submitLabel="Update Loan"
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={modalState.type === 'delete'}
        onClose={() => setModalState({ type: 'none' })}
        title="Delete Loan Application"
      >
        {modalState.type === 'delete' && (
          <div>
            <p className="text-gray-700">
              Are you sure you want to delete the loan application for{' '}
              <span className="font-semibold">{modalState.borrowerName}</span>? This action cannot
              be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setModalState({ type: 'none' })}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Valuation Confirmation Modal */}
      <Modal
        isOpen={modalState.type === 'valuation'}
        onClose={() => setModalState({ type: 'none' })}
        title="Request Valuation"
      >
        {modalState.type === 'valuation' && (
          <div>
            <p className="text-gray-700">
              Request a property valuation for{' '}
              <span className="font-semibold">{modalState.borrowerName}</span>? This will:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Contact the valuation service to estimate property value
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Calculate the Loan-to-Value (LTV) ratio
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Make an automatic approval/rejection decision (LTV ≤ 75% = approved)
              </li>
            </ul>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setModalState({ type: 'none' })}
                disabled={valuationMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleRequestValuation}
                isLoading={valuationMutation.isPending}
              >
                Request Valuation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
