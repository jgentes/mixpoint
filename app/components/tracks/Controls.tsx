import {
  Adjust,
  Eject,
  Pause,
  PlayArrow,
  Replay,
  SettingsBackupRestore,
  SkipNext,
  SkipPrevious,
} from '@mui/icons-material'
import {
  Box,
  Chip,
  Link,
  Radio,
  radioClasses,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/joy'
import { Button, ButtonGroup } from '@mui/material'
import { useEffect, useState } from 'react'
import {
  audioEvent,
  AudioEvent,
  loadAudioEvents,
  NavEvent,
} from '~/api/audioEvents'
import {
  db,
  getState,
  getTrackState,
  MixState,
  putTrackState,
  removeFromMix,
  Track,
  TrackState,
  useLiveQuery,
} from '~/api/dbHandlers'

import { audioState, tableState } from '~/api/appState'

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
  styles,
}: {
  trackId: Track['id']
  val: number | undefined
  adjustedVal: number | undefined
  toFixedVal?: number
  title: string
  text: string
  width?: number
  emitEvent: AudioEvent
  propName: string
  styles?: object
}) => {
  const [inputVal, setInputVal] = useState<string | number>(0)

  useEffect(
    () => setInputVal((adjustedVal ?? val ?? 0).toFixed(toFixedVal)),
    [adjustedVal, val]
  )

  const valDiff = !isNaN(Number(adjustedVal)) && adjustedVal !== val

  const adjustVal = async (newVal?: number) => {
    newVal = newVal ?? val
    if (typeof newVal !== 'number') return

    setInputVal(newVal)

    audioEvent.emit(trackId!, emitEvent, { [propName]: newVal })
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
        WebkitTextFillColor: 'divider',
        lineHeight: 0,
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
            lineHeight: 0,
          },
        }}
      />
    </form>
  )
}

const EjectControl = ({ trackId }: { trackId: Track['id'] }) => {
  const [openDrawer, setOpenDrawer] = tableState.openDrawer()
  const ejectTrack = async () => {
    // If this is not the last track in the mix, open drawer, otherwise the drawer will open automatically
    const { tracks = [] } = await getState('mix')
    if (tracks.length > 1) setOpenDrawer(true)

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
      width={112}
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

const BeatResolutionControl = ({ trackId }: { trackId: TrackState['id'] }) => {
  const { beatResolution = 0.25 } =
    useLiveQuery(() => getTrackState(trackId), [trackId]) || {}

  const changeBeatResolution = (beatResolution: TrackState['beatResolution']) =>
    audioEvent.emit(trackId!, 'beatResolution', { beatResolution })

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

const TrackNavControl = ({ trackId }: { trackId: TrackState['id'] }) => {
  const navEvent = (effect: NavEvent) =>
    audioEvent.emit(trackId!, 'nav', { effect })

  const [playing] = audioState.playing()
  const isPlaying = playing.includes(trackId!)

  return (
    <ButtonGroup variant="text" color="inherit" disableRipple id="navControl">
      {[
        { val: 'Previous Beat Marker', icon: <SkipPrevious /> },
        { val: 'Go to Mixpoint', icon: <SettingsBackupRestore /> },
        //{ val: 'Set Mixpoint', icon: <Adjust /> },
        {
          val: isPlaying ? 'Pause' : 'Play',
          icon: isPlaying ? <Pause /> : <PlayArrow />,
        },
        { val: 'Next Beat Marker', icon: <SkipNext /> },
      ].map(item => (
        <Button
          component="button"
          onClick={e => navEvent(e.currentTarget.value as NavEvent)}
          key={item.val}
          value={item.val}
          title={item.val}
          sx={{
            '--Icon-color': 'var(--joy-palette-text-secondary)',
            borderColor: 'var(--joy-palette-divider) !important',
          }}
        >
          {item.icon}
        </Button>
      ))}
    </ButtonGroup>
  )
}

const MixControl = ({ tracks }: { tracks: MixState['tracks'] }) => {
  const [state, setState] = useState<NavEvent>('Go to Mixpoint')

  return (
    <RadioGroup
      row
      name="mixControl"
      variant="outlined"
      value={state}
      sx={{ height: 48 }}
      onChange={e => {
        const val = e.target.value as NavEvent

        setState(val)
        tracks?.forEach(trackId =>
          audioEvent.emit(trackId!, 'nav', { effect: val })
        )
      }}
    >
      {[
        { val: 'Go to Mixpoint', icon: <SettingsBackupRestore /> },
        {
          val: 'Pause',
          icon: <Pause />,
        },
        { val: 'Play', icon: <PlayArrow /> },
      ].map(item => (
        <Box
          key={item.val}
          sx={theme => ({
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 48,
            height: 48,
            '&:not([data-first-child])': {
              borderLeft: '1px solid',
              borderColor: 'divider',
              height: '99%',
            },
            [`&[data-first-child] .${radioClasses.action}`]: {
              borderTopLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`,
              borderBottomLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`,
              bottom: '2px',
              left: '-1px',
            },
            [`&[data-last-child] .${radioClasses.action}`]: {
              borderTopRightRadius: `calc(${theme.vars.radius.sm} - 1px)`,
              borderBottomRightRadius: `calc(${theme.vars.radius.sm} - 1px)`,
              height: '101%',
            },
          })}
        >
          <Radio
            value={item.val}
            disableIcon
            overlay
            label={item.icon}
            variant={state == item.val ? 'soft' : 'plain'}
            color="primary"
            componentsProps={{
              action: {
                sx: {
                  borderRadius: 0,
                  transition: 'none',
                },
              },
              label: { sx: { lineHeight: 0 } },
            }}
          />
        </Box>
      ))}
    </RadioGroup>
  )
}

const MixpointControl = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const { mixpoint } =
    useLiveQuery(() => getTrackState(trackId), [trackId]) || {}

  const [mixpointVal, setMixpointVal] = useState<string>('0:00.00')

  useEffect(() => setMixpointVal(mixpoint || '0:00.00'), [mixpoint])

  const adjustMixpoint = async (newMixpoint: string) => {
    if (newMixpoint == mixpoint) return

    //audioEvent.emit(trackId, 'mixpoint', { mixpoint: newMixpoint })
    //putTrackState(trackId, { mixpoint })
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        adjustMixpoint(mixpointVal)
      }}
    >
      <TextField
        variant="outlined"
        startDecorator={
          <Typography textColor="#aaa" sx={{ fontSize: 12, lineHeight: 0 }}>
            Mixpoint
          </Typography>
        }
        value={mixpointVal}
        onChange={e => setMixpointVal(e.target.value)}
        onBlur={() => adjustMixpoint(mixpointVal)}
        sx={{
          width: 144,
          '& div': {
            minHeight: '24px',
            borderColor: 'action.disabled',
          },
          '& input': {
            textAlign: 'right',
            fontSize: 12,
            color: 'text.secondary',
            lineHeight: 0,
          },
        }}
      />
    </form>
  )
}

export {
  BpmControl,
  OffsetControl,
  BeatResolutionControl,
  EjectControl,
  MixControl,
  MixpointControl,
  TrackNavControl,
}
