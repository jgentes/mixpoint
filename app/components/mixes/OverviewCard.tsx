import { VolumeOff, VolumeUp } from '@mui/icons-material'
import { Button, Card, Slider, Typography } from '@mui/joy'
import { Box } from '@mui/material'
import { useState } from 'react'
import { stemAudio } from '~/api/bananaDev'
import { Track } from '~/api/dbHandlers'
import Dropzone from '~/components/tracks/Dropzone'
import TrackName from '~/components/tracks/TrackName'

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

  const StemPlayer = ({ stemType }: { stemType: string }) => {
    const [volume, setVolume] = useState(100)
    const [muted, setMuted] = useState(false)

    return (
      <>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            sx={{
              fontSize: 'xs',
              fontWeight: 'md',
              pl: '3px',
              width: '57px',
            }}
          >
            {stemType}
          </Typography>
          <Slider
            aria-label={stemType}
            defaultValue={100}
            step={5}
            marks={[0, 25, 50, 75, 100].map(v => ({ value: v }))}
            valueLabelDisplay="auto"
            variant="soft"
            size={'sm'}
            onChange={(_, v) => setVolume(v as number)}
            disabled={muted}
            sx={{
              padding: '15px 0',
            }}
          />
          {!volume || muted ? (
            <VolumeOff onClick={() => setMuted(false)} />
          ) : (
            <VolumeUp onClick={() => setMuted(true)} />
          )}
        </Box>
      </>
    )
  }

  const StemControls = () => {
    if (!trackId) return null

    return (
      <Box sx={{ my: 1 }}>
        {['Drums', 'Bass', 'Vocals', 'Melody'].map(v => (
          <StemPlayer key={v} stemType={v} />
        ))}
      </Box>
    )
  }

  const GetStemsButton = () => {
    if (!trackId) return null

    return (
      <>
        <Button onClick={() => stemAudio(trackId)}>
          Choose folder to save stems
        </Button>
        <StemControls />
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
