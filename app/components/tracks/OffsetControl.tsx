import { Replay } from '@mui/icons-material'
import { Link, TextField } from '@mui/joy'
import { db, Track, useLiveQuery } from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'

const OffsetControl = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const { offset, adjustedOffset } =
    useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

  const newOffset = adjustedOffset && Number(adjustedOffset).toFixed(2)

  const offsetDiff = newOffset && newOffset !== offset?.toFixed(2)

  const adjustOffset = async (adjustedOffset?: Track['adjustedOffset']) => {
    // get offset from the user input field or mixState or current track
    adjustedOffset = Number(adjustedOffset?.toFixed(2)) ?? Number(offset)

    EventBus.emit('offset', { trackId, adjustedOffset })
  }

  const ResetOffsetLink = () => {
    return (
      <Link
        component="button"
        underline="none"
        onClick={() => adjustOffset(offset || 0)}
        color="neutral"
        level="body2"
        disabled={!offsetDiff}
        title="Reset Beat Offset"
      >
        {offsetDiff ? <Replay sx={{ mr: 0.5 }} /> : ''}Beat Offset
      </Link>
    )
  }

  return (
    <TextField
      size="sm"
      onChange={e => adjustOffset(+e.target.value)}
      value={adjustedOffset || offset?.toFixed(2) || 0}
      id={`offsetInput_${trackId}`}
      variant="outlined"
      endDecorator={<ResetOffsetLink />}
      sx={{ width: 155, m: 1 }}
    />
  )
}

export { OffsetControl as default }
