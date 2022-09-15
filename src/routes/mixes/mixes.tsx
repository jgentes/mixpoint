import { useState } from 'react'
import { ButtonGroup } from '@mui/material'
import { Button, Breadcrumbs, Card } from '@mui/joy'
import { Stop, Pause, PlayArrow, Shuffle } from '@mui/icons-material'
import TrackForm from './trackform'
import { Events } from '../../Events'
import { db, TrackState, useLiveQuery } from '../../db'
export const Mixes = () => {
  const [track0, track1]: TrackState[] =
    useLiveQuery(() => db.trackState.limit(2).toArray()) || []
  const [playing, setPlaying] = useState(false)

  const crumbs = [
    { text: 'Mixes', href: '/mixes' },
    { text: 'Mix Editor', current: true },
  ]

  const renderCrumb = ({ text, ...restProps }) => (
    <Breadcrumbs {...restProps}>
      <span style={{ fontSize: '14px' }}>{text}</span>
    </Breadcrumbs>
  )

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
              tracks: [track0.trackId, track1.trackId],
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
              tracks: [track0.trackId, track1.trackId],
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
          {timeFormat(track0?.mixPoint || 0)}
        </span>
        <Shuffle sx={{ alignSelf: 'center', marginTop: '1px', fontSize: 23 }} />
        <span style={{ flex: 'auto', textAlign: 'right' }}>
          {timeFormat(track1?.mixPoint || 0)}
        </span>
      </div>
    </>
  )

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {crumbs.map(c => renderCrumb(c))}
      </div>
      <div className="mb-5">
        <TrackForm trackKey={0} />
        <div style={{ display: 'flex', margin: '15px 0' }}>
          <Card style={{ flex: '0 0 250px' }}>{mixPointControl}</Card>
          <Card
            style={{ flex: 'auto', marginLeft: '15px', overflow: 'hidden' }}
          >
            <div id={`overview-container_0`} style={{ height: '40px' }} />
            <div id={`overview-container_1`} style={{ height: '40px' }} />
          </Card>
        </div>

        <TrackForm trackKey={1} />
      </div>
    </>
  )
}
