import { Box } from '@mui/joy'
import { useState } from 'react'
import { getState, useLiveQuery } from '~/api/dbHandlers'
import Header from '~/components/layout/Header'
import TrackDrawer from '~/components/layout/TrackDrawer'
import TrackCard from '~/components/mixes/TrackCard'
import TrackView from '~/components/mixes/TrackView'
import TrackTable from '~/components/tracks/TrackTable'

const Mixes: React.FunctionComponent = () => {
  const [playing, setPlaying] = useState(false)

  const { from: fromState, to: toState } =
    useLiveQuery(() => getState('mix')) || {}

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
            {!fromState?.id ? null : (
              <TrackView
                trackId={fromState.id}
                beatResolution={fromState.beatResolution}
              />
            )}
            {!toState?.id ? null : (
              <TrackView
                trackId={toState.id}
                beatResolution={toState.beatResolution}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 15 }}>
              {!fromState?.id ? null : <TrackCard trackId={fromState.id} />}
              {/* <Box style={{ flex: '0 0 250px' }}>{mixPointControl}</Box> */}

              {!toState?.id ? null : <TrackCard trackId={toState.id} />}
            </div>
          </div>

          <TrackDrawer />
        </Box>
      )}
    </Box>
  )
}

export { Mixes as default }
