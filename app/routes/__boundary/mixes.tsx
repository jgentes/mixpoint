import { MergeType, Pause, PlayArrow, Stop } from '@mui/icons-material'
import { Box, Button } from '@mui/joy'
import { ButtonGroup } from '@mui/material'
import { useState } from 'react'
import { getState, MixState, useLiveQuery } from '~/api/db'
import { Events } from '~/api/Events'
import Layout from '~/components/layout/Layout'
import TrackForm from '~/components/mixes/trackform'

const Mixes: React.FunctionComponent = () => {
  const [playing, setPlaying] = useState(false)

  const { from: fromState, to: toState } =
    useLiveQuery(() => getState('mix')) || {}
  if (!fromState?.id && !toState?.id) return null

  const timeFormat = (secs: number) =>
    new Date(secs * 1000).toISOString().substring(15, 19)

  const mixPointControl = (
    <>
      <ButtonGroup variant="contained">
        <Button
          onClick={() => {
            setPlaying(false)
            Events.dispatch('audio', {
              effect: 'stop',
              tracks: [fromState?.id, toState?.id],
            })
          }}
          id={`stopButton_mix`}
        >
          Stop
          <Stop />
        </Button>

        <Button
          onClick={() => {
            playing ? setPlaying(false) : setPlaying(true)
            Events.dispatch('audio', {
              effect: playing ? 'pause' : 'play',
              tracks: [fromState?.id, toState?.id],
            })
          }}
          id={`playButton_mix`}
        >
          {playing ? 'Pause' : 'Play'}
          {playing ? <Pause /> : <PlayArrow />}
        </Button>
      </ButtonGroup>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          justifyContent: 'space-evenly',
          fontSize: '24px',
          margin: '10px 2px',
        }}
      >
        {timeFormat(fromState?.mixPoint || 0)}
        <MergeType
          sx={{
            alignSelf: 'center',
            fontSize: 28,
            transform: 'rotate(90deg)',
          }}
        />
        {timeFormat(toState?.mixPoint || 0)}
      </div>
    </>
  )

  return (
    <Layout.MainContent>
      <div style={{ display: 'flex' }}>
        <Box style={{ flex: '0 0 250px' }}>{mixPointControl}</Box>
      </div>

      {!fromState?.id ? null : (
        <TrackForm trackState={fromState} isFromTrack={true} />
      )}
      {!toState?.id ? null : (
        <TrackForm trackState={toState} isFromTrack={false} />
      )}
    </Layout.MainContent>
  )
}

export { Mixes as default }
