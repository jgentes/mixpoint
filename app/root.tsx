// this file establishes the root component that renders all subsequent / child routes
// it also injects top level styling, HTML meta tags, links, and javascript for browser rendering
import { NextUIProvider } from '@nextui-org/react'
import {
	LinksFunction,
	LoaderFunctionArgs,
	MetaFunction,
	json
} from '@remix-run/cloudflare'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	isRouteErrorResponse,
	useLoaderData,
	useLocation,
	useRouteError
} from '@remix-run/react'
import * as Sentry from '@sentry/browser'
import {
	captureRemixErrorBoundaryError,
	setContext,
	withSentry
} from '@sentry/remix'
import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import posthog from 'posthog-js'
import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { createHead } from 'remix-island'
import { getAppState, getAudioState, setAppState } from '~/api/db/appState'
import ConfirmModal from '~/components/ConfirmModal'
import { InitialLoader } from '~/components/Loader'
import globalStyles from '~/global.css'
import tailwind from '~/tailwind.css'

// this is used to inject environment variables into the browser
export async function loader({ context }: LoaderFunctionArgs) {
	return json({
		ENV: {
			SUPABASE_URL: context.env.SUPABASE_URL || 'http://supabase.url',
			SUPABASE_ANON_KEY: context.env.SUPABASE_ANON_KEY || 'supabase-anon-key',
			REACT_APP_PUBLIC_POSTHOG_KEY:
				context.env.REACT_APP_PUBLIC_POSTHOG_KEY || 'posthog-public-key',
			REACT_APP_PUBLIC_POSTHOG_HOST:
				context.env.REACT_APP_PUBLIC_POSTHOG_HOST || 'http://posthog.url'
		}
	})
}

// this is needed to address React 18.2 hydration issues
// TODO - remove this once React 18.3 is released
export const Head = createHead(() => (
	<>
		<Meta />
		<Links />
	</>
))

const meta: MetaFunction = () => [
	{ title: 'Mixpoint' },
	{ description: 'Mixpoint is multi-track audio mixing app for the browser' },
	{ viewport: 'width=device-width, initial-scale=1' }
]

const links: LinksFunction = () => [
	{
		rel: 'icon',
		type: 'image/svg+xml',
		href: '/media/favicon.svg',
		sizes: '32x32'
	},
	{ rel: 'stylesheet', href: tailwind },
	{ rel: 'stylesheet', href: globalStyles }
]

const HtmlDoc = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			{children}
			<LiveReload />
		</>
	)
}

const ThemeLoader = () => {
	const data = useLoaderData<typeof loader>()
	const [loading, setLoading] = useState(true)
	const [supabase, setSupabase] = useState<SupabaseClient>()

	useEffect(() => {
		// initial loading screen timeout
		const timer = setTimeout(() => {
			setLoading(false)
		}, 500)

		// initalize posthog
		posthog.init(data.ENV.REACT_APP_PUBLIC_POSTHOG_KEY, {
			api_host: data.ENV.REACT_APP_PUBLIC_POSTHOG_HOST,
			capture_pageview: false,
			autocapture: {
				url_allowlist: ['https://mixpoint.dev']
			}
		})

		// create a single instance of the supabase client
		const supabaseClient = createBrowserClient(
			data.ENV.SUPABASE_URL,
			data.ENV.SUPABASE_ANON_KEY
		)
		setSupabase(supabaseClient)

		// update login status in appState upon auth state change
		supabaseClient.auth.onAuthStateChange((event, session) => {
			const email = session?.user?.email
			if (event === 'SIGNED_IN') {
				setAppState.loggedIn(email)
				posthog.identify(session?.user?.id, { email })
				Sentry.setUser({ id: session?.user?.id, email })
				posthog.capture('user logged in')
			}
			if (event === 'SIGNED_OUT') {
				setAppState.loggedIn('')
				posthog.capture('user logged out')
				Sentry.setUser(null)
				posthog.reset()
			}
		})

		return () => {
			clearTimeout(timer)
		}
	}, [data])

	return (
		<NextUIProvider>
			<NextThemesProvider attribute="class" defaultTheme="dark">
				{loading ? (
					<InitialLoader />
				) : (
					<>
						<Outlet context={{ supabase }} />
						<ConfirmModal />
					</>
				)}
				<Toaster toastOptions={{ duration: 5000 }} />
			</NextThemesProvider>
		</NextUIProvider>
	)
}

const App = () => {
	const location = useLocation()

	// biome-ignore lint/correctness/useExhaustiveDependencies: location is used to trigger new pageview capture
	useEffect(() => {
		posthog.capture('$pageview')
	}, [location])

	return (
		<HtmlDoc>
			<ThemeLoader />
			<Scripts />
		</HtmlDoc>
	)
}

const ErrorBoundary = async (error: Error) => {
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
		return (
			<HtmlDoc>
				<InitialLoader message={message} />
				<Scripts />
			</HtmlDoc>
		)
	}
}

const AppWithSentry = withSentry(App, { wrapWithErrorBoundary: false })

export { AppWithSentry as default, links, meta, ErrorBoundary }
