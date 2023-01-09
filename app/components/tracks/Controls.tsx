import {
  Adjust,
  Eject,
  Headset,
  HeadsetOff,
  Pause,
  PlayArrow,
  Replay,
  SettingsBackupRestore,
  SkipNext,
  SkipPrevious,
  VolumeOff,
  VolumeUp,
} from '@mui/icons-material'
import {
  Box,
  Chip,
  Link,
  Radio,
  radioClasses,
  RadioGroup,
  Slider,
  TextField,
  Typography,
} from '@mui/joy'
import { Button, ButtonGroup } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { audioEvents } from '~/api/audioEvents'
import {
  db,
  getPrefs,
  getTrackPrefs,
  MixPrefs,
  removeFromMix,
  Stem,
  Track,
  TrackPrefs,
  useLiveQuery,
} from '~/api/db/dbHandlers'

import { audioState, getAudioState, tableState } from '~/api/appState'
import { convertToSecs, timeFormat } from '~/utils/tableOps'

const inputText = (text: string) => {
  return (
    <Typography
      textColor='#888'
      sx={{ fontSize: 12, lineHeight: 0, cursor: 'default' }}
    >
      {text}
    </Typography>
  )
}

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
  emitEvent: 'bpm' | 'offset'
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

    audioEvents(trackId)[emitEvent](newVal)
  }

  const ResetValLink = () => (
    <Link
      underline='none'
      onClick={() => adjustVal()}
      color='neutral'
      title={title}
      disabled={!valDiff}
      sx={{
        fontSize: 12,
        WebkitTextFillColor: 'divider',
        lineHeight: 0,
      }}
    >
      {inputText(text)}
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
        variant='outlined'
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
    const { tracks = [] } = await getPrefs('mix')
    if (tracks.length > 1) setOpenDrawer(true)

    if (trackId) removeFromMix(trackId)
  }

  return (
    <Chip
      variant='outlined'
      color='primary'
      size='sm'
      onClick={() => ejectTrack()}
      sx={{
        borderRadius: 'sm',
      }}
    >
      <Eject titleAccess='Load Track' />
    </Chip>
  )
}

const BpmControl = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const { bpm } = useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

  const { adjustedBpm } =
    useLiveQuery(() => getTrackPrefs(trackId), [trackId]) || {}

  return (
    <NumberControl
      trackId={trackId}
      val={bpm}
      adjustedVal={adjustedBpm}
      toFixedVal={1}
      title='Reset BPM'
      text='BPM:'
      emitEvent='bpm'
      propName='adjustedBpm'
      width={115}
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
      title='Reset Beat Offset'
      text='Beat Offset:'
      emitEvent='offset'
      propName='adjustedOffset'
    />
  )
}

