import { tableState } from '#/app/api/appState'
import DrawerButton from '#/components/tracks/DrawerButton'
import TrackTable from '#/components/tracks/TrackTable'
import { Drawer } from '@mui/material'

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
