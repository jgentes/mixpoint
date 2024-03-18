import { audioEvents } from '~/api/audioEvents.client'
import { appState, audioState } from '~/api/db/appState.client'
import { Track, db, useLiveQuery } from '~/api/db/dbHandlers'
import { Waveform } from '~/api/renderWaveform.client'
import { ProgressBar } from '~/components/Loader'
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
  const [analyzingTracks] = appState.analyzing()
  const analyzing = analyzingTracks.has(trackId)

  const { duration = 0 } =
    useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

  const [stemState] = audioState[trackId].stemState()

  const loaderClassNames =
    'p-0 border-1 border-divider rounded bg-default-50 overflow-hidden'

  const trackHeader = (
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

  const mixCardOverview = (
    <div
      id={`overview-container_${trackId}`}
      className={`${loaderClassNames} relative z-1 py-1 mb-3 h-8`}
      onClick={e => {
        const parents = e.currentTarget.firstElementChild as HTMLElement
        const parent = parents.children[1] as HTMLElement
        audioEvents.clickToSeek(trackId, e, parent)
      }}
    >
      {!analyzing ? null : (
        <div className={`${loaderClassNames} absolute z-10 w-full h-8 top-0`}>
          <div className="relative w-1/2 top-1/2 -mt-0.5 m-auto">
            <ProgressBar />
          </div>
        </div>
      )}
    </div>
  )

  const trackFooter = (
    <div className="flex gap-1 mt-1 items-center justify-between">
      <MixpointControl trackId={trackId} />
      <OffsetControl trackId={trackId} className="ml-auto w-36" />
    </div>
  )

  return (
    <>
      {trackHeader}

      {mixCardOverview}

      <Waveform trackId={trackId} />

      <VolumeMeter trackId={trackId} />

      {trackFooter}
    </>
  )
}

export { TrackPanel as default }
