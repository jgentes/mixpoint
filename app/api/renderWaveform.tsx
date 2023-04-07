import { Card } from '@mui/joy'
import { SxProps } from '@mui/joy/styles/types'
import { useEffect } from 'react'
import { Gain, Player } from 'tone'
import { WaveSurferParams } from 'wavesurfer.js/types/params'
import { getTableState, setAudioState, setTableState } from '~/api/appState'
import { audioEvents } from '~/api/audioEvents'
import { Stem, Track, db } from '~/api/db/dbHandlers'
import { errorHandler } from '~/utils/notifications'
import { getPermission } from './fileHandlers'

// Only load WaveSurfer on the client
let WaveSurfer: typeof import('wavesurfer.js'),
  PlayheadPlugin: typeof import('wavesurfer.js/src/plugin/playhead').default,
  CursorPlugin: typeof import('wavesurfer.js/src/plugin/cursor').default,
  RegionsPlugin: typeof import('wavesurfer.js/src/plugin/regions').default,
  MinimapPlugin: typeof import('wavesurfer.js/src/plugin/minimap').default,
  MarkersPlugin: typeof import('wavesurfer.js/src/plugin/markers').default
if (typeof document !== 'undefined') {
  WaveSurfer = require('wavesurfer.js')
  PlayheadPlugin = require('wavesurfer.js/src/plugin/playhead').default
  CursorPlugin = require('wavesurfer.js/src/plugin/cursor').default
  RegionsPlugin = require('wavesurfer.js/src/plugin/regions').default
  MinimapPlugin = require('wavesurfer.js/src/plugin/minimap').default
  MarkersPlugin = require('wavesurfer.js/src/plugin/markers').default
}

// This function accepts either a full track (with no stem) or an individual stem ('bass', etc)
// It generates the waveform container and Tone player
const initWaveform = async ({
  trackId,
  file,
  stem,
  waveformConfig,
}: {
  trackId: Track['id']
  file: File
  stem?: Stem
  waveformConfig: WaveSurferParams
}): Promise<void> => {
  if (!trackId) throw errorHandler('No track ID provided to initWaveform')

  const config: WaveSurferParams = {
    pixelRatio: 1,
    cursorColor: 'secondary.mainChannel',
    interact: true,
    closeAudioContext: true,
    //@ts-ignore - author hasn't updated types for gradients
    waveColor: [
      'rgb(200, 165, 49)',
      'rgb(200, 165, 49)',
      'rgb(200, 165, 49)',
      'rgb(205, 124, 49)',
      'rgb(205, 124, 49)',
    ],
    progressColor: 'rgba(0, 0, 0, 0.45)',
    ...waveformConfig,
  }

  const waveform = WaveSurfer.create(config)

  // create a GainNode to control volume using 0 -> 1 scale rather than decibels
  const gainNode = new Gain({ units: 'normalRange' })

  // create the Tone Player
  const source = URL.createObjectURL(file)
  const player: Player = new Player(source, () => {
    // use Tonejs buffer to render waveform
    waveform.loadDecodedBuffer(player.buffer.get())
  }).connect(gainNode)

  // Save waveform in audioState to track user interactions with the waveform and show progress
  if (stem) {
    setAudioState[trackId!].stems[stem as Stem]({
      player,
      gainNode,
      volume: 1,
      mute: false,
      waveform,
    })
  } else {
    setAudioState[trackId!].waveform(waveform)
    setAudioState[trackId!].gainNode(gainNode.toDestination())
    setAudioState[trackId!].player(player)
  }

  // Initialize wavesurfer event listeners
  // Must happen after storing the waveform in state
  waveform.on('seek', time => audioEvents.onSeek(trackId, time))
  waveform.on('ready', () => audioEvents.onReady(trackId, stem))
}

const Waveform = ({
  trackId,
  sx,
}: {
  trackId: Track['id']
  sx: SxProps
}): JSX.Element | null => {
  if (!trackId) throw errorHandler('No track to initialize.')

  useEffect(() => {
    // Retrieve track, file and region data, then store waveform in audioState

    const init = async () => {
      const [analyzingTracks] = getTableState.analyzing()
      const analyzing = analyzingTracks.includes(trackId)

      if (analyzing) return // prevent duplication on re-render while loading

      const track = await db.tracks.get(trackId)
      if (!track) throw errorHandler('Could not retrieve track from database.')

      const file = await getPermission(track)
      if (!file) throw errorHandler(`Please try adding ${track.name} again.`)

      const waveformConfig: WaveSurferParams = {
        container: `#zoomview-container_${trackId}`,
        scrollParent: true,
        fillParent: false,
        barWidth: 2,
        barHeight: 0.9,
        barGap: 1,
        plugins: [
          PlayheadPlugin.create({
            moveOnSeek: false,
            returnOnPause: false,
            draw: true,
          }),
          CursorPlugin.create({
            showTime: true,
            opacity: '1',
            customShowTimeStyle: {
              color: '#eee',
              padding: '0 4px',
              'font-size': '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            },
          }),
          MarkersPlugin.create({ markers: [] }),
          MinimapPlugin.create({
            container: `#overview-container_${trackId}`,
            waveColor: [
              'rgba(145, 145, 145, 0.8)',
              'rgba(145, 145, 145, 0.8)',
              'rgba(145, 145, 145, 0.8)',
              'rgba(145, 145, 145, 0.5)',
              'rgba(145, 145, 145, 0.5)',
            ],
            progressColor: 'rgba(0, 0, 0, 0.25)',
            interact: true,
            scrollParent: false,
            hideScrollbar: true,
            pixelRatio: 1,
          }),
        ],
      }

      initWaveform({ trackId, file, waveformConfig })
    }

    init()

    setTableState.analyzing(prev =>
      prev.includes(trackId) ? prev : [...prev, trackId]
    )

    return () => audioEvents.destroy(trackId)
  }, [trackId])

  return (
    <Card
      id={`zoomview-container_${trackId}`}
      className='zoomview-container'
      sx={{
        ...sx,
        zIndex: 1,
      }}
      onWheel={e =>
        audioEvents.seek(trackId, undefined, e.deltaY > 0 ? 'next' : 'previous')
      }
    />
  )
}

export { Waveform as default, initWaveform }
