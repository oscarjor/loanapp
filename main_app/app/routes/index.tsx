import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Loan Application Portal
      </h1>
      <p className="text-lg text-gray-600">
        Commercial real estate loan application platform with automated valuation.
      </p>
      <div className="mt-8 space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Backend Ready</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>tRPC API configured</li>
            <li>PostgreSQL database with Prisma</li>
            <li>Valuation service integration</li>
            <li>LTV calculation logic</li>
          </ul>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2 text-blue-900">Next Steps</h2>
          <p className="text-blue-800">
            Add loan application forms and UI components in the app/routes directory.
          </p>
        </div>
      </div>
    </div>
  )
}
