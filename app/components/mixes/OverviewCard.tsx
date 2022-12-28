import { Button, Card, Typography } from '@mui/joy'
import { Box } from '@mui/material'
import { db, Track } from '~/api/dbHandlers'
import VolumeMeter from '~/components/mixes/VolumeMeter'
import { BpmControl, MixpointControl } from '~/components/tracks/Controls'
import Dropzone from '~/components/tracks/Dropzone'
import TrackName from '~/components/tracks/TrackName'
import { errorHandler } from '~/utils/notifications'

const OverviewCard = ({ trackId }: { trackId: Track['id'] }) => {
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

  const GetStemsButton = () => {
    if (!trackId) return null

    // TODO: remove env vars from here !important
    const postBody = {
      apiKey: window.ENV.BANANA_API_KEY,
      modelKey: window.ENV.BANANA_MODEL_KEY,
      modelInputs: {
        file: {
          mime: '@file/mpeg',
          name: 'song.mp3',
          data: '', // base64 encoded file
        },
      },
    }

    const getStem = async () => {
      const { file } = (await db.fileStore.get(trackId)) || {}
      console.log('file:', file)
      if (!file)
        throw errorHandler('No file found for track, try re-adding it.')

      // const res = await fetch('https://api.banana.dev/start/v4', {
      //   method: 'post',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(postBody),
      // })

      // if (!res.ok) {
      //   const message = `An error has occurred: ${res.status} - ${res.statusText}`
      //   throw errorHandler(message)
      // }

      // const data = await res.json()
      // console.log(data)
    }

    return <Button onClick={getStem}>Get stems</Button>
  }

  const overviewFooter = (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        my: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <MixpointControl trackId={trackId} />
      <BpmControl trackId={trackId} />
    </Box>
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
          <Card
            id={`overview-container_${trackId}`}
            sx={{
              p: 0,
              border: '1px solid',
              borderColor: 'action.focus',
              borderRadius: 'sm',
              bgcolor: 'background.body',
              overflow: 'hidden',
              height: '25px',
              zIndex: 1,
            }}
          />
          <VolumeMeter trackId={trackId} />

          {overviewFooter}

          <GetStemsButton />

          <Typography
            sx={{
              fontSize: 'sm',
              fontWeight: 'md',
              pl: '3px',
            }}
          >
            {TrackName(trackId)}
          </Typography>
        </>
      )}
    </Card>
  )
}

export { OverviewCard as default }
