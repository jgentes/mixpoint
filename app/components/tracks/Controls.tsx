import { Eject, Replay } from '@mui/icons-material'
import {
  Box,
  Chip,
  Link,
  Radio,
  radioClasses,
  RadioGroup,
  TextField,
} from '@mui/joy'
import { useEffect, useState } from 'react'
import {
  db,
  getState,
  getTrackState,
  removeFromMix,
  Track,
  TrackState,
  useLiveQuery,
} from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'
import { openDrawerState } from '~/components/layout/TrackDrawer'

const NumberControl = ({
  trackId,
  val,
  adjustedVal,
  toFixedVal = 1,
  title,
  text,
  width = 144,
  emitEvent,
  propName,
  styles = { marginLeft: 'auto' },
}: {
  trackId: Track['id']
  val: number | undefined
  adjustedVal: number | undefined
  toFixedVal?: number
  title: string
  text: string
  width?: number
  emitEvent: string
  propName: string
  styles?: object
}) => {
  const [inputVal, setInputVal] = useState<string | number>(0)

  useEffect(
    () => setInputVal((adjustedVal ?? val ?? 0).toFixed(toFixedVal)),
    [adjustedVal, val]
  )

  const valDiff = !isNaN(Number(adjustedVal)) && adjustedVal !== val

  const adjustVal = async (adjustedVal?: number) => {
    adjustedVal = adjustedVal ?? val
    if (!adjustedVal) return

    setInputVal(adjustedVal)

    EventBus.emit(emitEvent, { trackId, [propName]: adjustedVal })
  }

  const ResetValLink = () => (
    <Link
      underline="none"
      onClick={() => adjustVal()}
      color="neutral"
      title={title}
      disabled={!valDiff}
      sx={{
        fontSize: 12,
        WebkitTextFillColor: '#888',
      }}
    >
      {text}
      {valDiff ? <Replay sx={{ ml: 0.5 }} /> : ''}
    </Link>
  )

  return (
    <form
      style={{ ...styles }}
      onSubmit={e => {
        e.preventDefault()
        adjustVal(Number(inputVal))
      }}
    >
      <TextField
        variant="outlined"
        startDecorator={<ResetValLink />}
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onBlur={() => {
          if (Number(inputVal) !== adjustedVal) adjustVal(Number(inputVal))
        }}
        sx={{
          width,
          '& div': {
            minHeight: '24px',
            borderColor: 'action.disabled',
          },
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
        minHeight: 22,
      }}
    >
      <Eject titleAccess="Load Track" />
    </Chip>
  )
}

const BpmControl = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const { bpm } = useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

  const { adjustedBpm } =
    useLiveQuery(() => getTrackState(trackId), [trackId]) || {}

  return (
    <NumberControl
      trackId={trackId}
      val={bpm}
      adjustedVal={adjustedBpm}
      toFixedVal={1}
      title="Reset BPM"
      text="BPM"
      emitEvent="bpm"
      propName="adjustedBpm"
    />
  )
}

const OffsetControl = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const { offset, adjustedOffset } =
    useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

  return (
    <NumberControl
      trackId={trackId}
      val={offset}
      adjustedVal={adjustedOffset}
      toFixedVal={2}
      title="Reset Beat Offset"
      text="Beat Offset"
      emitEvent="offset"
      propName="adjustedOffset"
    />
  )
}

const BeatResolutionControl = ({
  trackId,
  beatResolution,
}: {
  trackId: TrackState['id']
  beatResolution: TrackState['beatResolution']
}) => {
  const changeBeatResolution = (beatResolution: TrackState['beatResolution']) =>
    EventBus.emit('beatResolution', { trackId: trackId, beatResolution })

  return (
    <RadioGroup
      row
      name="beatResolution"
      value={beatResolution}
      variant="outlined"
      onChange={e =>
        changeBeatResolution(+e.target.value as TrackState['beatResolution'])
      }
    >
      {[0.25, 0.5, 1].map(item => (
        <Box
          key={item}
          sx={theme => ({
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 48,
            height: 24,
            '&:not([data-first-child])': {
              borderLeft: '1px solid',
              borderColor: 'divider',
            },
            [`&[data-first-child] .${radioClasses.action}`]: {
              borderTopLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`,
              borderBottomLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`,
            },
            [`&[data-last-child] .${radioClasses.action}`]: {
              borderTopRightRadius: `calc(${theme.vars.radius.sm} - 1px)`,
              borderBottomRightRadius: `calc(${theme.vars.radius.sm} - 1px)`,
            },
          })}
        >
          <Radio
            value={item}
            disableIcon
            overlay
            label={`${item * 100}%`}
            variant={beatResolution == item ? 'outlined' : 'plain'}
            color="primary"
            sx={{
              fontSize: 12,
              color: 'text.secondary',
            }}
            componentsProps={{
              action: {
                sx: { borderRadius: 0, transition: 'none' },
              },
              label: { sx: { lineHeight: 0 } },
            }}
          />
        </Box>
      ))}
    </RadioGroup>
  )
}

export { BpmControl, OffsetControl, BeatResolutionControl, EjectControl }
