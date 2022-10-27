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
import { Events } from '~/api/Events'
import { openDrawerState } from '~/components/layout/TrackDrawer'

const TrackCard = ({ trackState }: { trackState: TrackState }) => {
  const [playing, setPlaying] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [bpmTimer, setBpmTimer] = useState<number>()
  const [track, setTrack] = useState<Track | undefined>()

  const { id, mixPoint } = trackState
  if (!id) return null

  // const audioEffect = (detail: { tracks: number[]; effect: string }) => {
  //   if (!detail.tracks.includes(id)) return

  //   setPlaying(detail.effect == 'play')

  //   switch (detail.effect) {
  //     case 'play':
  //       zoomView?.enableAutoScroll(true)
  //       audioElement.current?.play()
  //       break
  //     case 'pause':
  //       audioElement.current?.pause()
  //       zoomView?.enableAutoScroll(true)
  //       break
  //     case 'stop':
  //       audioElement.current?.pause()
  //       waveform?.player.seek(mixPoint || 0)
  //       zoomView?.enableAutoScroll(true)
  //   }
  // }

  // const updatePlaybackRate = (bpm: number) => {
  //   // update play speed to new bpm
  //   const playbackRate = bpm / (track?.bpm || bpm)
  //   if (audioElement.current) audioElement.current.playbackRate = playbackRate
  // }

  // const adjustBpm = async (bpm?: number) => {
  //   // get bpm from the user input field or mixState or current track
  //   bpm = bpm ?? Number(track?.bpm)

  //   updatePlaybackRate(bpm)

  //   // store custom bpm value in trackstate
  //   //putTrackState(isFromTrack, { adjustedBpm: Number(bpm.toFixed(1)) })
  // }

  // const selectTime = async (time: number) => {
  //   // waveform?.player.seek(time)
  //   // zoomView?.enableAutoScroll(false)

  //   Events.dispatch('audio', {
  //     effect: 'play',
  //     tracks: [id],
  //   })

  //   /*
  //   waveform?.segments.add({
  //     startTime: time,
  //     endTime: sliderPoints[31],
  //     color: 'rgba(191, 191, 63, 0.5)',
  //     editable: true
  //   })
  //   */
  // }

  // const setMixPoint = async () => {
  //   //const id = await addMix(mixState.tracks.map(t => t.id))
  //   //await updateMixState({ ...mixState, mix: { id } })
  // }

  // const timeFormat = (secs: number) =>
  //   new Date(secs * 1000).toISOString().substring(15, 19)

  // const adjustedBpm = track.adjustedBpm && Number(track.adjustedBpm).toFixed(1)

  // const bpmDiff = adjustedBpm && adjustedBpm !== track?.bpm?.toFixed(1)

  // const ResetBpmLink = () => (
  //   <Link
  //     component="button"
  //     underline="none"
  //     onClick={() => adjustBpm(track?.bpm || 1)}
  //     color="neutral"
  //     level="body2"
  //     disabled={!bpmDiff}
  //     title="Reset BPM"
  //   >
  //     {bpmDiff ? <Replay sx={{ mr: 0.5 }} /> : ''}BPM
  //   </Link>
  // )

  // const bpmControl = (
  //   <TextField
  //     disabled={!track?.bpm}
  //     size="sm"
  //     onChange={val => {
  //       console.log('changeval:', val)
  //       if (val) {
  //         if (bpmTimer) window.clearTimeout(bpmTimer)
  //         const debounce = window.setTimeout(() => adjustBpm(val), 1000)
  //         setBpmTimer(debounce)
  //       }
  //     }}
  //     value={adjustedBpm || track?.bpm?.toFixed(1) || 0}
  //     id={`bpmInput_${id}`}
  //     variant="soft"
  //     endDecorator={<ResetBpmLink />}
  //   />
  // )

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

    if (track) removeFromMix(track?.id)
  }

  const trackInfo = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Typography sx={{ fontSize: 'sm', fontWeight: 'md' }}>
        {!track?.name ? null : track.name?.replace(/\.[^/.]+$/, '')}
      </Typography>

      <Link
        href="#dribbble-shot"
        level="body3"
        underline="none"
        startDecorator={<Favorite />}
        sx={{
          fontWeight: 'md',
          ml: 'auto',
          color: 'text.secondary',
          '&:hover': { color: 'danger.plainColor' },
        }}
      >
        117
      </Link>
      <Link
        href="#dribbble-shot"
        level="body3"
        underline="none"
        startDecorator={<EventBusy />}
        sx={{
          fontWeight: 'md',
          color: 'text.secondary',
          '&:hover': { color: 'primary.plainColor' },
        }}
      >
        10.4k
      </Link>
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
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography sx={{ fontSize: 'sm', fontWeight: 'md' }}>
          {analyzing
            ? 'Loading...'
            : track?.name?.replace(/\.[^/.]+$/, '') || 'No Track Loaded..'}
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
      {trackInfo}
    </Card>
  )
}

export default TrackCard
