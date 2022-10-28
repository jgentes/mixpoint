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
      sx={{
        fontSize: 12,
        fontWeight: 300,
        '-webkit-text-fill-color': '#888',
      }}
    >
      BPM{bpmDiff ? <Replay sx={{ ml: 0.5 }} /> : ''}
    </Link>
  )

  return (
    <form
      style={{ marginLeft: 'auto' }}
      onSubmit={e => {
        e.preventDefault()
        adjustBpm(Number(bpmVal))
      }}
    >
      <TextField
        variant="outlined"
        startDecorator={<ResetBpmLink />}
        value={bpmVal}
        onChange={e => setBpmVal(e.target.value)}
        onBlur={() => {
          if (Number(bpmVal) !== adjustedBpm) adjustBpm(Number(bpmVal))
        }}
        id={`bpmInput_${trackId}`}
        sx={{
          width: 144,
          fontWeight: 300,
          '& div': { minHeight: '24px', borderColor: 'action.disabled' },
          '& input': {
            textAlign: 'right',
            fontSize: 12,
            color: 'text.secondary',
          },
        }}
      />
    </form>
  )
}

export { BpmControl as default }
