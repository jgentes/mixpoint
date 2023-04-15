import { Icon } from '@iconify-icon/react'
import {
  Box,
  Card,
  Chip,
  FormControl,
  Input,
  Link,
  Radio,
  RadioGroup,
  Slider,
  Typography,
  radioClasses,
} from '@mui/joy'
import { Button, ButtonGroup, SxProps } from '@mui/material'
import { useEffect, useState } from 'react'
import { audioEvents } from '~/api/audioEvents'
import {
  MixPrefs,
  STEMS,
  Stem,
  Track,
  TrackPrefs,
  db,
  getPrefs,
  getTrackPrefs,
  removeFromMix,
  useLiveQuery,
} from '~/api/db/dbHandlers'

import {
  audioState,
  getTableState,
  setAudioState,
  setTableState,
} from '~/api/appState'
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
      {valDiff ? (
        <Icon icon='ic:round-replay' height='14px' style={{ marginLeft: 2 }} />
      ) : (
        ''
      )}
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
          borderColor: 'action.selected',
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
  const [openDrawer] = getTableState.openDrawer()

  const ejectTrack = async () => {
    // If this is not the last track in the mix, open drawer, otherwise the drawer will open automatically
    const { tracks = [] } = await getPrefs('mix')
    if (tracks.length > 1) setTableState.openDrawer(true)

    if (trackId) removeFromMix(trackId)
  }

  return (
    <Chip
      variant='outlined'
      color='primary'
      size='sm'
      title='Load Track'
      onClick={() => ejectTrack()}
      sx={{
        minHeight: '21px',
        lineHeight: 0,
        '--Chip-radius': '5px',
        '--Chip-paddingInline': '0.4rem',
        '--Icon-fontSize': '16px',
      }}
    >
      <Icon icon='material-symbols:eject-rounded' height='20px' />
    </Chip>
  )
}

const BpmControl = ({
  trackId,
  styles,
}: {
  trackId: Track['id']
  styles: object
}) => {
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
      styles={styles}
    />
  )
}

const OffsetControl = ({
  trackId,
  styles,
}: {
  trackId: TrackPrefs['id']
  styles?: object
}) => {
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
      styles={styles}
    />
  )
}

const BeatResolutionControl = ({
  trackId,
  sx,
}: {
  trackId: TrackPrefs['id']
  sx?: SxProps
}) => {
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
        borderColor: 'action.selected',
        borderRadius: '5px',
        ...sx,
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

const TrackNavControl = ({ trackId = 0 }: { trackId: TrackPrefs['id'] }) => {
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

  const [isPlaying] = audioState[trackId].playing()

  return (
    <ButtonGroup variant='text' color='inherit' disableRipple id='navControl'>
      {[
        {
          val: 'Previous Beat Marker',
          icon: <Icon icon='material-symbols:skip-previous' height='20px' />,
        },
        {
          val: 'Go to Mixpoint',
          icon: (
            <Icon
              icon='material-symbols:settings-backup-restore'
              height='20px'
            />
          ),
        },

        {
          val: 'Set Mixpoint',
          icon: <Icon icon='material-symbols:adjust-outline' height='18px' />,
        },
        {
          val: isPlaying ? 'Pause' : 'Play',
          icon: isPlaying ? (
            <Icon icon='material-symbols:pause' height='20px' />
          ) : (
            <Icon icon='material-symbols:play-arrow' height='20px' />
          ),
        },
        {
          val: 'Next Beat Marker',
          icon: <Icon icon='material-symbols:skip-next' height='20px' />,
        },
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
        {
          val: 'Go to Mixpoint',
          icon: (
            <Icon
              icon='material-symbols:settings-backup-restore'
              height='18px'
            />
          ),
        },
        {
          val: 'Pause',
          icon: <Icon icon='material-symbols:pause' height='20px' />,
        },
        {
          val: 'Play',
          icon: <Icon icon='material-symbols:play-arrow' height='20px' />,
        },
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
          borderColor: 'action.selected',
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
  const { duration = 1 } =
    useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}
  const [waveform] = audioState[trackId].stems[stemType].waveform()
  if (waveform) waveform.drawer.progress(1 / (duration / time))

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
        <Icon
          icon={solo ? 'ic:baseline-headset-off' : 'ic:baseline-headset'}
          height='16px'
          title='Solo'
          style={{
            color: '#aaa',
            cursor: 'pointer',
          }}
          onClick={() => toggleSolo()}
        />
        {!volume || mute ? (
          <Icon
            icon='material-symbols:volume-off'
            title='Mute'
            height='16px'
            style={{ color: '#aaa', cursor: 'pointer' }}
            onClick={() => audioEvents.stemMuteToggle(trackId, stemType, false)}
          />
        ) : (
          <Icon
            icon='material-symbols:volume-up'
            title='Unmute'
            height='16px'
            style={{ color: '#aaa', cursor: 'pointer' }}
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
    step={2}
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

const TrackTime = ({ trackId, sx }: { trackId: Track['id']; sx?: SxProps }) => {
  const [time = 0] = audioState[trackId!].time()

  // adjust time marker on waveform
  const [waveform] = audioState[trackId!].waveform()
  const { duration = 1 } =
    useLiveQuery(() => db.tracks.get(trackId!), [trackId]) || {}

  if (waveform) {
    // TODO: this should probably not be in the TrackTime component :/
    const drawerTime = 1 / (duration / time) || 0
    waveform.drawer.progress(drawerTime)
    //@ts-ignore - minimap does indeed have a drawer.progress method
    waveform.minimap.drawer.progress(drawerTime)
  }

  return (
    <Typography sx={{ fontSize: 'sm', ...sx }}>{timeFormat(time)}</Typography>
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
  StemControl,
  CrossfaderControl,
  StemsCrossfaders,
  TrackTime,
}
