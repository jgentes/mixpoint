import { useSnapshot } from 'valtio'
import { STEMS, type Stem, type Track } from '~/api/handlers/dbHandlers'
import { validateTrackStemAccess } from '~/api/handlers/fileHandlers'
import { appState, audioState } from '~/api/models/appState.client'
import StemAccessButton from '~/components/mixes/StemAccessButton.client'
import { StemControl } from '~/components/tracks/Controls'
import { errorHandler } from '~/utils/notifications'

const StemPanel = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) throw errorHandler('No track ID provided to StemPanel')

  // add to analyzing state
  appState.stemsAnalyzing.add(trackId)

  validateTrackStemAccess(trackId)

  const StemControls = () => {
    if (!audioState[trackId]) return null

    const { stemState } = useSnapshot(audioState[trackId])

    console.log('stemstate: ', stemState)

    return stemState !== 'ready' ? null : (
      <div className="flex flex-col gap-1 p-2 mb-3 rounded border-1 border-divider bg-background">
        {STEMS.map(stem => (
          <StemControl key={stem} trackId={trackId} stemType={stem as Stem} />
        ))}
      </div>
    )
  }

  return (
    <>
      <StemAccessButton trackId={trackId} />
      <StemControls />
    </>
  )
}

export { StemPanel as default }
