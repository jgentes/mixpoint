import { useEffect } from 'react'
import { setAppState } from '~/api/db/appState'
import { getPrefs, useLiveQuery } from '~/api/db/dbHandlers'
import Header from '~/components/layout/Header'
import Heart from '~/components/layout/HeartIcon'
import MixView from '~/components/mixes/MixView'
import DrawerButton from '~/components/tracks/DrawerButton'
import TrackDrawer from '~/components/tracks/TrackDrawer'
import TrackTable from '~/components/tracks/TrackTable'

const Index: React.FunctionComponent = () => {
	const { tracks } = useLiveQuery(() => getPrefs('mix', 'tracks')) || {}
	const mixViewVisible = !!tracks?.filter(t => t).length

	useEffect(() => {
		if (!mixViewVisible) setAppState.openDrawer(false)
	}, [mixViewVisible])

	return (
		<div className="h-full flex flex-col bg-darkGraph light:bg-lightGraph bg-primary-50">
			<Header />
			{mixViewVisible ? (
				<>
					<MixView tracks={tracks} />
					<DrawerButton />
				</>
			) : (
				<>
					<TrackTable />
					<Heart />
				</>
			)}

			<TrackDrawer />
		</div>
	)
}

export { Index as default }
