import { Replay } from '@mui/icons-material'
import { Link, TextField } from '@mui/joy'
import { useEffect, useState } from 'react'
import { db, Track, useLiveQuery } from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'

const OffsetControl = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const { offset, adjustedOffset } =
    useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

  const [offsetVal, setOffsetVal] = useState<string | number>()

  useEffect(
    () => setOffsetVal((adjustedOffset ?? offset ?? 0).toFixed(2)),
    [adjustedOffset, offset]
  )

  const offsetDiff = adjustedOffset !== offset

  const adjustOffset = async (adjustedOffset?: Track['adjustedOffset']) => {
    adjustedOffset = adjustedOffset ?? offset
    setOffsetVal(adjustedOffset)

    EventBus.emit('offset', { trackId, adjustedOffset })
  }

  const ResetOffsetLink = () => {
    return (
      <Link
        underline="none"
        onClick={() => adjustOffset()}
        color="neutral"
        title="Reset Beat Offset"
        disabled={!offsetDiff}
        sx={{
          fontSize: 12,
          '-webkit-text-fill-color': '#888',
        }}
      >
        Beat Offset{offsetDiff ? <Replay sx={{ ml: 0.5 }} /> : ''}
      </Link>
    )
  }

  return (
    <form
      style={{ marginLeft: 'auto' }}
      onSubmit={e => {
        e.preventDefault()
        adjustOffset(Number(offsetVal))
      }}
    >
      <TextField
        variant="outlined"
        startDecorator={<ResetOffsetLink />}
        value={offsetVal}
        onChange={e => setOffsetVal(e.target.value)}
        onBlur={() => {
          if (Number(offsetVal) !== adjustedOffset)
            adjustOffset(Number(offsetVal))
        }}
        id={`offsetInput_${trackId}`}
        sx={{
          width: 144,
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

export { OffsetControl as default }
