import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { Button } from '@mui/joy'
import { Drawer } from '@mui/material'
import { superstate } from '@superstate/core'
import { useSuperState } from '@superstate/react'
import TrackTable from '~/components//tracks/TrackTable'

const openDrawerState = superstate(false)

const drawerButton = (direction: 'up' | 'down') => (
  <Button
    variant="plain"
    size="sm"
    fullWidth
    title={direction === 'up' ? 'Open drawer' : 'Close drawer'}
    sx={{
      position: 'absolute',
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
      {drawerButton('up')}
      <Drawer
        anchor="bottom"
        transitionDuration={400}
        open={openDrawerState.now()}
        onClose={() => openDrawerState.set(false)}
        elevation={0}
        PaperProps={{
          sx: { p: 2, height: '85%', bgcolor: 'background.surface' },
          variant: 'outlined',
        }}
      >
        <TrackTable />
      </Drawer>
    </>
  )
}

export { TrackDrawer as default, openDrawerState, drawerButton }