const BeatResolutionControl = ({ trackId }: { trackId: TrackPrefs['id'] }) => {
  const { beatResolution = 0.25 } =
    useLiveQuery(() => getTrackPrefs(trackId), [trackId]) || {}

  const changeBeatResolution = (beatResolution: TrackPrefs['beatResolution']) =>
    audioEvents(trackId!).beatResolution(beatResolution)

  return (
    <RadioGroup
      row
      name='beatResolution'
      value={beatResolution}
      variant='outlined'
      onChange={e =>
        changeBeatResolution(+e.target.value as TrackPrefs['beatResolution'])
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
              borderColor: theme.palette.divider,
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
            color='primary'
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

const TrackNavControl = ({ trackId }: { trackId: TrackPrefs['id'] }) => {
  const navEvent = (nav: string) => {
    switch (nav) {
      case 'Play':
        audioEvents(trackId).play()
        break
      case 'Pause':
        audioEvents(trackId).pause()
        break
      case 'Set Mixpoint':
        audioEvents(trackId).setMixpoint()
        break
      case 'Go to Mixpoint':
        audioEvents(trackId).seekMixpoint()
        break
      case 'Previous Beat Marker':
        audioEvents(trackId).seek(undefined, 'previous')
        break
      case 'Next Beat Marker':
        audioEvents(trackId).seek(undefined, 'next')
        break
    }
  }

  const [isPlaying] = audioState[trackId!].playing()

  return (
    <ButtonGroup variant='text' color='inherit' disableRipple id='navControl'>
      {[
        { val: 'Previous Beat Marker', icon: <SkipPrevious /> },
        { val: 'Go to Mixpoint', icon: <SettingsBackupRestore /> },
        { val: 'Set Mixpoint', icon: <Adjust /> },
        {
          val: isPlaying ? 'Pause' : 'Play',
          icon: isPlaying ? <Pause /> : <PlayArrow />,
        },
        { val: 'Next Beat Marker', icon: <SkipNext /> },
      ].map(item => (
        <Button
          component='button'
          onClick={e => navEvent(e.currentTarget.value)}
          key={item.val}
          value={item.val}
          title={item.val}
          sx={theme => ({
            '--Icon-color': theme.palette.text.secondary,
            borderColor: 'transparent !important',
          })}
        >
          {item.icon}
        </Button>
      ))}
    </ButtonGroup>
  )
}

const MixControl = ({ tracks }: { tracks: MixPrefs['tracks'] }) => {
  if (!tracks?.length) return

  const [state, setState] = useState('Go to Mixpoint')

  const navEvent = (nav: string) => {
    switch (nav) {
      case 'Play':
        for (const trackId of tracks) {
          audioEvents(trackId).play()
        }
        break
      case 'Pause':
        for (const trackId of tracks) {
          audioEvents(trackId).pause()
        }
        break
      case 'Go to Mixpoint':
        for (const trackId of tracks) {
          audioEvents(trackId).seekMixpoint()
        }
        break
    }
  }

  return (
    <RadioGroup
      row
      name='mixControl'
      variant='outlined'
      value={state}
      sx={{ height: 48 }}
      onChange={e => {
        const val = e.target.value

        setState(val)
        navEvent(val)
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
          sx={theme => {
            return {
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: 48,
              height: 48,
              '&:not([data-first-child])': {
                borderLeft: '1px solid',
                borderColor: `${theme.palette.divider} !important`,
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
            }
          }}
        >
          <Radio
            value={item.val}
            disableIcon
            overlay
            label={item.icon}
            variant={state == item.val ? 'soft' : 'plain'}
            color='primary'
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

  const { duration } =
    useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

  const { mixpointTime } =
    useLiveQuery(() => getTrackPrefs(trackId), [trackId]) || {}

  const [mixpointVal, setMixpointVal] = useState<string>('0:00.00')

  useEffect(() => setMixpointVal(timeFormat(mixpointTime || 0)), [mixpointTime])

  const adjustMixpoint = async (newMixpoint: string) => {
    if (convertToSecs(newMixpoint) == mixpointTime) return

    audioEvents(trackId).setMixpoint(newMixpoint)
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        adjustMixpoint(mixpointVal)
      }}
    >
      <TextField
        variant='outlined'
        startDecorator={inputText('Mixpoint:')}
        endDecorator={inputText(`/ ${timeFormat(duration || 0).slice(0, -3)}`)}
        value={mixpointVal}
        onChange={e => setMixpointVal(e.target.value)}
        onBlur={() => adjustMixpoint(mixpointVal)}
        sx={{
          width: 175,
          '& div': {
            minHeight: '24px',
            borderColor: 'action.disabled',
            '--Input-gap': '4px',
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

const StemControls = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const StemPlayer = ({ stemType }: { stemType: Stem }) => {
    const stemRef = useRef<HTMLAudioElement>(null)

    const [audioElement] = audioState[trackId].audioElements[stemType]()
    const { volume = 100, mute = false } = audioElement || {}

    const [solo, setSolo] = useState(false)

    const toggleSolo = () => {
      audioEvents(trackId).stemSoloToggle(stemType, !solo)
      setSolo(!solo)
    }

    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          sx={{
            fontSize: 'xs',
            fontWeight: 'md',
            pl: '3px',
            width: '60px',
          }}
        >
          {stemType[0].toUpperCase() + stemType.slice(1).toLowerCase()}
        </Typography>
        <Slider
          aria-label={stemType}
          value={volume}
          min={0}
          max={100}
          step={5}
          marks={[0, 25, 50, 75, 100].map(v => ({ value: v }))}
          valueLabelDisplay='auto'
          variant='soft'
          size={'sm'}
          onChange={(_, volume) =>
            audioEvents(trackId).stemVolume(stemType, volume as number)
          }
          disabled={mute}
          sx={{
            padding: '15px 0',
            mr: '4px',
          }}
        />
        <audio id={`${trackId}-${stemType.toLowerCase()}`} ref={stemRef} />
        <Headset
          fontSize='small'
          sx={{
            color: solo ? 'text.primary' : 'action.disabled',
            cursor: 'pointer',
          }}
          onClick={() => toggleSolo()}
        />
        {!volume || mute ? (
          <VolumeOff
            fontSize='small'
            sx={{ color: 'text.secondary', cursor: 'pointer' }}
            onClick={() => audioEvents(trackId).stemMuteToggle(stemType, false)}
          />
        ) : (
          <VolumeUp
            fontSize='small'
            sx={{ color: 'text.secondary', cursor: 'pointer' }}
            onClick={() => audioEvents(trackId).stemMuteToggle(stemType, true)}
          />
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ my: 1 }}>
      {['bass', 'drums', 'vocals', 'other'].map(v => (
        <StemPlayer key={v} stemType={v as Stem} />
      ))}
    </Box>
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
  StemControls,
}
