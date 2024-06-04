import { useSnapshot } from 'valtio'
import { STEMS, type Stem, type Track } from '~/api/handlers/dbHandlers'
import { validateTrackStemAccess } from '~/api/handlers/fileHandlers'
import { audioState, uiState } from '~/api/models/appState.client'
import StemAccessButton from '~/components/mixes/StemAccessButton.client'
import { StemControl } from '~/components/tracks/Controls'
import { errorHandler } from '~/utils/notifications'

const StemPanel = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) throw errorHandler('No track ID provided to StemPanel')
  if (!audioState[trackId]) return null

  // add to analyzing state
  uiState.stemsAnalyzing.add(trackId)

  validateTrackStemAccess(trackId)

  const { stemState } = useSnapshot(audioState[trackId])

  const StemControls = () => {
    return (
      <div className="flex flex-col gap-1 p-4 mb-3 h-32 rounded border-1 border-divider bg-background">
        {STEMS.map(stem => (
          <StemControl key={stem} trackId={trackId} stemType={stem as Stem} />
        ))}
      </div>
    )
  }

  return stemState && stemState === 'ready' ? (
    <StemControls />
  ) : (
    <StemAccessButton trackId={trackId} />
  )
}

export { StemPanel as default }
