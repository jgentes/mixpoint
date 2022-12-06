import { Card } from '@mui/joy'
import { SxProps } from '@mui/joy/styles/types'
import { useEffect } from 'react'
import { setAudioState } from '~/api/appState'
import { audioEvent, loadAudioEvents } from '~/api/audioEvents'
import { db, Track } from '~/api/dbHandlers'
import { loadWaveformEvents } from '~/api/waveformEvents'
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

const Waveform = ({
  trackId,
  sx,
}: {
  trackId: Track['id']
  sx: SxProps
}): JSX.Element | null => {
  if (!trackId) throw errorHandler('No track to initialize.')

  useEffect(() => {
    // Retrieve track, file and region data, then set state in waveProps
    const getAudio = async () => {
      const track = await db.tracks.get(trackId)
      if (!track) throw errorHandler('Could not retrieve track from database.')

      const file = await getPermission(track)
      if (!file) throw errorHandler(`Please try adding ${track.name} again.`)

      setAudioState.analyzing(prev =>
        prev.includes(trackId) ? prev : [...prev, trackId]
      )

      const waveform = WaveSurfer.create({
        container: `#zoomview-container_${trackId}`,
        scrollParent: true,
        fillParent: false,
        pixelRatio: 1,
        barWidth: 2,
        barHeight: 0.9,
        barGap: 1,
        cursorColor: 'secondary.mainChannel',
        interact: true,
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

      if (file) waveform.loadBlob(file)

      await loadAudioEvents({ trackId, waveform })
      await loadWaveformEvents({ trackId, waveform })
    }

    getAudio()
  }, [trackId])

  return (
    <Card
      id={`zoomview-container_${trackId}`}
      sx={{
        ...sx,
        zIndex: 1,
      }}
      onWheel={e =>
        audioEvent.emit(trackId, 'seek', {
          direction: e.deltaY > 0 ? 'next' : 'previous',
        })
      }
    />
  )
}

export { Waveform as default }
