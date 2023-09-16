// this file establishes the root component that renders all subsequent / child routes
// it also injects top level styling, HTML meta tags, links, and javascript for browser rendering
import PublicSansFont from '@fontsource/public-sans/latin.css'
import { CssVarsProvider } from '@mui/joy/styles'
import { CssBaseline } from '@mui/material'
import { LinksFunction, MetaFunction } from '@remix-run/cloudflare'
import { Links, LiveReload, Meta, Outlet, Scripts } from '@remix-run/react'
import { SnackbarProvider } from 'notistack'
import { useEffect, useState } from 'react'
import { createHead } from 'remix-island'
import ConfirmModal from '~/components/ConfirmModal'
import InitialLoader from '~/components/InitialLoader'
import styles from '~/root.css'
import { theme } from '~/theme'

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

const ThemeLoader = ({ noSplash }: { noSplash?: boolean }) => {
	const [loading, setLoading] = useState(true)

	// InitialLoader is used to hide the flash of unstyled content
	useEffect(() => {
		const timer = setTimeout(() => {
			setLoading(false)
		}, 500)
		return () => clearTimeout(timer)
	}, [])

	return (
		<SnackbarProvider preventDuplicate maxSnack={3}>
			<CssVarsProvider theme={theme} defaultMode={'dark'}>
				{/* CSS Baseline is used to inject global styles */}
				<CssBaseline />
				{loading && !noSplash ? (
					<InitialLoader />
				) : (
					<>
						<Outlet />
						<ConfirmModal />
					</>
				)}
			</CssVarsProvider>
		</SnackbarProvider>
	)
}

const App = () => (
	<HtmlDoc>
		<ThemeLoader />
		<Scripts />
	</HtmlDoc>
)

export { ThemeLoader, App as default, links, meta }
