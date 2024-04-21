import { useEffect } from 'react'
import { type WaveSurferOptions } from 'wavesurfer.js'
import { appState, audioState } from '~/api/db/appState'
import { audioEvents } from '~/api/handlers/audioEvents.client'
import {
  STEMS,
  type Stem,
  type Track,
  db,
  getTrackPrefs
} from '~/api/handlers/dbHandlers'
import { initWaveform } from '~/api/renderWaveform.client'
import StemAccessButton from '~/components/mixes/StemAccessButton.client'
import { StemControl } from '~/components/tracks/Controls'
import { errorHandler } from '~/utils/notifications'

const StemPanel = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) throw errorHandler('No track ID provided to StemPanel')

  const stemState = audioState[trackId]?.stemState

  // check stems on disk to determine component state
  useEffect(() => {
    const initStems = async () => {
      // if stems exist, generate waveforms for each
      if (stemState === 'ready') {
        const { stems: stemCache } = (await db.trackCache.get(trackId)) || {}

        if (stemCache) {
          for (const [stem, { file }] of Object.entries(stemCache)) {
            if (!file) continue

            const waveformConfig: WaveSurferOptions = {
              container: `#zoomview-container_${trackId}_${stem}`,
              height: 17,
              fillParent: true,
              hideScrollbar: true,
              barWidth: 1,
              normalize: true
            }

            await initWaveform({
              trackId,
              file,
              stem: stem as Stem,
              waveformConfig
            })
          }
        }

        // if zoom is set to a stem, use the stem cache to redraw the primary waveform with the stem
        const { stemZoom } = (await getTrackPrefs(trackId)) || {}
        if (stemZoom) audioEvents.stemZoom(trackId, stemZoom)
      }
    }

    // prevent duplication on re-render while loading
    const analyzing = appState.stemsAnalyzing.has(trackId)

    if (!analyzing) initStems()

    return () => audioEvents.destroyStems(trackId)
  }, [trackId, stemState])

  return stemState !== 'ready' ? (
    <StemAccessButton trackId={trackId} />
  ) : (
    <div className="flex flex-col gap-1 p-2 mb-3 rounded border-1 border-divider bg-background">
      {STEMS.map(stem => (
        <StemControl key={stem} trackId={trackId} stemType={stem as Stem} />
      ))}
    </div>
  )
}

export { StemPanel as default }
