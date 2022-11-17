import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { Button } from '@mui/joy'
import { Drawer } from '@mui/material'
import { superstate } from '@superstate/core'
import { useSuperState } from '@superstate/react'
import TrackTable from '~/components//tracks/TrackTable'

const openDrawerState = superstate(false)

const DrawerButton = ({ direction }: { direction: 'up' | 'down' }) => (
  <Button
    variant="solid"
    size="sm"
    fullWidth
    title={direction === 'up' ? 'Open drawer' : 'Close drawer'}
    sx={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      borderTop: '1px solid',
      borderColor: 'divider',
      borderRadius: 0,
      bgcolor: 'background.surface',
    }}
    onClick={() => openDrawerState.set(direction == 'up' ? true : false)}
  >
    {direction == 'up' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
  </Button>
)

const TrackDrawer = () => {
  useSuperState(openDrawerState)
  return (
    <>
      <div
        style={{
          display: openDrawerState.now() ? 'block' : 'none',
        }}
      >
        <Drawer
          anchor="bottom"
          transitionDuration={400}
          open={openDrawerState.now()}
          onClose={() => openDrawerState.set(false)}
          elevation={0}
          PaperProps={{
            sx: {
              height: '80%',
              bgcolor: 'background.surface',
              mb: openDrawerState.now() ? 3 : 0,
            },
            variant: 'outlined',
          }}
        >
          <TrackTable />
        </Drawer>
      </div>
      <DrawerButton direction="up" />
    </>
  )
}

export { TrackDrawer as default, openDrawerState, DrawerButton }
