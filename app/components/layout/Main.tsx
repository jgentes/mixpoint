import { useEffect, useState } from 'react'
import { subscribe } from 'valtio'
import { mixState } from '~/api/models/appState.client'
import Heart from '~/components/layout/HeartIcon'
import LeftNav from '~/components/layout/LeftNav'
import MixView from '~/components/mixes/MixView'
import TrackDrawer from '~/components/tracks/TrackDrawer'
import TrackTable from '~/components/tracks/TrackTable'

const Main: React.FunctionComponent = () => {
  const mixVisible = mixState.tracks?.filter(t => t).length > 0
  const [mixView, setMixView] = useState(mixVisible)

  useEffect(
    () =>
      subscribe(mixState.tracks, () => {
        // this is needed otherwise changes in mixState.tracks will force a refresh of Main
        const mixVisible = mixState.tracks?.filter(t => t).length > 0
        setMixView(mixVisible)
      }),
    []
  )

  return mixView ? (
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
