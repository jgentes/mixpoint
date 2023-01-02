import { Button, Card, Typography } from '@mui/joy'
import { getStemContexts } from '~/api/audioHandlers'
import { stemAudio } from '~/api/bananaDev'
import { getTrackName, Track, useLiveQuery } from '~/api/dbHandlers'
import { StemControls } from '~/components/tracks/Controls'
import Dropzone from '~/components/tracks/Dropzone'

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

  const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

  const GetStemAudioButton = () => {
    if (!trackId) return null

    const stemHandler = async () => {
      const stemContexts = await getStemContexts(trackId)

      console.log('stemContexts', stemContexts)
    }

    return <Button onClick={() => stemHandler()}>Grab stems</Button>
  }

  const GetStemsButton = () => {
    if (!trackId) return null

    return (
      <>
        <Button onClick={() => stemAudio(trackId)}>
          Choose folder to save stems
        </Button>
        <StemControls trackId={trackId} />
      </>
    )
  }

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

export { OverviewCard as default }
