import { Box, Button, Card, Typography } from '@mui/joy'
import { useEffect, useState } from 'react'
import { AudioElements, setAudioState } from '~/api/appState'
import { audioEvents } from '~/api/audioEvents'
import { stemAudio } from '~/api/bananaDev'
import {
  db,
  getTrackName,
  Stem,
  Track,
  useLiveQuery,
} from '~/api/db/dbHandlers'
import {
  getStemsDirHandle,
  StemState,
  validateTrackStemAccess,
} from '~/api/fileHandlers'
import { StemControls } from '~/components/tracks/Controls'
import Dropzone from '~/components/tracks/Dropzone'
import { errorHandler } from '~/utils/notifications'

const StemsCard = ({ trackId }: { trackId: Track['id'] }) => {
  const [stemState, setStemState] = useState<StemState>()

  const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

  const checkStemStatus = async () => await validateTrackStemAccess(trackId)

  // check stems on disk to determine component state
  useEffect(() => {
    if (!trackId) return

    const initStems = async () => {
      const stemStatus = await checkStemStatus()
      setStemState(stemStatus)

      // if stems exist, connect them to audio elements
      if (stemStatus == 'ready') {
        const { stems } = (await db.trackCache.get(trackId)) || {}

        if (stems) {
          const audioElements: AudioElements = {}

          for (let [stem, file] of Object.entries(stems)) {
            const elem = document.getElementById(
              `${trackId}-${stem}`
            ) as HTMLAudioElement
            elem.src = URL.createObjectURL(file)

            // store audioElemnts in appState
            audioElements[stem as Stem] = {
              element: elem,
              volume: 100,
              mute: false,
            }
          }
          setAudioState[trackId].audioElements(audioElements)
        }
        // mute the waveform and use stems for playback instead
        audioEvents(trackId).mute()
      }
    }

    initStems()
  }, [trackId])

  const getStemsDir = async () => {
    const dirHandle = await getStemsDirHandle()
    if (!dirHandle) {
      // this would be due to denial of permission (ie. clicked cancel)
      throw errorHandler('Permission to the file or folder was denied.')
    }
    const stemStatus = await checkStemStatus()
    setStemState(stemStatus)
  }

  const stemHandler = () => {
    console.log('clicked get stems')

    if (stemState == 'getStems') return stemAudio(trackId)

    getStemsDir()
  }

  const GetStemsButton = () => (
    <Button
      variant='soft'
      color={
        stemState == 'selectStemDir' || 'grantStemDirAccess'
          ? 'warning'
          : 'success'
      }
      onClick={() => stemHandler()}
    >
      {stemState == 'selectStemDir'
        ? 'Set stems folder'
        : stemState == 'grantStemDirAccess'
        ? 'Provide folder access'
        : 'Get stems'}
    </Button>
  )

  return (
    <Card
      variant='soft'
      sx={{
        p: 1,
        flexGrow: 1,
        borderRadius: 'sm',
        border: '1px solid',
        borderColor: 'action.selected',
        width: '30%', // this just restricts it from going too wide
      }}
    >
      {!trackId ? (
        <Dropzone />
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography
              sx={{
                fontSize: 'sm',
                fontWeight: 'md',
                pl: '3px',
              }}
            >
              {trackName}
            </Typography>
          </Box>
          {stemState !== 'ready' ? (
            <GetStemsButton />
          ) : (
            <StemControls trackId={trackId} />
          )}
        </>
      )}
    </Card>
  )
}

export { StemsCard as default }
