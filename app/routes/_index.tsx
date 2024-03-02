import { useEffect } from 'react'
import { setAppState } from '~/api/db/appState.client'
import { getPrefs, useLiveQuery } from '~/api/db/dbHandlers'
import Header from '~/components/layout/Header'
import Heart from '~/components/layout/HeartIcon'
import LeftNav from '~/components/layout/LeftNav'
import MixView from '~/components/mixes/MixView'
import TrackDrawer from '~/components/tracks/TrackDrawer'
import TrackTable from '~/components/tracks/TrackTable'
import { ErrorBoundary } from '~/root'

const Index: React.FunctionComponent = () => {
  const { tracks } = useLiveQuery(() => getPrefs('mix', 'tracks')) || {}
  const mixViewVisible = !!tracks?.filter(t => t).length

  // detect mobile device
  const userAgent = navigator.userAgent
  if (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) ||
    /android/i.test(userAgent)
  ) {
    return ErrorBoundary(Error('Mixpoint is for desktops only (for now)'))
  }

  useEffect(() => {
    if (!mixViewVisible) setAppState.openDrawer(false)
  }, [mixViewVisible])

  return (
    <div className="h-full flex flex-col graphBackground">
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
