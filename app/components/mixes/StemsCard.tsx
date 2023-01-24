import { Card, Typography } from '@mui/joy'
import { useEffect, useState } from 'react'
import { Player } from 'tone'
import { audioState, setAudioState, Stems } from '~/api/appState'
import { audioEvents } from '~/api/audioEvents'

import {
  db,
  getTrackName,
  Stem,
  Track,
  useLiveQuery,
} from '~/api/db/dbHandlers'
import { validateTrackStemAccess } from '~/api/fileHandlers'
import StemAccessButton from '~/components/mixes/StemAccessButton'
import { StemControls } from '~/components/tracks/Controls'
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

          for (let [stem, file] of Object.entries(stemCache)) {
            const source = URL.createObjectURL(file)

            // store audioElemnts in appState
            stems[stem as Stem] = {
              player: new Player(source).toDestination(),
              volume: 100,
              mute: false,
            }
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
        borderRadius: 'sm',
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
            <StemControls trackId={trackId} />
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
