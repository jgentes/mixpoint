import { Card, Typography } from '@mui/joy'
import { Box, Button as ButtonGroupButton, ButtonGroup } from '@mui/material'
import { useEffect, useState } from 'react'
import { getState, MixTrack, removeFromMix, Track } from '~/api/dbHandlers'
import { openDrawerState } from '~/components/layout/TrackDrawer'
import { BpmControl, MixpointControl } from '~/components/tracks/Controls'
import TrackName from '~/components/tracks/TrackName'

const TrackCard = ({ trackId }: { trackId: Track['id'] }) => {
  const [playing, setPlaying] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [bpmTimer, setBpmTimer] = useState<number>()

  if (!trackId) return null

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
      }}
    >
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
        }}
      />
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
    </Card>
  )
}

export default TrackCard
