import { Box } from '@mui/joy'
import { useEffect, useState } from 'react'
import { db, getStore, MixStore, useLiveQuery } from '~/api/db/dbHandlers'
import { setTableState } from '~/api/uiState'
import Header from '~/components/header/Header'
import MixView from '~/components/mixes/MixView'
import DrawerButton from '~/components/tracks/DrawerButton'
import TrackDrawer from '~/components/tracks/TrackDrawer'
import TrackTable from '~/components/tracks/TrackTable'

const Mixes: React.FunctionComponent = () => {
  const { tracks } = useLiveQuery(() => getStore('mix', 'tracks')) || {}

  const mixViewVisible = !!tracks?.length

  useEffect(() => {
    if (!mixViewVisible) setTableState.openDrawer(false)
  })

  return (
    <Box
      sx={{
        bgcolor: 'background.surface',
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
    </Box>
  )
}

export { Mixes as default }
