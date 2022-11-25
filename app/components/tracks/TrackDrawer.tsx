import { Drawer } from '@mui/material'
import { tableState } from '~/api/appState'
import TrackTable from '~/components//tracks/TrackTable'
import DrawerButton from '~/components/tracks/DrawerButton'

const TrackDrawer = () => {
  const [openDrawer, setOpenDrawer] = tableState.openDrawer()

  return (
    <Drawer
      anchor="bottom"
      open={openDrawer}
      onClose={() => setOpenDrawer(false)}
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

export { TrackDrawer as default }
