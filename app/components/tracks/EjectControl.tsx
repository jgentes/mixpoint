import { Eject } from '@mui/icons-material'
import { Chip } from '@mui/joy'
import { getState, removeFromMix, Track } from '~/api/dbHandlers'
import { openDrawerState } from '~/components/layout/TrackDrawer'

const EjectControl = ({ trackId }: { trackId: Track['id'] }) => {
  const ejectTrack = async () => {
    // If this is not the last track in the mix, open drawer, otherwise the drawer will open automatically
    const { from, to } = await getState('mix')
    if (from?.id && to?.id) openDrawerState.set(true)

    if (trackId) removeFromMix(trackId)
  }

  return (
    <Chip
      variant="outlined"
      color="primary"
      size="sm"
      onClick={() => ejectTrack()}
      sx={{
        borderRadius: 'sm',
      }}
    >
      <Eject titleAccess="Load Track" />
    </Chip>
  )
}

export { EjectControl as default }
