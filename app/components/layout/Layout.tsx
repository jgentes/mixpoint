import { Sheet } from '@mui/joy'
import { useEffect } from 'react'
import { setTableState } from '~/api/appState'
import { getPrefs, useLiveQuery } from '~/api/db/dbHandlers'
import Header from '~/components/layout/Header'
import MixView from '~/components/mixes/MixView'
import DrawerButton from '~/components/tracks/DrawerButton'
import TrackDrawer from '~/components/tracks/TrackDrawer'
import TrackTable from '~/components/tracks/TrackTable'

const Layout: React.FunctionComponent = () => {
  const { tracks } = useLiveQuery(() => getPrefs('mix', 'tracks')) || {}

  const mixViewVisible = !!tracks?.length

  useEffect(() => {
    if (!mixViewVisible) setTableState.openDrawer(false)
  })

  return (
    <Sheet
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />
      {mixViewVisible ? (
        <>
          <MixView tracks={tracks} />
          <DrawerButton />
        </>
      ) : (
        <TrackTable />
      )}
      <TrackDrawer />
    </Sheet>
  )
}

export { Layout as default }
