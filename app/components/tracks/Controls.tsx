import {
  Adjust,
  Eject,
  Headset,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
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
  Card,
  Chip,
  FormControl,
  Input,
  Link,
  Radio,
  radioClasses,
  RadioGroup,
  Slider,
  Typography,
} from '@mui/joy'
import { Button, ButtonGroup } from '@mui/material'
import { useEffect, useState } from 'react'
import { audioEvents } from '~/api/audioEvents'
import {
  db,
  getPrefs,
  getTrackPrefs,
  MixPrefs,
  removeFromMix,
  Stem,
  STEMS,
  Track,
  TrackPrefs,
  useLiveQuery,
} from '~/api/db/dbHandlers'

import { audioState, setAudioState, tableState } from '~/api/appState'
import VolumeMeter from '~/components/mixes/VolumeMeter'
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

    audioEvents[emitEvent](trackId, newVal)
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
      }}
    >
      {inputText(text)}
      {valDiff ? <Replay sx={{ ml: 0.5 }} /> : ''}
    </Link>
  )

  return (
    <FormControl
      style={{ ...styles }}
      onSubmit={e => {
        e.preventDefault()
        adjustVal(Number(inputVal))
      }}
      sx={{
        '& div': {
          '--Input-minHeight': '24px',
        },
      }}
    >
      <Input
        variant='outlined'
        startDecorator={<ResetValLink />}
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onBlur={() => {
          if (Number(inputVal) !== adjustedVal) adjustVal(Number(inputVal))
        }}
        sx={{
          width,
          borderRadius: '5px',
          '& div': {
            borderColor: 'action.disabled',
          },
          '& input': {
            textAlign: 'right',
            fontSize: 12,
            color: 'text.secondary',
          },
        }}
      />
    </FormControl>
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
        minHeight: '21px',
        lineHeight: 0,
        '--Chip-radius': '5px',
        '--Chip-paddingInline': '0.4rem',
        '--Icon-fontSize': '16px',
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
      width={115}
    />
  )
}

const OffsetControl = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const { offset, adjustedOffset } =
    useLiveQuery(() => db.tracks.get(trackId)) || {}

  return (
    <NumberControl
      trackId={trackId}
      val={offset}
      adjustedVal={adjustedOffset}
      toFixedVal={2}
      title='Reset Beat Offset'
      text='Beat Offset:'
      emitEvent='offset'
    />
  )
}

