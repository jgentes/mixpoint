import { useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { appState, mixState } from '~/api/models/appState.client'
import Heart from '~/components/layout/HeartIcon'
import LeftNav from '~/components/layout/LeftNav'
import MixView from '~/components/mixes/MixView'
import TrackDrawer from '~/components/tracks/TrackDrawer'
import TrackTable from '~/components/tracks/TrackTable'

const Main: React.FunctionComponent = () => {
  const { tracks } = useSnapshot(mixState)
  const mixViewVisible = !!tracks?.filter(t => t).length

  useEffect(() => {
    if (!mixViewVisible) appState.openDrawer = false
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
