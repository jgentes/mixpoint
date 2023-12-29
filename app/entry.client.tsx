import { RemixBrowser, useLocation, useMatches } from '@remix-run/react'
import * as Sentry from '@sentry/remix'
import { StrictMode, startTransition, useEffect } from 'react'
import { hydrateRoot } from 'react-dom/client'

Sentry.init({
	dsn: 'https://0158c725913324618a2d2e625ffb9fde@o4506276018192384.ingest.sentry.io/4506276020092928',
	tracesSampleRate: 1,
	replaysSessionSampleRate: 0,
	replaysOnErrorSampleRate: 1,

	integrations: [
		new Sentry.BrowserTracing({
			routingInstrumentation: Sentry.remixRouterInstrumentation(
				useEffect,
				useLocation,
				useMatches
			)
		}),
		new Sentry.Replay({ maskAllText: false, blockAllMedia: false })
	]
})

function hydrate() {
	startTransition(() => {
		hydrateRoot(
			// biome-ignore lint/style/noNonNullAssertion: from remix-island
			document.getElementById('root')!,
			<StrictMode>
				<RemixBrowser />
			</StrictMode>
		)
	})
}

if (typeof requestIdleCallback === 'function') {
	requestIdleCallback(hydrate)
} else {
	// Safari doesn't support requestIdleCallback
	// https://caniuse.com/requestidlecallback
	setTimeout(hydrate, 1)
}
