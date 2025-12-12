import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-semibold text-gray-900">
                Loan Application Portal
              </h1>
              <div className="flex gap-4">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  activeProps={{ className: 'text-blue-600' }}
                >
                  Applications
                </Link>
                <Link
                  to="/chat"
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  activeProps={{ className: 'text-blue-600' }}
                >
                  AI Assistant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  ),
})
