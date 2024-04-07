import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { appState } from '~/api/db/appState'
import { getPrefs } from '~/api/handlers/dbHandlers'
import Heart from '~/components/layout/HeartIcon'
import LeftNav from '~/components/layout/LeftNav'
import MixView from '~/components/mixes/MixView'
import TrackDrawer from '~/components/tracks/TrackDrawer'
import TrackTable from '~/components/tracks/TrackTable'

const Main: React.FunctionComponent = () => {
  const { tracks } = useLiveQuery(() => getPrefs('mix', 'tracks')) || {}
  const mixViewVisible = !!tracks?.filter(t => t).length

  useEffect(() => {
    if (!mixViewVisible)
      appState.update(state => {
        state.openDrawer = false
      })
  }, [mixViewVisible])

  return mixViewVisible ? (
    <>
      <MixView />
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
  )
}

export { Main as default }
