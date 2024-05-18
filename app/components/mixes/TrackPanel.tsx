import { useRef } from 'react'
import { useSnapshot } from 'valtio'
import { audioEvents } from '~/api/handlers/audioEvents.client'
import { type Track, db, useLiveQuery } from '~/api/handlers/dbHandlers'
import { appState, audioState, mixState } from '~/api/models/appState.client'
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

const TrackPanel = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId || !audioState[trackId]) return null
  const overviewContainer = useRef<HTMLDivElement | null>(null)

  const containerClass =
    'p-0 border-1 border-divider rounded bg-default-50 overflow-hidden h-20'

  const TrackHeader = () => {
    const { stemState } = useSnapshot(audioState[trackId])

    const { duration = 0 } =
      useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

    return (
      <div className="flex justify-between mb-2 items-center">
        <div className="flex w-36">
          <TrackTime
            className="px-1 text-xs text-default-600"
            trackId={trackId}
          />
          <div className="text-xs text-default-600 whitespace-nowrap">
            / {timeFormat(duration)}
          </div>
        </div>

        {stemState !== 'ready' ? null : <ZoomSelectControl trackId={trackId} />}

        <BeatResolutionControl trackId={trackId} />
      </div>
    )
  }

  const MixCardOverview = () => {
    const { analyzing } = useSnapshot(appState)
    const isAnalyzing = analyzing.has(trackId)

    const loaderClassNames =
      'p-0 border-1 border-divider rounded bg-default-50 overflow-hidden'

    return (
      <div
        ref={overviewContainer}
        className={`${loaderClassNames} relative z-1 py-1 mb-3 h-8`}
        onClick={e => {
          const parents = e.currentTarget.firstElementChild as HTMLElement
          const parent = parents.children[1] as HTMLElement
          audioEvents.clickToSeek(trackId, e, parent)
        }}
      >
        {!isAnalyzing ? null : (
          <div className={`${loaderClassNames} absolute z-10 w-full h-8 top-0`}>
            <div className="relative w-1/2 top-1/2 -mt-0.5 m-auto">
              <ProgressBar />
            </div>
          </div>
        )}
      </div>
    )
  }

  const TrackFooter = () => (
    <div className="flex gap-1 mt-1 items-center justify-between">
      <MixpointControl trackId={trackId} />
      <OffsetControl trackId={trackId} className="ml-auto w-36" />
    </div>
  )

  const AnalyzingOverlay = () => {
    const { analyzing } = useSnapshot(appState)
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
    if (!mixState.trackState[trackId]) return null

    // rerender if stemZoom changes
    useSnapshot(mixState.trackState[trackId]).stemZoom

    // add to analyzing state
    appState.analyzing.add(trackId)

    return <Waveform trackId={trackId} overviewRef={overviewContainer} />
  }

  return (
    <>
      <TrackHeader />

      <MixCardOverview />

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

      <TrackFooter />
    </>
  )
}

export { TrackPanel as default }
