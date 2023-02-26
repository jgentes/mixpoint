import { Card } from '@mui/joy'
import { SxProps } from '@mui/joy/styles/types'
import { useEffect } from 'react'
import * as Tone from 'tone'
import { Player, ToneAudioBuffer } from 'tone'
import { Peaks } from 'wavesurfer.js/types/backend'
import { WaveSurferParams } from 'wavesurfer.js/types/params'
import { getAudioState, setAudioState, setTableState } from '~/api/appState'
import { audioEvents } from '~/api/audioEvents'
import { savePCM } from '~/api/audioHandlers'
import { db, Stem, Track } from '~/api/db/dbHandlers'
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
// It generates the waveform container and stores PCM data for future use
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
}): Promise<WaveSurfer> => {
  if (!trackId) throw errorHandler('No track ID provided to initWaveform')

  const track = await db.tracks.get(trackId)
  if (!track) throw errorHandler('Track not found')

  if (!stem)
    setTableState.analyzing(prev =>
      prev.includes(trackId) ? prev : [...prev, trackId]
    )

  // check for existing PCM data to determine wavesurfer backend
  // PCM avoids loading the audio into memory, which isn't necessary
  // because playback is handled by Tone.js instead of Wavesurfer
  let pcm: Peaks | undefined
  if (!stem) {
    if (track.pcm?.length) pcm = track.pcm
  }

  const config: WaveSurferParams = {
    backend: pcm ? 'MediaElementWebAudio' : 'WebAudio',
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

  // There are 2 configurations here:
  // 1. No stems = create Tone player for track and render track waveform from ToneBuffer. Also generate PCM data for when stems are being used.
  // 2. Stems = do not create Tone player for track, instead use PCM data for track waveform. Create Tone player for stems and render stem waveforms using ToneBuffers.

  // create the Tone Player
  const source = URL.createObjectURL(file)
  const player: Player = new Player(source, () => {
    waveform.loadDecodedBuffer(player.buffer.get())

    // store PCM data for waveform instead of duplicating
    // the audioBuffer in WaveSurfer, since Tone handles playback
    if (stem && !pcm) savePCM(trackId, waveform)
  }).toDestination()

  if (!stem) {
  }

  if (!pcm?.length && stem) {
    console.log('loading Tonejs')
    const source = URL.createObjectURL(file)

    const player: Player = new Player(source, () => {
      //@ts-ignore _buffer is private, but it's the only way to get the audioBuffer
      waveform.loadDecodedBuffer(player.buffer._buffer)
      // store PCM data for waveform instead of duplicating
      // the audioBuffer in WaveSurfer, since Tone handles playback
      if (!pcm) {
        savePCM(trackId, waveform, stem)
      }
    }).toDestination()

    // Save waveform in audioState, later used to generate PCM and
    // is needed to track user interactions with the waveform and show progress
    if (stem) {
      setAudioState[trackId!].stems[stem as Stem]({
        player,
        volume: 100,
        mute: false,
        waveform,
      })
    } else {
      setAudioState[trackId!].waveform(waveform)
      setAudioState[trackId!].player(player)
    }
  } else {
    setAudioState[trackId!].waveform(waveform)
    // Initialize wavesurfer event listeners
    // Must happen after storing the waveform in state
    waveform.on('seek', time => audioEvents.onSeek(trackId, time))
    waveform.on('ready', () => audioEvents.onReady(trackId))

    console.log('loading PCM')
    const { duration } = track
    waveform.backend.setPeaks(pcm, duration)
    waveform.drawBuffer()
    waveform.fireEvent('ready')
  }

  return waveform
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
      const track = await db.tracks.get(trackId)
      if (!track) return errorHandler('Could not retrieve track from database.')

      const file = await getPermission(track)
      if (!file) return errorHandler(`Please try adding ${track.name} again.`)

      const waveformConfig: WaveSurferParams = {
        container: `#zoomview-container_${trackId}`,
        scrollParent: true,
        fillParent: false,
        barWidth: 2,
        barHeight: 0.9,
        barGap: 1,
        plugins: [
          PlayheadPlugin.create({
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

      await initWaveform({ trackId, file, waveformConfig })
    }

    init()

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
