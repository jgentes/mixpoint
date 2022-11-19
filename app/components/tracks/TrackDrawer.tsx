import { Drawer } from '@mui/material'
import { superstate } from '@superstate/core'
import { useSuperState } from '@superstate/react'
import TrackTable from '~/components//tracks/TrackTable'
import DrawerButton from '~/components/tracks/DrawerButton'

const openDrawerState = superstate(false)

const TrackDrawer = () => {
  useSuperState(openDrawerState)

  return (
    <Drawer
      anchor="bottom"
      open={openDrawerState.now()}
      onClose={() => openDrawerState.set(false)}
      PaperProps={{
        sx: {
          height: '80%',
          bgcolor: 'background.surface',
        },
        variant: 'outlined',
        elevation: 0,
      }}
    >
      <TrackTable />
      <DrawerButton />
    </Drawer>
  )
}

export { TrackDrawer as default, openDrawerState }
