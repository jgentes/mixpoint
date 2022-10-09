import { Pause, PlayArrow, Shuffle, Stop } from '@mui/icons-material'
import { Breadcrumbs, Button, Card } from '@mui/joy'
import { ButtonGroup } from '@mui/material'
import { useState } from 'react'
import { getState, useLiveQuery } from '~/api/db'
import { Events } from '~/api/Events'
import TrackForm from '~/components/mixes/trackform'

const Mixes: React.FunctionComponent = () => {
  const { from, to } = useLiveQuery(() => getState('mix')) || {}

  const [playing, setPlaying] = useState(false)

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
              tracks: [from?.id, to?.id],
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
              tracks: [from?.trackId, to?.trackId],
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
        <span style={{ flex: 'auto' }}>{timeFormat(from?.mixPoint || 0)}</span>
        <Shuffle sx={{ alignSelf: 'center', marginTop: '1px', fontSize: 23 }} />
        <span style={{ flex: 'auto', textAlign: 'right' }}>
          {timeFormat(to?.mixPoint || 0)}
        </span>
      </div>
    </>
  )

  return (
    <div className="mb-5">
      <TrackForm trackKey={0} />
      <div style={{ display: 'flex', margin: '15px 0' }}>
        <Card style={{ flex: '0 0 250px' }}>{mixPointControl}</Card>
        <Card style={{ flex: 'auto', marginLeft: '15px', overflow: 'hidden' }}>
          <div id={`overview-container_0`} style={{ height: '40px' }} />
          <div id={`overview-container_1`} style={{ height: '40px' }} />
        </Card>
      </div>

      <TrackForm trackKey={1} />
    </div>
  )
}

export { Mixes as default }
