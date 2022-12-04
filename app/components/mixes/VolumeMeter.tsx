import { LinearProgress } from '@mui/material'
import { useEffect, useState } from 'react'
import { audioEvent } from '~/api/audioEvents'
import { Track } from '~/api/dbHandlers'

const VolumeMeter = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const [volume, setVolume] = useState(0)

  const updateVolume = ({
    event,
    args,
  }: {
    event: string
    args: { volume: number }
  }) => {
    if (event === 'volumeMeter') {
      setVolume(args.volume)
    }
  }

  useEffect(() => {
    audioEvent.on(trackId, updateVolume)
    return audioEvent.off(trackId, updateVolume)
  })

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
          backgroundColor: '#0a1929bd',
        },
      }}
    />
  )
}

export { VolumeMeter as default }
