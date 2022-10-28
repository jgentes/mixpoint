import { Replay } from '@mui/icons-material'
import { Link, TextField } from '@mui/joy'
import { useEffect, useState } from 'react'
import {
  db,
  getTrackState,
  Track,
  TrackState,
  useLiveQuery,
} from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'

const BpmControl = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const { bpm } = useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

  const { adjustedBpm } =
    useLiveQuery(() => getTrackState(trackId), [trackId]) || {}

  const [bpmVal, setBpmVal] = useState<string | number>()

  useEffect(
    () => setBpmVal((adjustedBpm ?? bpm ?? 0).toFixed(1)),
    [adjustedBpm, bpm]
  )

  const bpmDiff = adjustedBpm !== bpm

  const adjustBpm = async (adjustedBpm?: TrackState['adjustedBpm']) => {
    adjustedBpm = adjustedBpm ?? bpm
    setBpmVal(adjustedBpm)

    EventBus.emit('adjustBpm', { trackId, adjustedBpm })
  }

  const ResetBpmLink = () => (
    <Link
      underline="none"
      onClick={() => adjustBpm()}
      color="neutral"
      title="Reset BPM"
      disabled={!bpmDiff}
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
