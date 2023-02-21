import { Card } from '@mui/joy'
import { SxProps } from '@mui/joy/styles/types'
import { useEffect } from 'react'
import { getAudioState, setAudioState, setTableState } from '~/api/appState'
import { audioEvents } from '~/api/audioEvents'
import { db, Track } from '~/api/db/dbHandlers'
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

const initWaveform = async ({
  trackId,
  file,
}: {
  trackId: Track['id']
  file: File
}) => {
  setTableState.analyzing(prev =>
    prev.includes(trackId) ? prev : [...prev, trackId]
  )

  // check for existing PCM data
  const { pcm, duration } = (await db.tracks.get(trackId!)) || {}

  const waveform = WaveSurfer.create({
    container: `#zoomview-container_${trackId}`,
    backend: pcm ? 'MediaElementWebAudio' : 'WebAudio',
    scrollParent: true,
    fillParent: false,
    pixelRatio: 1,
    barWidth: 2,
    barHeight: 0.9,
    barGap: 1,
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
  })

  // Initialize wavesurfer event listeners
  waveform.on('seek', time => audioEvents.onSeek(trackId, time))
  waveform.on('ready', () => audioEvents.onReady(trackId, !!pcm))

  // Save waveform in audioState, later used to generate PCM.
  // PCM avoids loading the audio into memory, which isn't necessary
  // because playback is handled by Tone.js instead of Wavesurfer
  setAudioState[trackId!].waveform(waveform)
  console.log(!!pcm)
  if (pcm) {
    waveform.backend.setPeaks(pcm, duration)
    waveform.drawBuffer()
    waveform.fireEvent('ready')
  } else {
    if (file) waveform.loadBlob(file)
  }
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

      initWaveform({ trackId, file })
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

export { Waveform as default }
