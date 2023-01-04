import { PlayArrow } from '@mui/icons-material'
import { Box, Button, Card, Typography } from '@mui/joy'
import { useEffect, useState } from 'react'
import { getStemContext } from '~/api/audioHandlers'
import { stemAudio } from '~/api/bananaDev'
import {
  db,
  getState,
  getTrackName,
  StemCache,
  Track,
  useLiveQuery,
} from '~/api/db/dbHandlers'
import { initStemEvents, stemEvent } from '~/api/events/stemEvents'
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

  // check stems on disk to determine component state
  useEffect(() => {
    const getState = async () => {
      const stemStatus = await validateTrackStemAccess(trackId)
      setStemState(stemStatus)

      // if we're ready, initialize stem event handlers
      if (stemStatus == 'ready') initStemEvents(trackId)
    }

    if (trackId) getState()

    return () => stemEvent.emit(`${trackId}-stems`, 'destroy')
  }, [trackId])

  const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

  console.log('StemsCard', stemState)
  const getStemsDir = async () => {
    const dirHandle = await getStemsDirHandle()
    if (!dirHandle) {
      // this would be due to denial of permission (ie. clicked cancel)
      throw errorHandler('Permission to the file or folder was denied.')
    } else setStemState('getStems')
  }

  const stemHandler = () => {
    console.log('clicked get stems')

    if (stemState == 'getStems') return stemAudio(trackId)

    getStemsDir()
  }

  const GetStemsButton = () => (
    <Button
      variant="soft"
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
            {stemState != 'ready' ? null : (
              <PlayArrow
                onClick={() =>
                  stemEvent.emit(`${trackId}-stems`, 'play', { stem: 'all' })
                }
              />
            )}
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
