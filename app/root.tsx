// this file establishes the root component that renders all subsequent / child routes
// it also injects top level styling, HTML meta tags, links, and javascript for browser rendering

import { H, HighlightInit } from '@highlight-run/remix/client'
import { NextUIProvider } from '@nextui-org/react'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	isRouteErrorResponse,
	useLoaderData,
	useRouteError
} from '@remix-run/react'
import { Analytics } from '@vercel/analytics/react'
import {
	LinksFunction,
	LoaderFunctionArgs,
	MetaFunction,
	json
} from '@vercel/remix'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { createHead } from 'remix-island'
import { AppwriteService } from '~/AppwriteService'
import { setAppState } from '~/api/db/appState.client'
import ConfirmModal from '~/components/ConfirmModal'
import { InitialLoader } from '~/components/Loader'
import globalStyles from '~/global.css'
import tailwind from '~/tailwind.css'

declare global {
	interface Window {
		account: any
		ENV: {
			HIGHLIGHT_PROJECT_ID: string
			APPWRITE_PROJECT_ID: string
			ENVIRONMENT: string
		}
	}
}

const getCookie = (cookieString: string, cookieName: string) => {
	const cookies = cookieString ? cookieString.split('; ') : []
	for (let i = 0; i < cookies.length; i++) {
		const [name, value] = cookies[i].split('=')
		if (name === cookieName) {
			return decodeURIComponent(value)
		}
	}
	return null
}

// this is used to inject environment variables into the browser
export async function loader({ request }: LoaderFunctionArgs) {
	const HIGHLIGHT_PROJECT_ID =
		process.env.HIGHLIGHT_PROJECT_ID || 'highlight-project-id'
	const APPWRITE_PROJECT_ID =
		process.env.APPWRITE_PROJECT_ID || 'appwrite-project-id'
	const ENVIRONMENT = process.env.NODE_ENV || 'development'

	// set Appwrite session
	const sessionName = `a_session_${APPWRITE_PROJECT_ID.toLowerCase()}`

	const hash =
		getCookie(request.headers.get('Cookie') ?? '', sessionName) ??
		getCookie(request.headers.get('Cookie') ?? '', `${sessionName}_legacy`) ??
		''

	AppwriteService.setSession(hash)

	let account
	try {
		account = await AppwriteService.getAccount()
	} catch (err) {
		account = null
	}

	return json({
		account,
		ENV: {
			HIGHLIGHT_PROJECT_ID,
			APPWRITE_PROJECT_ID,
			ENVIRONMENT
		}
	})
}

// remix-island is needed to address React 18.2 hydration issues
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
	const { ENV, account } = useLoaderData<typeof loader>()
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		// initial loading screen timeout
		const timer = setTimeout(() => {
			setLoading(false)
		}, 500)

		// load Highlight.io
		if (ENV.ENVIRONMENT !== 'development') H.start()

		// update login status in appState upon auth state change
		// supabaseClient.auth.onAuthStateChange((event, session) => {
		// 	const email = session?.user?.email || 'no@email.found'
		// 	const id = session?.user?.id || 'no-id-found'

		// 	if (event === 'SIGNED_IN') {
		// 		setAppState.loggedIn(email)

		// 		H.identify(email, { id })
		// 		H.track('Logged Out')
		// 	}
		// 	if (event === 'SIGNED_OUT') {
		// 		setAppState.loggedIn('')

		// 		H.track('Logged Out')
		// 	}
		// })

		return () => {
			clearTimeout(timer)
		}
	}, [ENV.ENVIRONMENT])

	return (
		<>
			<HighlightInit
				projectId={ENV.HIGHLIGHT_PROJECT_ID}
				manualStart={true}
				serviceName="Mixpoint"
				tracingOrigins
				networkRecording={{ enabled: true, recordHeadersAndBody: true }}
			/>
			<script
				// biome-ignore lint/security/noDangerouslySetInnerHtml: https://remix.run/docs/en/main/guides/envvars#server-environment-variables
				dangerouslySetInnerHTML={{
					__html: `
						window.ENV = ${JSON.stringify(ENV)};
						window.account = ${JSON.stringify(account)};
					`
				}}
			/>
			<Analytics />
			<NextUIProvider>
				<NextThemesProvider attribute="class" defaultTheme="dark">
					{loading ? (
						<InitialLoader />
					) : (
						<>
							<Outlet context={account} />
							<ConfirmModal />
						</>
					)}
					<Toaster toastOptions={{ duration: 5000 }} />
				</NextThemesProvider>
			</NextUIProvider>
		</>
	)
}

const App = () => (
	<HtmlDoc>
		<ThemeLoader />
		<Scripts />
	</HtmlDoc>
)

const ErrorBoundary = (error: Error) => {
	const routeError = (useRouteError() as Error) || error

	const message = isRouteErrorResponse(routeError)
		? routeError.data.message || routeError.data || routeError
		: routeError?.message || JSON.stringify(routeError)

	return (
		<HtmlDoc>
			{!isRouteErrorResponse(error) ||
			process.env.ENVIRONMENT === 'development' ? null : (
				<>
					<script src="https://unpkg.com/highlight.run" />
					<script
						// biome-ignore lint/security/noDangerouslySetInnerHtml: remix reccomends this for injecting variables
						dangerouslySetInnerHTML={{
							__html: `
							H.init('${process.env.HIGHLIGHT_PROJECT_ID}');
						`
						}}
					/>
				</>
			)}
			<InitialLoader message={message || 'Something went wrong'} />
			<Scripts />
		</HtmlDoc>
	)
}

export { App as default, links, meta, ErrorBoundary }
