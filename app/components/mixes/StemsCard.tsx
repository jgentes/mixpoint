import { Box, Card, Typography } from '@mui/joy'
import { useEffect } from 'react'
import { Player } from 'tone'
import { WaveSurferParams } from 'wavesurfer.js/types/params'
import { audioState, setAudioState, Stems } from '~/api/appState'
import { audioEvents } from '~/api/audioEvents'

import {
  db,
  getTrackName,
  Stem,
  STEMS,
  Track,
  useLiveQuery,
} from '~/api/db/dbHandlers'
import { validateTrackStemAccess } from '~/api/fileHandlers'
import { initWaveform } from '~/api/renderWaveform'
import StemAccessButton from '~/components/mixes/StemAccessButton'
import { StemControl } from '~/components/tracks/Controls'
import Dropzone from '~/components/tracks/Dropzone'

const StemsCard = ({ trackId }: { trackId: Track['id'] }) => {
  const [stemState] = audioState[trackId!].stemState()

  const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

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

  return (
    <Card
      variant='soft'
      sx={{
        p: 1,
        flexGrow: 1,
        borderRadius: '4px',
        border: '1px solid',
        borderColor: 'action.selected',
        width: '30%',
      }}
    >
      {!trackId ? (
        <Dropzone />
      ) : (
        <>
          {stemState !== 'ready' ? (
            <StemAccessButton trackId={trackId} />
          ) : (
            <Box sx={{ mb: 2 }}>
              {STEMS.map(stem => (
                <div key={stem}>
                  <StemControl trackId={trackId} stemType={stem as Stem} />
                </div>
              ))}
            </Box>
          )}
          <Typography
            sx={{
              fontSize: 'sm',
              fontWeight: 'md',
              pl: '3px',
            }}
          >
            {trackName}
          </Typography>
        </>
      )}
    </Card>
  )
}

export { StemsCard as default }
