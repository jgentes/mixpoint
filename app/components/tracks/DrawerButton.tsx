import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { Button } from '@mui/joy'
import { useSuperState } from '@superstate/react'
import { openDrawerState } from '~/components/tracks/TrackDrawer'

const DrawerButton = () => {
  useSuperState(openDrawerState)

  const direction = openDrawerState.now() ? 'down' : 'up'

  return (
    <Button
      variant="soft"
      size="sm"
      fullWidth
      title={direction === 'up' ? 'Open drawer' : 'Close drawer'}
      sx={{
        marginTop: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
      }}
      onClick={() => openDrawerState.set(direction == 'up' ? true : false)}
    >
      {direction == 'up' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
    </Button>
  )
}

export { DrawerButton as default }
