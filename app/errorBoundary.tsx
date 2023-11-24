// This is exported in root to automatically catch errors, but can be used anywhere in the app.
import { isRouteErrorResponse, useRouteError } from '@remix-run/react'
import { captureRemixErrorBoundaryError } from '@sentry/remix'
import App from '~/root'

export const ErrorBoundary = (error: Error) => {
	const routeError = (useRouteError() as Error) || error

	const message = isRouteErrorResponse(routeError)
		? routeError.data.message || routeError.data || routeError
		: routeError?.message || JSON.stringify(routeError)

	if (message) {
		captureRemixErrorBoundaryError(message)
		return <App error={message} />
	}
}
