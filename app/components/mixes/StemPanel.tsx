import { Box } from '@mui/joy'
import { useEffect } from 'react'
import { WaveSurferParams } from 'wavesurfer.js/types/params'
import { audioState } from '~/api/appState'
import { audioEvents } from '~/api/audioEvents'
import { db, Stem, STEMS, Track } from '~/api/db/dbHandlers'
import { validateTrackStemAccess } from '~/api/fileHandlers'
import { initWaveform } from '~/api/renderWaveform'
import StemAccessButton from '~/components/mixes/StemAccessButton'
import { StemControl } from '~/components/tracks/Controls'

const StemPanel = ({ trackId }: { trackId: Track['id'] }) => {
  const [stemState] = audioState[trackId!].stemState()

  // check stems on disk to determine component state
  useEffect(() => {
    const initStems = async () => {
      await validateTrackStemAccess(trackId)

      // if stems exist, generate Tonejs players for each
      if (stemState == 'ready') {
        const { stems: stemCache } = (await db.trackCache.get(trackId)) || {}

        if (stemCache) {
          for (let [stem, { file }] of Object.entries(stemCache)) {
            if (!file) continue

            const waveformConfig: WaveSurferParams = {
              container: `#zoomview-container_${trackId}_${stem}`,
              scrollParent: false,
              fillParent: true,
              hideScrollbar: true,
              barWidth: 1,
              normalize: true,
            }

            await initWaveform({
              trackId,
              file,
              stem: stem as Stem,
              waveformConfig,
            })
          }
        }

        // mute the waveform and use stems for playback instead
        audioEvents.mute(trackId)
      }
    }

    initStems()
  }, [trackId, stemState])

  return stemState !== 'ready' ? (
    <StemAccessButton trackId={trackId} />
  ) : (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 1,
        borderRadius: '4px',
        border: '1px solid',
        borderColor: 'action.selected',
        backgroundColor: 'background.level1',
      }}
    >
      {STEMS.map(stem => (
        <StemControl key={stem} trackId={trackId} stemType={stem as Stem} />
      ))}
    </Box>
  )
}

export { StemPanel as default }
