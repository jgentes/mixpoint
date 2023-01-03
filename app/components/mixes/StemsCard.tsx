import { Button, Card, Typography } from '@mui/joy'
import { useEffect, useState } from 'react'
import { getStemContext } from '~/api/audioHandlers'
import { stemAudio } from '~/api/bananaDev'
import {
  db,
  getTrackName,
  StemCache,
  Track,
  useLiveQuery,
} from '~/api/db/dbHandlers'
import { initStemEvents } from '~/api/events/stemEvents'
import { getStemsDirHandle } from '~/api/fileHandlers'
import { StemControls } from '~/components/tracks/Controls'
import Dropzone from '~/components/tracks/Dropzone'
import { errorHandler } from '~/utils/notifications'

const StemsCard = ({ trackId }: { trackId: Track['id'] }) => {
  type StemState = 'unknown' | 'needFolder' | 'needStems' | 'ready'
  const [stems, setStems] = useState<StemCache['files']>([])
  const [stemState, setStemState] = useState<StemState>('unknown')

  useEffect(() => {
    const checkStemState = async () => {
      // do we have stems in cache for this track?
      const { files } = (await db.stemCache.get(trackId)) || {}
      if (files) {
        initStemEvents(trackId, files)
        setStems(files)
      }
      // if not, then do we have a stems folder defined?
      // ensure we have access to a directory to save the stems
      const dirHandle = await getStemsDirHandle()
      if (!dirHandle) {
        // this would be due to denial of permission (ie. clicked cancel)
        throw errorHandler('Permission to the file or folder was denied.')
      }
    }
    checkStemState()
    // have we initialized the stems event listeners?
  })

  // const setMixPoint = async () => {
  //   //const id = await addMix(mixState.tracks.map(t => t.id))
  //   //await updateMixState({ ...mixState, mix: { id } })
  // }

  // const mixPointControl = (<div
  //   style={{
  //     display: 'flex',
  //     flexWrap: 'nowrap',
  //     justifyContent: 'space-evenly',
  //     fontSize: '24px',
  //     margin: '10px 2px',
  //   }}
  // >
  //   {timeFormat(from?.mixPoint || 0)}
  //   <MergeType
  //     sx={{
  //       alignSelf: 'center',
  //       fontSize: 28,
  //       transform: 'rotate(90deg)',
  //     }}
  //   />
  //   {timeFormat(to?.mixPoint || 0)}
  // </div>
  // )

  const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

  const GetStemAudioButton = () => {
    const stemHandler = async () => {
      const stemContexts = await getStemContext(trackId)

      console.log('stemContexts', stemContexts)
    }

    return <Button onClick={() => stemHandler()}>Grab stems</Button>
  }

  const GetStemsButton = () => (
    <>
      <Button onClick={() => stemAudio(trackId)}>
        Choose folder to save stems
      </Button>
      <StemControls trackId={trackId} />
    </>
  )

  return (
    <Card
      variant="soft"
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
          <GetStemsButton />
          <GetStemAudioButton />
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
