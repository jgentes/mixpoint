// this file establishes the root component that renders all subsequent / child routes
// it also injects top level styling, HTML meta tags, links, and javascript for browser rendering
import PublicSansFont from '@fontsource/public-sans/latin.css'
import { Snackbar } from '@mui/joy'
import { CssVarsProvider as JoyCssVarsProvider } from '@mui/joy/styles'
import { CssBaseline } from '@mui/material'
import {
	Experimental_CssVarsProvider as MaterialCssVarsProvider,
	THEME_ID as MATERIAL_THEME_ID,
	experimental_extendTheme as materialExtendTheme
} from '@mui/material/styles'
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
	useLoaderData,
	useLocation
} from '@remix-run/react'
import posthog from 'posthog-js'
import { useEffect, useState } from 'react'
import { createHead } from 'remix-island'
import ConfirmModal from '~/components/ConfirmModal'
import InitialLoader from '~/components/InitialLoader'
import { ErrorBoundary } from '~/errorBoundary'
import styles from '~/root.css'
import { theme as joyTheme } from '~/theme'
import { Notification } from '~/utils/notifications'

const materialTheme = materialExtendTheme()

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
		type: 'image/png',
		href: '/media/innerjoin32.png',
		sizes: '32x32'
	},
	{ rel: 'stylesheet', href: PublicSansFont },
	{ rel: 'stylesheet', href: styles }
]

const HtmlDoc = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			{children}
			<LiveReload />
		</>
	)
}

const ThemeLoader = ({ error }: { error?: string }) => {
	const [loading, setLoading] = useState(true)
	const [notification, setNotification] = useState<Notification>()

	useEffect(() => {
		// initial loading screen timeout
		const timer = setTimeout(() => {
			setLoading(false)
		}, 500)

		// for snackbar notifications
		const notify = (e: CustomEventInit) =>
			setNotification({
				message: e.detail.message,
				color: e.detail.color || 'danger'
			})

		window.addEventListener('notify', notify)

		return () => {
			clearTimeout(timer)
			window.removeEventListener('notify', notify)
		}
	}, [])

	return (
		<MaterialCssVarsProvider
			theme={{ [MATERIAL_THEME_ID]: materialTheme }}
			defaultMode={'dark'}
		>
			<JoyCssVarsProvider theme={joyTheme} defaultMode={'dark'}>
				{/* CSS Baseline is used to inject global styles */}
				<CssBaseline />
				{loading || error ? (
					<InitialLoader message={error} />
				) : (
					<>
						<Outlet />
						<ConfirmModal />
					</>
				)}
				<Snackbar
					open={!!notification}
					autoHideDuration={5000}
					variant="soft"
					color={notification?.color}
					size="md"
					onClose={() => setNotification(undefined)}
				>
					{notification?.message}
				</Snackbar>
			</JoyCssVarsProvider>
		</MaterialCssVarsProvider>
	)
}

// this is used to inject environment variables into the browser
export async function loader({ context }: LoaderFunctionArgs) {
	return json({
		ENV: {
			SUPABASE_URL: context.env.SUPABASE_URL || 'http://supabase.url',
			SUPABASE_ANON_KEY: context.env.SUPABASE_ANON_KEY || 'supabase-anon-key',
			REACT_APP_PUBLIC_POSTHOG_KEY:
				context.env.REACT_APP_PUBLIC_POSTHOG_KEY || 'posthog-key',
			REACT_APP_PUBLIC_POSTHOG_HOST:
				context.env.REACT_APP_PUBLIC_POSTHOG_HOST || 'http://posthog-host'
		}
	})
}

const App = ({ error }: { error?: string }) => {
	const data = error ? {} : useLoaderData<typeof loader>()
	const location = useLocation()

	useEffect(() => {
		posthog.init(data.ENV.REACT_APP_PUBLIC_POSTHOG_KEY, {
			api_host: data.ENV.REACT_APP_PUBLIC_POSTHOG_HOST,
			capture_pageview: false
		})
	}, [data])

	// biome-ignore lint/correctness/useExhaustiveDependencies: location is used to trigger new pageview capture
	useEffect(() => {
		posthog.capture('$pageview')
	}, [location])

	return (
		<HtmlDoc>
			<script
				// biome-ignore lint/security/noDangerouslySetInnerHtml: see https://remix.run/docs/en/main/guides/envvars
				dangerouslySetInnerHTML={{
					__html: `window.ENV = ${JSON.stringify(data.ENV)}`
				}}
			/>
			<ThemeLoader error={error} />
			<Scripts />
		</HtmlDoc>
	)
}

export { App as default, links, meta, ErrorBoundary }
