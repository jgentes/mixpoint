import { useLiveQuery } from 'dexie-react-hooks'
import { useRef } from 'react'
import { ref, useSnapshot } from 'valtio'
import { audioEvents } from '~/api/handlers/audioEvents.client'
import { getTrackName } from '~/api/handlers/dbHandlers'
import { audioState, mixState, uiState } from '~/api/models/appState.client'
import { ProgressBar } from '~/components/layout/Loader'

const MixCardOverview = ({ trackSlot }: { trackSlot: 0 | 1 }) => {
  const overviewContainer = useRef<HTMLDivElement | null>(null)
  const trackId = useSnapshot(mixState).tracks[trackSlot]

  const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

  // overview is initialized in the waveform onready handler
  if (audioState[trackId])
    audioState[trackId].overviewRef = ref(overviewContainer)

  const { analyzing } = useSnapshot(uiState)
  const isAnalyzing = analyzing.has(trackId)

  const { mixpointTime } = useSnapshot(audioState[trackId])

  const loaderClassNames =
    'p-0 border-1 border-divider rounded bg-default-50 overflow-hidden'

  return (
    <div
      ref={overviewContainer}
      className={`${loaderClassNames} relative z-1 py-1 h-8 overflow-auto left-1/2`}
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
      <div className="absolute top-4 left-1 z-50 text-xs text-default-600">
        {trackName}
      </div>
    </div>
  )
}
export { MixCardOverview as default }
