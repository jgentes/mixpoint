import { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { useEffect } from 'react'
import { APPWRITE_PROJECT, AppwriteService } from '~/AppwriteService'
import { setAppState } from '~/api/db/appState'
import { getPrefs, useLiveQuery } from '~/api/db/dbHandlers'
import Header from '~/components/layout/Header'
import Heart from '~/components/layout/HeartIcon'
import LeftNav from '~/components/layout/LeftNav'
import MixView from '~/components/mixes/MixView'
import TrackDrawer from '~/components/tracks/TrackDrawer'
import TrackTable from '~/components/tracks/TrackTable'

export function getCookie(cookieString: string, cookieName: string) {
	const cookies = cookieString ? cookieString.split('; ') : []
	for (let i = 0; i < cookies.length; i++) {
		const [name, value] = cookies[i].split('=')
		if (name === cookieName) {
			return decodeURIComponent(value)
		}
	}
	return null
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const sessionNames = [
		`a_session_${APPWRITE_PROJECT.toLowerCase()}`,
		`a_session_${APPWRITE_PROJECT.toLowerCase()}_legacy`
	]

	const hash =
		getCookie(request.headers.get('Cookie'), sessionNames[0]) ??
		getCookie(request.headers.get('Cookie'), sessionNames[1]) ??
		''
	//AppwriteService.setSession(hash)

	let account
	try {
		account = await AppwriteService.getAccount()
	} catch (err) {
		account = null
	}
	console.log('account', account)
	return { account }
}

const Index: React.FunctionComponent = () => {
	const { account } = useLoaderData<typeof loader>()
	const { tracks } = useLiveQuery(() => getPrefs('mix', 'tracks')) || {}
	const mixViewVisible = !!tracks?.filter(t => t).length

	useEffect(() => {
		if (!mixViewVisible) setAppState.openDrawer(false)
	}, [mixViewVisible])

	return (
		<div className="h-full flex flex-col bg-darkGraph light:bg-lightGraph">
			<Header />
			{mixViewVisible ? (
				<>
					<MixView tracks={tracks} />
					<TrackDrawer />
				</>
			) : (
				<>
					<div className="grid grid-cols-[minmax(64px,200px),minmax(450px,1fr)] h-screen">
						<LeftNav />
						<div className="p-4">
							<TrackTable />
						</div>
					</div>
					<Heart />
				</>
			)}
		</div>
	)
}

export { Index as default }
