import { isRouteErrorResponse, useRouteError } from '@remix-run/react'
import App from '~/root'

export function ErrorBoundary() {
	const error = useRouteError()
	if (isRouteErrorResponse(error)) {
		return <App error={error.data.message || error.data} />
	}
}
