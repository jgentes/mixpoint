import { MergeType, Pause, PlayArrow, Stop } from '@mui/icons-material'
import { Box, Button } from '@mui/joy'
import { ButtonGroup } from '@mui/material'
import { useSuperState } from '@superstate/react'
import { useState } from 'react'
import { db, getState, useLiveQuery } from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'
import Header from '~/components/layout/Header'
import TrackDrawer, { openDrawerState } from '~/components/layout/TrackDrawer'
import TrackCard from '~/components/mixes/TrackCard'
import TrackView from '~/components/mixes/TrackView'
import TrackTable from '~/components/tracks/TrackTable'

const Mixes: React.FunctionComponent = () => {
  const [playing, setPlaying] = useState(false)
  useSuperState(openDrawerState)

  const { from: fromState, to: toState } =
    useLiveQuery(() => getState('mix')) || {}
  const [fromTrack, toTrack] =
    useLiveQuery(
      () =>
        db.tracks.bulkGet(
          [fromState?.id, toState?.id].flatMap(a =>
            typeof a === 'number' ? a : []
          )
        ),
      [fromState, toState]
    ) || []

  const isFrom = fromState?.id && fromTrack?.id
  const isTo = toState?.id && toTrack?.id

  const timeFormat = (secs: number) =>
    new Date(secs * 1000).toISOString().substring(15, 19)

  // const mixPointControl = (
  //   <>
  //     <ButtonGroup variant="contained">
  //       <Button
  //         onClick={() => {
  //           setPlaying(false)
  //           EventBus.emit('audio', {
  //             effect: 'stop',
  //             tracks: [from?.id, to?.id],
  //           })
  //         }}
  //         id={`stopButton_mix`}
  //       >
  //         Stop
  //         <Stop />
  //       </Button>

  //       <Button
  //         onClick={() => {
  //           playing ? setPlaying(false) : setPlaying(true)
  //           EventBus.emit('audio', {
  //             effect: playing ? 'pause' : 'play',
  //             tracks: [from?.id, to?.id],
  //           })
  //         }}
  //         id={`playButton_mix`}
  //       >
  //         {playing ? 'Pause' : 'Play'}
  //         {playing ? <Pause /> : <PlayArrow />}
  //       </Button>
  //     </ButtonGroup>
  //     <div
  //       style={{
  //         display: 'flex',
  //         flexWrap: 'nowrap',
  //         justifyContent: 'space-evenly',
  //         fontSize: '24px',
  //         margin: '10px 2px',
  //       }}
  //     >
  //       {timeFormat(from?.mixPoint || 0)}
  //       <MergeType
  //         sx={{
  //           alignSelf: 'center',
  //           fontSize: 28,
  //           transform: 'rotate(90deg)',
  //         }}
  //       />
  //       {timeFormat(to?.mixPoint || 0)}
  //     </div>
  //   </>
  // )

  return (
    <Box
      sx={{
        bgcolor: 'background.surface',
        height: '100%',
      }}
    >
      <Header />
      {!fromState?.id && !toState?.id ? (
        <TrackTable hideDrawerButton={true} />
      ) : (
        <Box component="main" sx={{ p: 2, height: '90vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {!isFrom ? null : (
              <TrackView track={fromTrack} trackState={fromState} />
            )}
            {!isTo ? null : <TrackView track={toTrack} trackState={toState} />}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 15 }}>
              {!isFrom ? null : (
                <TrackCard track={fromTrack} trackState={fromState} />
              )}
              {/* <Box style={{ flex: '0 0 250px' }}>{mixPointControl}</Box> */}

              {!isTo ? null : (
                <TrackCard track={toTrack} trackState={toState} />
              )}
            </div>
          </div>

          <TrackDrawer />
        </Box>
      )}
    </Box>
  )
}

export { Mixes as default }
