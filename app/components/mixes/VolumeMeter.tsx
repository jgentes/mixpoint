import { LinearProgress } from '@mui/material'
import { volumeState } from '~/api/appState'
import { Track } from '~/api/dbHandlers'

const VolumeMeter = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const [volume = 0] = volumeState[trackId].volume()

  return (
    <LinearProgress
      id={`volume-container_${trackId}`}
      variant="determinate"
      value={100 - volume}
      sx={{
        mx: '3px',
        zIndex: 0,
        transform: 'rotate(180deg)',
        background: `linear-gradient(to left, rgba(30, 150, 0, .75) 30%, rgba(255, 242, 0, .75) 80%, rgba(255, 0, 0, .75) 99%)`,
        '> span': {
          backgroundColor: 'background.body',
        },
      }}
    />
  )
}

export { VolumeMeter as default }
