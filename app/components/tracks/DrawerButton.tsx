import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { Button } from '@mui/joy'
import { tableState } from '~/api/appState'

const DrawerButton = () => {
  const [openDrawer, setOpenDrawer] = tableState.openDrawer()

  const direction = openDrawer ? 'down' : 'up'

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
      onClick={() => setOpenDrawer(direction == 'up' ? true : false)}
    >
      {direction == 'up' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
    </Button>
  )
}

export { DrawerButton as default }
