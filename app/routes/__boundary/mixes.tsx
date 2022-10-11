import { Pause, PlayArrow, Shuffle, Stop } from '@mui/icons-material'
import { Button, Card } from '@mui/joy'
import { ButtonGroup } from '@mui/material'
import { useState } from 'react'
import { getState, MixState, useLiveQuery } from '~/api/db'
import { Events } from '~/api/Events'
import TrackForm from '~/components/mixes/trackform'

const Mixes: React.FunctionComponent = () => {
  const [playing, setPlaying] = useState(false)

  const { from: fromState, to: toState } =
    (useLiveQuery(() => getState('mix')) as MixState) || {}
  if (!fromState?.id && !toState?.id) return null

  const timeFormat = (secs: number) =>
    new Date(secs * 1000).toISOString().substr(15, 6)

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
          justifyContent: 'space-between',
          fontSize: '24px',
          margin: '20px 2px 0',
        }}
      >
        <span style={{ flex: 'auto' }}>
          {timeFormat(fromState?.mixPoint || 0)}
        </span>
        <Shuffle sx={{ alignSelf: 'center', marginTop: '1px', fontSize: 23 }} />
        <span style={{ flex: 'auto', textAlign: 'right' }}>
          {timeFormat(toState?.mixPoint || 0)}
        </span>
      </div>
    </>
  )

  return (
    <div className="mb-5">
      {fromState?.id && <TrackForm trackState={fromState} isFromTrack={true} />}
      <div style={{ display: 'flex', margin: '15px 0' }}>
        <Card style={{ flex: '0 0 250px' }}>{mixPointControl}</Card>
        <Card style={{ flex: 'auto', marginLeft: '15px', overflow: 'hidden' }}>
          {fromState?.id && (
            <div
              id={`overview-container_${fromState.id}`}
              style={{ height: '40px' }}
            />
          )}
          {toState?.id && (
            <div
              id={`overview-container_${toState.id}`}
              style={{ height: '40px' }}
            />
          )}
        </Card>
      </div>

      {toState?.id && <TrackForm trackState={toState} />}
    </div>
  )
}

export { Mixes as default }
