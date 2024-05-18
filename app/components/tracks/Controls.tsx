import { type Key, useCallback, useEffect, useRef, useState } from 'react'
import { audioEvents } from '~/api/handlers/audioEvents.client'
import {
  STEMS,
  type Stem,
  type Track,
  db,
  useLiveQuery
} from '~/api/handlers/dbHandlers'

import {
  Button,
  Input,
  Link,
  Select,
  SelectItem,
  Slider,
  Tab,
  Tabs,
  Tooltip
} from '@nextui-org/react'
import { mix } from 'framer-motion'
import { useSnapshot } from 'valtio'
import {
  type MixState,
  type TrackState,
  appState,
  audioState,
  mixState
} from '~/api/models/appState.client'
import { Waveform } from '~/api/renderWaveform.client'
import {
  EjectIcon,
  HeadsetIcon,
  HeadsetOffIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  ReplayIcon,
  RevertIcon,
  SetMixpointIcon,
  VolumeOffIcon,
  VolumeUpIcon
} from '~/components/icons'
import { ProgressBar } from '~/components/layout/Loader'
import VolumeMeter from '~/components/mixes/VolumeMeter'
import { convertToSecs, timeFormat } from '~/utils/tableOps'

const InputText = ({
  text,
  className
}: { text: string; className?: string }) => (
  <div className={`text-default-500 text-xs whitespace-nowrap ${className}`}>
    {text}
  </div>
)

const NumberControl = ({
  trackId,
  val,
  adjustedVal,
  toFixedVal = 1,
  title,
  text,
  emitEvent,
  className
}: {
  trackId: Track['id']
  val: number | undefined
  adjustedVal: number | undefined
  toFixedVal?: number
  title: string
  text: string
  emitEvent: 'bpm' | 'offset'
  className?: string
}) => {
  const [inputVal, setInputVal] = useState<string>('0')

  const fixedVal = useCallback(
    (num: number) => Number(num).toFixed(toFixedVal),
    [toFixedVal]
  )

  useEffect(
    () => setInputVal(String(fixedVal(adjustedVal ?? val ?? 0))),
    [adjustedVal, val, fixedVal]
  )

  const valDiff =
    adjustedVal !== undefined &&
    val !== undefined &&
    fixedVal(adjustedVal) !== fixedVal(val)

  const adjustVal = async (newVal?: string) => {
    // this updates db state
    const value = newVal ?? val
    if (value === undefined || Number.isNaN(Number(value))) return

    setInputVal(fixedVal(Number(value)))
    audioEvents[emitEvent](trackId, Number(value))
  }

  const ResetValLink = () => (
    <Tooltip color="default" content={title} size="sm" isDisabled={!valDiff}>
      <Link
        underline="none"
        onClick={() => adjustVal()}
        className={valDiff ? 'cursor-pointer' : 'cursor-default'}
      >
        <InputText text={text} />
        {valDiff ? (
          <ReplayIcon className="pl-1 text-lg text-default-600" />
        ) : (
          ''
        )}
      </Link>
    </Tooltip>
  )

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        adjustVal(inputVal)
        if (inputRef.current) {
          inputRef.current.blur()
        }
      }}
    >
      <Input
        ref={inputRef}
        variant="bordered"
        startContent={<ResetValLink />}
        value={inputVal}
        onValueChange={val => {
          // this simply updates the visible component state
          if (!Number.isNaN(val)) setInputVal(val)
        }}
        onBlur={() => {
          if (fixedVal(Number(inputVal)) !== fixedVal(Number(adjustedVal)))
            adjustVal(inputVal)
        }}
        classNames={{
          base: className,
          inputWrapper: 'border-1 bg-default-50 rounded px-2 h-6 min-h-0',
          input: 'text-xs text-right text-default-600'
        }}
      />
    </form>
  )
}

const EjectControl = ({ trackId }: { trackId: Track['id'] }) => {
  return (
    <Button
      isIconOnly
      variant="light"
      color="primary"
      size="sm"
      radius="sm"
      title="Load Track"
      onClick={() => audioEvents.ejectTrack(trackId)}
      className="border-1 rounded h-6 border-primary-300 text-primary-700"
    >
      <EjectIcon className="text-2xl" />
    </Button>
  )
}

const ZoomSelectControl = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId || !mixState.trackState[trackId]) return null

  const { stemZoom } = useSnapshot(mixState.trackState[trackId]) || {}

  return (
    <Select
      size="sm"
      selectedKeys={[stemZoom || 'all']}
      aria-label="Stem Zoom"
      onChange={e => {
        const zoomVal = e.target.value as Stem | 'all'
        if (e.target.value)
          mixState.trackState[trackId].stemZoom =
            zoomVal === 'all' ? undefined : zoomVal
      }}
      classNames={{
        mainWrapper: 'w-24 m-auto',
        listbox: 'p-0',
        trigger:
          'py-0 pl-2 border-1 bg-default-50 border-default-300 rounded h-6 min-h-0',
        popoverContent: 'p-0 text-sm',
        value: 'text-xs text-default-600'
      }}
    >
      {[
        <SelectItem key="all" value="all">
          All Stems
        </SelectItem>,
        ...STEMS.map(stem => (
          <SelectItem value={stem} key={stem}>
            {stem[0].toUpperCase() + stem.slice(1).toLowerCase()}
          </SelectItem>
        ))
      ]}
    </Select>
  )
}

