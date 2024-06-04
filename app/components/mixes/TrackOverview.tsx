import { useSnapshot } from 'valtio'
import { audioEvents } from '~/api/handlers/audioEvents.client'
import { type Track, db, useLiveQuery } from '~/api/handlers/dbHandlers'
import { audioState, mixState, uiState } from '~/api/models/appState.client'
import { Waveform } from '~/api/renderWaveform.client'
import { ProgressBar } from '~/components/layout/Loader'
import VolumeMeter from '~/components/mixes/VolumeMeter'
import {
  BeatResolutionControl,
  MixpointControl,
  OffsetControl,
  TrackTime,
  ZoomSelectControl
} from '~/components/tracks/Controls'
import { timeFormat } from '~/utils/tableOps'

const TrackOverview = ({ trackSlot }: { trackSlot: 0 | 1 }) => {
  const trackId = useSnapshot(mixState).tracks[trackSlot]
  console.log('trackoverview:', trackSlot, trackId, mixState, audioState)
  if (!trackId || !audioState[trackId]) return null

  const { stemState } = useSnapshot(audioState[trackId])

  const { duration = 0 } =
    useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

  const containerClass =
    'p-0 border-1 border-divider rounded bg-default-50 overflow-hidden h-20'

  const TrackHeader = () => {
    return (
      <div className="flex justify-between mb-2 items-center">
        {/* <div className="flex w-36">
          <TrackTime
            className="px-1 text-xs text-default-600"
            trackId={trackId}
          />
          <div className="text-xs text-default-600 whitespace-nowrap">
            / {timeFormat(duration)}
          </div>
        </div> */}

        {stemState !== 'ready' ? null : <ZoomSelectControl trackId={trackId} />}

        {/* <BeatResolutionControl trackId={trackId} /> */}
      </div>
    )
  }

  const TrackFooter = () => (
    <div className="flex gap-1 mt-1 items-center justify-between">
      {/* <MixpointControl trackId={trackId} /> */}
      <OffsetControl trackId={trackId} className="ml-auto w-36" />
    </div>
  )

  const AnalyzingOverlay = () => {
    const { analyzing } = useSnapshot(uiState)
    const isAnalyzing = analyzing.has(trackId)

    return !isAnalyzing ? null : (
      <div className={`${containerClass} absolute z-10 w-full top-0`}>
        <div className="relative w-1/2 top-1/2 -mt-0.5 m-auto">
          <ProgressBar />
        </div>
      </div>
    )
  }

  const TrackOrStem = () => {
    if (!mixState.trackState?.[trackId]) return null

    // rerender if stemZoom changes
    useSnapshot(mixState.trackState[trackId]).stemZoom

    // add to analyzing state
    uiState.analyzing.add(trackId)

    return <Waveform trackId={trackId} />
  }

  return (
    <>
      <TrackHeader />

      <div className="flex">
        <div className="flex flex-col w-36 justify-between">
          <TrackTime
            className="px-1 text-xs text-default-600"
            trackId={trackId}
          />
          <div className="text-xs text-default-600 whitespace-nowrap">
            / {timeFormat(duration)}
          </div>
          <MixpointControl trackId={trackId} />
        </div>

        <div
          className={`${containerClass} relative z-1`}
          onClick={e => {
            const parent = e.currentTarget.querySelectorAll('div')[1]
            audioEvents.clickToSeek(trackId, e, parent)
          }}
          onWheel={e =>
            audioEvents.seek(trackId, 0, e.deltaY > 0 ? 'next' : 'previous')
          }
        >
          <AnalyzingOverlay />
          <TrackOrStem />
        </div>

        <VolumeMeter trackId={trackId} />
        <div className="flex flex-col w-36 justify-between">
          <BeatResolutionControl trackId={trackId} />
          <OffsetControl trackId={trackId} className="ml-auto w-36" />
        </div>
      </div>

      {/* <TrackFooter /> */}
    </>
  )
}

export { TrackOverview as default }