const BeatResolutionControl = ({ trackId }: { trackId: TrackPrefs['id'] }) => {
  const { beatResolution = 1 } =
    useLiveQuery(() => getTrackPrefs(trackId), [trackId]) || {}

  const changeBeatResolution = (beatResolution: TrackPrefs['beatResolution']) =>
    audioEvents.beatResolution(trackId, beatResolution)

  return (
    <RadioGroup
      orientation={'horizontal'}
      name='beatResolution'
      value={beatResolution}
      variant='outlined'
      sx={{
        borderRadius: '5px',
      }}
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
              borderTopLeftRadius: '5px',
              borderBottomLeftRadius: '5px',
            },
            [`&[data-last-child] .${radioClasses.action}`]: {
              borderTopRightRadius: '5px',
              borderBottomRightRadius: '5px',
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
            slotProps={{
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

const MixpointNavControl = ({ trackId }: { trackId: TrackPrefs['id'] }) => {
  const navEvent = (nav: string) => {
    switch (nav) {
      case 'Set Mixpoint':
        audioEvents.setMixpoint(trackId)
        break
      case 'Previous Beat Marker':
        audioEvents.seek(trackId, undefined, 'previous')
        break
      case 'Next Beat Marker':
        audioEvents.seek(trackId, undefined, 'next')
        break
    }
  }

  return (
    <ButtonGroup
      variant='text'
      color='inherit'
      disableRipple
      id='navControl'
      sx={{
        '.MuiButtonGroup-grouped': { minWidth: '30px' },
      }}
    >
      {[
        {
          val: 'Previous Beat Marker',
          icon: <SkipPrevious sx={{ fontSize: '20px' }} />,
        },
        { val: 'Set Mixpoint', icon: <Adjust sx={{ fontSize: '18px' }} /> },
        {
          val: 'Next Beat Marker',
          icon: <SkipNext sx={{ fontSize: '20px' }} />,
        },
      ].map(item => (
        <Button
          component='button'
          onClick={e => navEvent(e.currentTarget.value)}
          key={item.val}
          value={item.val}
          title={item.val}
          sx={theme => ({
            padding: 0,
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

const TrackNavControl = ({ trackId = 0 }: { trackId: TrackPrefs['id'] }) => {
  const nudgeIndicator = (direction: 'forward' | 'backward') => {
    setAudioState[trackId!].nudged(direction)
    setTimeout(() => setAudioState[trackId!].nudged(), 200)
  }

  const navEvent = (nav: string) => {
    switch (nav) {
      case 'Play':
        audioEvents.play(trackId)
        break
      case 'Pause':
        audioEvents.pause(trackId)
        break
      case 'Go to Mixpoint':
        audioEvents.seekMixpoint(trackId)
        break
      case 'Nudge Forward':
        audioEvents.nudge(trackId, 'forward')
        nudgeIndicator('forward')
        break
      case 'Nudge Backward':
        audioEvents.nudge(trackId, 'backward')
        nudgeIndicator('backward')
        break
    }
  }

  const [isPlaying] = audioState[trackId].playing()

  return (
    <ButtonGroup variant='text' color='inherit' disableRipple id='navControl'>
      {[
        { val: 'Nudge Backward', icon: <KeyboardDoubleArrowLeft /> },
        { val: 'Go to Mixpoint', icon: <SettingsBackupRestore /> },
        {
          val: isPlaying ? 'Pause' : 'Play',
          icon: isPlaying ? <Pause /> : <PlayArrow />,
        },
        { val: 'Nudge Forward', icon: <KeyboardDoubleArrowRight /> },
      ].map(item => {
        const noNudge = item.val.includes('Nudge') && !isPlaying

        return (
          <Button
            component='button'
            onClick={e => navEvent(e.currentTarget.value)}
            key={item.val}
            value={item.val}
            title={item.val}
            disabled={noNudge}
            sx={theme => ({
              '--Icon-color': noNudge
                ? theme.palette.action.selected
                : theme.palette.text.secondary,
              borderColor: 'transparent !important',
            })}
          >
            {item.icon}
          </Button>
        )
      })}
    </ButtonGroup>
  )
}

const MixControl = ({ tracks }: { tracks: MixPrefs['tracks'] }) => {
  if (!tracks?.length) return null

  const navEvent = (nav: string) => {
    switch (nav) {
      case 'Play':
        audioEvents.play()
        break
      case 'Pause':
        audioEvents.pause()
        break
      case 'Go to Mixpoint':
        audioEvents.seekMixpoint()
        break
    }
  }

  const radioSize = 28

  return (
    <RadioGroup
      orientation={'horizontal'}
      name='mixControl'
      variant='outlined'
      sx={{ height: radioSize, mb: 1 }}
      onClick={e => {
        const el = e.target as HTMLInputElement
        navEvent(el.value)
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
              width: radioSize * 2,
              height: radioSize,
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
            variant='plain'
            color='primary'
            slotProps={{
              root: {
                sx: {
                  '--Icon-fontSize': `${radioSize - 8}px`,
                },
              },
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
    if (convertToSecs(newMixpoint) == mixpointTime) return null

    audioEvents.setMixpoint(trackId, newMixpoint)
  }

  return (
    <FormControl
      onSubmit={e => {
        e.preventDefault()
        adjustMixpoint(mixpointVal)
      }}
      sx={{
        '& div': {
          '--Input-minHeight': '24px',
        },
      }}
    >
      <Input
        variant='outlined'
        startDecorator={inputText('Mixpoint:')}
        endDecorator={inputText(`/ ${timeFormat(duration || 0).slice(0, -3)}`)}
        value={mixpointVal}
        onChange={e => setMixpointVal(e.target.value)}
        onBlur={() => adjustMixpoint(mixpointVal)}
        sx={{
          width: 175,
          borderRadius: '5px',
          '& div': {
            borderColor: 'action.disabled',
            '--Input-gap': '4px',
          },
          '& input': {
            textAlign: 'right',
            fontSize: 12,
            color: 'text.secondary',
          },
        }}
      />
    </FormControl>
  )
}

const StemControl = ({
  trackId,
  stemType,
}: {
  trackId: Track['id']
  stemType: Stem
}) => {
  if (!trackId) return null

  const [volume = 100] = audioState[trackId].stems[stemType].volume()
  const [mute = false] = audioState[trackId].stems[stemType].mute()

  const [solo, setSolo] = useState(false)

  // adjust stem time marker based on main waveform
  const [time = 0] = audioState[trackId].time()
  const [waveform] = audioState[trackId].stems[stemType].waveform()
  if (waveform) waveform.drawer.progress(1 / (waveform.getDuration() / time))

  const toggleSolo = () => {
    audioEvents.stemSoloToggle(trackId, stemType, !solo)
    setSolo(!solo)
  }

  const loaderSx = {
    p: 0,
    border: '1px solid',
    borderColor: 'action.focus',
    borderRadius: '4px',
    borderBottom: 'none',
    bgcolor: 'background.body',
    overflow: 'hidden',
    zIndex: 1,
  }

  return (
    <>
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
        <Box sx={{ width: '100%' }}>
          <Card
            id={`zoomview-container_${trackId}_${stemType}`}
            sx={{
              ...loaderSx,
              height: '20px',
              pt: '3px',
            }}
          />
          <VolumeMeter trackId={trackId} stemType={stemType} />
        </Box>

        {/* <Slider
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
            audioEvents.stemVolume(trackId, stemType, volume as number)
          }
          disabled={mute}
          sx={{
            padding: '15px 0',
            mr: '4px',
          }}
        /> */}
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
            onClick={() => audioEvents.stemMuteToggle(trackId, stemType, false)}
          />
        ) : (
          <VolumeUp
            fontSize='small'
            sx={{ color: 'text.secondary', cursor: 'pointer' }}
            onClick={() => audioEvents.stemMuteToggle(trackId, stemType, true)}
          />
        )}
      </Box>
    </>
  )
}

const StemsCrossfaders = () => (
  <Box sx={{ my: 1, lineHeight: 1.2 }}>
    {STEMS.map(stem => (
      <CrossfaderControl key={stem} stemType={stem as Stem} />
    ))}
  </Box>
)

const CrossfaderControl = ({ stemType }: { stemType?: Stem }) => (
  <Slider
    aria-label='crossfader'
    defaultValue={50}
    min={0}
    max={100}
    step={5}
    track={false}
    marks={[0, 50, 100].map(v => ({ value: v }))}
    valueLabelDisplay='off'
    variant='soft'
    size='md'
    onChange={(_, val) => audioEvents.crossfade(val as number, stemType)}
    sx={{
      padding: '15px 0',
      '& .MuiSlider-thumb': {
        width: '10px',
        height: '20px',
        borderRadius: '3px',
      },
    }}
  />
)

export {
  BpmControl,
  OffsetControl,
  BeatResolutionControl,
  EjectControl,
  MixControl,
  MixpointControl,
  TrackNavControl,
  MixpointNavControl,
  StemControl,
  CrossfaderControl,
  StemsCrossfaders,
}
