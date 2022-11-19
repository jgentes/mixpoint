import { Drawer } from '@mui/material'
import { superstate } from '@superstate/core'
import TrackTable from '~/components//tracks/TrackTable'

const openDrawerState = superstate(false)

const TrackDrawer = () => {
  return (
    <>
      <div
        style={{
          display: openDrawerState.now() ? 'block' : 'none',
        }}
      >
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
          }}
        >
          <TrackTable />
        </Drawer>
      </div>
    </>
  )
}

export { TrackDrawer as default, openDrawerState }
