import { Card, Typography } from '@mui/joy'
import { Box } from '@mui/material'
import { Track } from '~/api/dbHandlers'
import VolumeMeter from '~/components/mixes/VolumeMeter'
import { BpmControl, MixpointControl } from '~/components/tracks/Controls'
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