const BpmControl = ({
  trackId,
  className
}: {
  trackId: Track['id']
  className: string
}) => {
  if (!trackId || !mixState.trackState[trackId]) return null

  const { adjustedBpm } = useSnapshot(mixState.trackState[trackId]) || {}

  const { bpm } = useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

  return (
    <NumberControl
      trackId={trackId}
      val={bpm}
      adjustedVal={adjustedBpm}
      toFixedVal={1}
      title="Reset BPM"
      text="BPM:"
      emitEvent="bpm"
      className={className}
    />
  )
}

const OffsetControl = ({
  trackId,
  className
}: {
  trackId: Track['id']
  className?: string
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
      title="Reset Beat Offset"
      text="Beat Offset:"
      emitEvent="offset"
      className={className}
    />
  )
}

const BeatResolutionControl = ({
  trackId
}: {
  trackId: Track['id']
}) => {
  if (!trackId || !mixState.trackState[trackId]) return null

  const { beatResolution = '1:4' } =
    useSnapshot(mixState.trackState[trackId]) || {}

  return (
    <Tooltip color="default" size="sm" content="Beat Resolution">
      <Tabs
        selectedKey={beatResolution}
        aria-label="Beat Resolution"
        variant="solid"
        classNames={{
          base: 'border-1 border-default-300 rounded',
          tabList: 'rounded h-6 bg-default-50 px-0 gap-.5',
          tab: 'rounded px-2 text-xs h-auto',
          tabContent: 'group-data-[selected=true]:text-default-600',
          cursor:
            'group-data-[selected=true]:bg-transparent group-data-[selected=true]:border-1 group-data-[selected=true]:border-primary-500 group-data-[selected=true]:rounded p-2'
        }}
        onSelectionChange={key =>
          audioEvents.beatResolution(
            trackId,
            key as TrackState['beatResolution']
          )
        }
      >
        {['1:1', '1:2', '1:4'].map(item => (
          <Tab key={item} title={item} />
        ))}
      </Tabs>
    </Tooltip>
  )
}

const TrackNavControl = ({ trackId = 0 }: { trackId: Track['id'] }) => {
  if (!trackId || !audioState[trackId]) return null

  const { playing } = useSnapshot(audioState[trackId])

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
        audioEvents.seek(trackId, 0, 'previous')
        break
      case 'Next Beat Marker':
        audioEvents.seek(trackId, 0, 'next')
        break
    }
  }

  return (
    <>
      {[
        {
          val: 'Previous Beat Marker',
          icon: <PreviousIcon className="text-3xl" />
        },
        {
          val: 'Go to Mixpoint',
          icon: <RevertIcon className="text-xl" />
        },

        {
          val: 'Set Mixpoint',
          icon: <SetMixpointIcon className="text-xl" />
        },
        {
          val: playing ? 'Pause' : 'Play',
          icon: playing ? (
            <PauseIcon className="text-3xl" />
          ) : (
            <PlayIcon className="text-3xl" />
          )
        },
        {
          val: 'Next Beat Marker',
          icon: <NextIcon className="text-3xl" />
        }
      ].map(item => {
        const noNudge = item.val.includes('Nudge') && !playing

        return (
          <Tooltip key={item.val} color="default" size="sm" content={item.val}>
            <Button
              isIconOnly
              variant="light"
              color="default"
              onClick={e => navEvent(e.currentTarget.value)}
              key={item.val}
              value={item.val}
              title={item.val}
              disabled={noNudge}
              className="align-middle rounded"
            >
              {item.icon}
            </Button>
          </Tooltip>
        )
      })}
    </>
  )
}

const MixControl = ({ tracks }: { tracks: MixState['tracks'] }) => {
  if (!tracks?.length) return null

  const navEvent = (nav: Key) => {
    switch (nav) {
      case 'Play':
        audioEvents.play()
        break
      case 'Pause':
        audioEvents.pause()
        break
      case 'Go to Mixpoint':
        for (const track of tracks) audioEvents.seekMixpoint(track)
        break
    }
  }

  return (
    <Tabs
      aria-label="Mix Controls"
      variant="light"
      classNames={{
        base: 'border-1 border-primary-300 rounded',
        tabList: 'rounded h-7 bg-primary-50 px-0 gap-.5',
        tab: 'rounded px-3 h-auto',
        tabContent:
          'group-data-[selected=true]:text-primary-700 text-primary-700',
        cursor:
          'group-data-[selected=true]:bg-transparent group-data-[selected=true]:rounded p-2'
      }}
      defaultSelectedKey={'Pause'}
      onSelectionChange={navEvent}
    >
      {[
        {
          val: 'Go to Mixpoint',
          icon: <RevertIcon className="text-lg" />
        },
        {
          val: 'Pause',
          icon: <PauseIcon className="text-2xl" />
        },
        {
          val: 'Play',
          icon: <PlayIcon className="text-2xl" />
        }
      ].map(item => (
        <Tab key={item.val} aria-label={item.val} title={item.icon} />
      ))}
    </Tabs>
  )
}

