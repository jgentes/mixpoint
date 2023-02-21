import { Box, Card, Typography } from '@mui/joy'
import { useEffect } from 'react'
import { Player } from 'tone'
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
          const stems: Stems = {}

          for (let [stem, { file, pcm }] of Object.entries(stemCache)) {
            if (!file) continue

            const source = URL.createObjectURL(file)

            // store audioElemnts in appState
            stems[stem as Stem] = {
              player: new Player(source).toDestination(),
              volume: 100,
              mute: false,
            }

            await initWaveform({ trackId, file, stem: stem as Stem })
          }
          setAudioState[trackId!].stems(stems)
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
        borderRadius: '6px',
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
                  <Card
                    id={`zoomview-container_${trackId}_${stem}`}
                    className='zoomview-container'
                  />
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
