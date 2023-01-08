import { Card } from '@mui/joy'
import { SxProps } from '@mui/joy/styles/types'
import { useEffect } from 'react'
import { audioEvents } from '~/api/audioEvents'
import { db, Track } from '~/api/db/dbHandlers'
import { setAudioState, setTableState } from '~/api/uiState'
import { errorHandler } from '~/utils/notifications'
import { getPermission, validateTrackStemAccess } from './fileHandlers'

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

const Waveform = ({
  trackId,
  sx,
}: {
  trackId: Track['id']
  sx: SxProps
}): JSX.Element | null => {
  if (!trackId) throw errorHandler('No track to initialize.')

  useEffect(() => {
    let waveform: WaveSurfer

    // Retrieve track, file and region data, then store waveform in audioState
    const initWaveform = async () => {
      const track = await db.tracks.get(trackId)
      if (!track) throw errorHandler('Could not retrieve track from database.')

      const file = await getPermission(track)
      if (!file) throw errorHandler(`Please try adding ${track.name} again.`)

      setTableState.analyzing(prev =>
        prev.includes(trackId) ? prev : [...prev, trackId]
      )

      waveform = WaveSurfer.create({
        container: `#zoomview-container_${trackId}`,
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
          // RegionsPlugin.create({
          //   regions,
          // }),
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

      setAudioState[trackId].waveform(waveform)

      if (file) waveform.loadBlob(file)

      // initialize audio events
      const waveformEvents = audioEvents(trackId)
      waveformEvents.init()

      // Initialize wavesurfer event listeners
      waveform.on('ready', waveformEvents.onReady)
      waveform.on('seek', waveformEvents.onSeek)
    }

    initWaveform()

    return () => waveform.destroy()
  }, [trackId])

  return (
    <Card
      id={`zoomview-container_${trackId}`}
      className="zoomview-container"
      sx={{
        ...sx,
        zIndex: 1,
      }}
      onWheel={e =>
        audioEvents(trackId).seek(undefined, e.deltaY > 0 ? 'next' : 'previous')
      }
    />
  )
}

export { Waveform as default }
