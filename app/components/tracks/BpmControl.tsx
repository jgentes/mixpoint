import { Replay } from '@mui/icons-material'
import { Link, TextField } from '@mui/joy'
import { Track, TrackState } from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'

const BpmControl = ({
  track,
  trackState,
}: {
  track: Track
  trackState: TrackState
}) => {
  const adjustedBpm =
    trackState.adjustedBpm && Number(trackState.adjustedBpm).toFixed(1)

  const bpmDiff = adjustedBpm && adjustedBpm !== track?.bpm?.toFixed(1)

  const adjustBpm = async (adjustedBpm?: TrackState['adjustedBpm']) => {
    // get bpm from the user input field or mixState or current track
    adjustedBpm = Number(adjustedBpm?.toFixed(1)) ?? Number(track?.bpm)

    EventBus.emit('adjustBpm', { trackId, adjustedBpm })
  }

  const ResetBpmLink = () => (
    <Link
      component="button"
      underline="none"
      onClick={() => adjustBpm(track?.bpm || 1)}
      color="neutral"
      level="body2"
      disabled={!bpmDiff}
      title="Reset BPM"
    >
      {bpmDiff ? <Replay sx={{ mr: 0.5 }} /> : ''}BPM
    </Link>
  )

  return (
    <TextField
      disabled={!track?.bpm}
      size="sm"
      onChange={val => {
        console.log('changeval:', val)
        if (val) {
          if (bpmTimer) window.clearTimeout(bpmTimer)
          const debounce = window.setTimeout(() => adjustBpm(val), 1000)
          setBpmTimer(debounce)
        }
      }}
      value={adjustedBpm || track?.bpm?.toFixed(1) || 0}
      id={`bpmInput_${id}`}
      variant="soft"
      endDecorator={<ResetBpmLink />}
    />
  )
}

export { BpmControl as default }
