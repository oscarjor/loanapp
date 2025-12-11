import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Loan Application Portal</title>
      </head>
      <body>
        <div className="min-h-screen bg-gray-50">
          <Outlet />
        </div>
      </body>
    </html>
  )
}