const MixpointControl = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId || !mixState.trackState[trackId]) return null

  const { mixpointTime } = useSnapshot(mixState.trackState[trackId]) || {}

  const [mixpointVal, setMixpointVal] = useState<string>('0:00.00')

  useEffect(() => setMixpointVal(timeFormat(mixpointTime || 0)), [mixpointTime])

  const adjustMixpoint = async (newMixpoint: string) => {
    if (convertToSecs(newMixpoint) === mixpointTime) return null

    audioEvents.setMixpoint(trackId, newMixpoint)
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        adjustMixpoint(mixpointVal)
      }}
    >
      <Input
        variant="bordered"
        startContent={<InputText text="Mixpoint:" className="cursor-default" />}
        value={mixpointVal}
        onValueChange={setMixpointVal}
        onBlur={() => adjustMixpoint(mixpointVal)}
        classNames={{
          base: 'w-32',
          inputWrapper: 'border-1 bg-default-50 rounded px-2 h-6 min-h-0',
          input: 'text-xs text-right text-default-600'
        }}
      />
    </form>
  )
}

const StemControl = ({
  trackId,
  stemType
}: {
  trackId: Track['id']
  stemType: Stem
}) => {
  if (!trackId) return null

  const { volume = 100, mute = false } =
    useSnapshot(audioState[trackId])?.stems?.[stemType] || {}

  const [solo, setSolo] = useState(false)

  const toggleSolo = () => {
    audioEvents.stemSoloToggle(trackId, stemType, !solo)
    setSolo(!solo)
  }

  const iconStyle = 'text-xl cursor-pointer text-default-500'

  const containerClass =
    'p-0 border-1 border-divider rounded bg-default-50 overflow-hidden h-5'

  const AnalyzingOverlay = () => {
    const { stemsAnalyzing } = useSnapshot(appState)
    const isAnalyzing = stemsAnalyzing.has(trackId)

    return !isAnalyzing ? null : (
      <div className={`${containerClass} absolute z-10 w-full top-0`}>
        <div className="relative w-1/2 top-1/2 -mt-0.5 m-auto">
          <ProgressBar />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 justify-between">
      <div className="text-xs w-14 text-default-600">
        {stemType[0].toUpperCase() + stemType.slice(1).toLowerCase()}
      </div>
      <div className="w-full">
        <div
          className={`${containerClass} relative z-1`}
          onClick={e => {
            const parent = e.currentTarget.querySelectorAll('div')[1]
            audioEvents.clickToSeek(trackId, e, parent)
          }}
        >
          <AnalyzingOverlay />
          <Waveform trackId={trackId} stem={stemType} />
        </div>

        <VolumeMeter trackId={trackId} stemType={stemType} />
      </div>
      {solo ? (
        <HeadsetOffIcon className={iconStyle} onClick={() => toggleSolo()} />
      ) : (
        <HeadsetIcon className={iconStyle} onClick={() => toggleSolo()} />
      )}
      {!volume || mute ? (
        <VolumeOffIcon
          className={iconStyle}
          onClick={() => audioEvents.stemMuteToggle(trackId, stemType, false)}
        />
      ) : (
        <VolumeUpIcon
          className={iconStyle}
          onClick={() => audioEvents.stemMuteToggle(trackId, stemType, true)}
        />
      )}
    </div>
  )
}

const StemsCrossfaders = () => (
  <div className="mt-4">
    {STEMS.map(stem => (
      <CrossfaderControl key={stem} stemType={stem as Stem} />
    ))}
  </div>
)

const CrossfaderControl = ({ stemType }: { stemType?: Stem }) => (
  <Slider
    aria-label="crossfader"
    color="foreground"
    defaultValue={50}
    radius="sm"
    minValue={0}
    maxValue={100}
    fillOffset={50}
    step={2}
    marks={[0, 50, 100].map(value => ({ value, label: '' }))}
    hideValue
    size="sm"
    onChange={val => audioEvents.crossfade(val as number, stemType)}
    classNames={{
      base: 'mb-3',
      filler: 'bg-transparent',
      thumb: 'h-5 w-3 bg-primary-400 border-1 border-primary-400'
    }}
  />
)

const TrackTime = ({
  trackId,
  className
}: { trackId: Track['id']; className?: string }) => {
  const { time = 0 } = useSnapshot(audioState[trackId])

  return <div className={className}>{timeFormat(time)}</div>
}

export {
  BeatResolutionControl,
  BpmControl,
  CrossfaderControl,
  EjectControl,
  MixControl,
  MixpointControl,
  OffsetControl,
  StemControl,
  StemsCrossfaders,
  TrackNavControl,
  TrackTime,
  ZoomSelectControl
}
