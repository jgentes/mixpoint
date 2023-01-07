import { LinearProgress } from '@mui/material'
import { Track } from '~/api/db/dbHandlers'
import { waveformState } from '~/api/uiState'

const VolumeMeter = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const [volume = 0] = waveformState[trackId].volume()

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
