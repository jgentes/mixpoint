import { Drawer } from '@mui/material'
import { superstate } from '@superstate/core'
import { useSuperState } from '@superstate/react'
import TrackTable from '~/routes/__boundary/tracks'

const openDrawerState = superstate(false)

const TrackDrawer = () => {
  useSuperState(openDrawerState)

  return (
    <Drawer
      anchor="bottom"
      transitionDuration={400}
      open={openDrawerState.now()}
      onClose={() => openDrawerState.set(false)}
      elevation={0}
      PaperProps={{ sx: { p: 2 }, variant: 'outlined' }}
    >
      <TrackTable />
    </Drawer>
  )
}

export { TrackDrawer as default, openDrawerState }
