// This is exported in root to automatically catch errors, but can be used anywhere in the app.
import { isRouteErrorResponse, useRouteError } from '@remix-run/react'
import { captureRemixErrorBoundaryError, setContext } from '@sentry/remix'
import { getAudioState, getAppState } from '~/api/db/appState'
import App from '~/root'

export const ErrorBoundary = async (error: Error) => {
	const routeError = (useRouteError() as Error) || error

	const message = isRouteErrorResponse(routeError)
		? routeError.data.message || routeError.data || routeError
		: routeError?.message || JSON.stringify(routeError)

	if (message) {
		const [audioState] = getAudioState()
		setContext('audioState', audioState || {})

		const [appState] = getAppState()
		setContext('appState', appState || {})

		captureRemixErrorBoundaryError(message)
		return <App error={message} />
	}
}
