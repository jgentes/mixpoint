import { Card } from '@mui/joy'
import { SxProps } from '@mui/joy/styles/types'
import { useEffect } from 'react'
import { Peaks } from 'wavesurfer.js/types/backend'
import { WaveSurferParams } from 'wavesurfer.js/types/params'
import { setAudioState, setTableState } from '~/api/appState'
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
}: {
  trackId: Track['id']
  file: File
  stem?: Stem
}) => {
  if (!trackId) throw errorHandler('No track ID provided to initWaveform')

  setTableState.analyzing(prev =>
    prev.includes(trackId) ? prev : [...prev, trackId]
  )

  const track = (await db.tracks.get(trackId)) || {}
  const { duration } = track

  // check for existing PCM data to determine wavesurfer backend
  let pcm: Peaks | undefined
  if (stem) {
    const cache = await db.trackCache.get(trackId!)
    if (cache?.stems) pcm = cache.stems[stem]?.pcm
  } else {
    pcm = track.pcm
  }

  const waveformConfig: WaveSurferParams = {
    container: `#zoomview-container_${trackId}${stem ? `_${stem}` : ''}`,
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
    ],
  }

  if (!stem)
    waveformConfig.plugins!.push(
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
      })
    )

  const waveform = WaveSurfer.create(waveformConfig)

  // Initialize wavesurfer event listeners
  waveform.on('seek', time => audioEvents.onSeek(trackId, time))
  waveform.on('ready', () => audioEvents.onReady(trackId, !!pcm))

  // Save waveform in audioState, later used to generate PCM.
  // PCM avoids loading the audio into memory, which isn't necessary
  // because playback is handled by Tone.js instead of Wavesurfer
  if (!stem) setAudioState[trackId!].waveform(waveform)

  if (pcm) {
    waveform.backend.setPeaks(pcm, duration)
    waveform.drawBuffer()
    waveform.fireEvent('ready')
  } else {
    if (file) waveform.loadBlob(file)

    // store PCM data for waveform instead of duplicating
    // the audioBuffer in WaveSurfer, since Tone handles playback
    savePCM(trackId, waveform, stem)
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

export { Waveform as default, initWaveform }
