import {
  AccessTime,
  Eject,
  EventBusy,
  Favorite,
  Pause,
  PlayArrow,
  Replay,
  Stop,
} from '@mui/icons-material'
import { Button, Card, Chip, Link, TextField, Typography } from '@mui/joy'
import { Box, Button as ButtonGroupButton, ButtonGroup } from '@mui/material'
import { useEffect, useState } from 'react'
import { getState, removeFromMix, Track, TrackState } from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'
import { openDrawerState } from '~/components/layout/TrackDrawer'
import OffsetControl from '../tracks/OffsetControl'
import TrackName from '../tracks/TrackName'

const TrackCard = ({ trackId }: { trackId: Track['id'] }) => {
  const [playing, setPlaying] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [bpmTimer, setBpmTimer] = useState<number>()

  if (!trackId) return null
  // const updatePlaybackRate = (bpm: number) => {
  //   // update play speed to new bpm
  //   const playbackRate = bpm / (track?.bpm || bpm)
  //   if (audioElement.current) audioElement.current.playbackRate = playbackRate
  // }

  // const setMixPoint = async () => {
  //   //const id = await addMix(mixState.tracks.map(t => t.id))
  //   //await updateMixState({ ...mixState, mix: { id } })
  // }

  // const timeFormat = (secs: number) =>
  //   new Date(secs * 1000).toISOString().substring(15, 19)

  // const playerControl = !track?.name ? null : (
  //   <Box
  //     sx={{
  //       display: 'flex',
  //       '& > *': {
  //         m: 1,
  //       },
  //     }}
  //   >
  //     <ButtonGroup
  //       size="small"
  //       variant="outlined"
  //       style={{
  //         visibility: analyzing ? 'hidden' : 'visible',
  //       }}
  //     >
  //       <ButtonGroupButton
  //         onClick={() => {
  //           Events.dispatch('audio', { effect: 'stop', tracks: [id] })
  //         }}
  //         id={`stopButton_${id}`}
  //       >
  //         <Stop />
  //         Stop
  //       </ButtonGroupButton>

  //       <ButtonGroupButton
  //         onClick={() => {
  //           Events.dispatch('audio', {
  //             effect: playing ? 'pause' : 'play',
  //             tracks: [id],
  //           })
  //         }}
  //         id={`playButton_${id}`}
  //       >
  //         {playing ? <Pause /> : <PlayArrow />}
  //         {playing ? 'Pause' : 'Play'}
  //       </ButtonGroupButton>
  //     </ButtonGroup>
  //     <TextField size="sm" variant="soft" value={timeFormat(mixPoint || 0)}>
  //       <AccessTime />
  //     </TextField>
  //   </Box>
  // )

  const ejectTrack = async () => {
    // If this is not the last track in the mix, open drawer, otherwise it will open automatically
    const { from, to } = await getState('mix')
    if (from?.id && to?.id) openDrawerState.set(true)

    removeFromMix(trackId)
  }

  // const trackInfo = (
  //   <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
  //     <Typography sx={{ fontSize: 'sm', fontWeight: 'md' }}>
  //       {!track?.name ? null : track.name?.replace(/\.[^/.]+$/, '')}
  //     </Typography>
  //     <Link
  //       href="#dribbble-shot"
  //       level="body3"
  //       underline="none"
  //       startDecorator={<Favorite />}
  //       sx={{
  //         fontWeight: 'md',
  //         ml: 'auto',
  //         color: 'text.secondary',
  //         '&:hover': { color: 'danger.plainColor' },
  //       }}
  //     >
  //       117
  //     </Link>
  //     <Link
  //       href="#dribbble-shot"
  //       level="body3"
  //       underline="none"
  //       startDecorator={<EventBusy />}
  //       sx={{
  //         fontWeight: 'md',
  //         color: 'text.secondary',
  //         '&:hover': { color: 'primary.plainColor' },
  //       }}
  //     >
  //       10.4k
  //     </Link>
  //   </Box>
  // )

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
      <OffsetControl trackId={trackId} />
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography sx={{ fontSize: 'sm', fontWeight: 'md' }}>
          {TrackName(trackId)}
        </Typography>
      </Box>
      {/* <Card
        id={`overview-container_${id}`}
        sx={{
          p: 0,
          border: '1px solid',
          borderColor: 'action.focus',
          borderRadius: 'sm',
          bgcolor: 'background.body',
          overflow: 'hidden',
          height: '25px',
        }}
      /> */}
    </Card>
  )
}

export default TrackCard
