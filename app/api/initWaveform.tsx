import WaveSurfer from 'wavesurfer.js'
import CursorPlugin from 'wavesurfer.js/src/plugin/cursor'
import MinimapPlugin from 'wavesurfer.js/src/plugin/minimap'
import PlayheadPlugin from 'wavesurfer.js/src/plugin/playhead'
import RegionsPlugin, { RegionParams } from 'wavesurfer.js/src/plugin/regions'
import { putTrackState, Track, TrackState } from '~/api/db'
import { errorHandler } from '~/utils/notifications'
import { analyzeTracks } from './audioHandlers'

const initWaveform = async ({
  track,
  file,
  setAnalyzing,
}: {
  track: Track
  file: TrackState['file']
  setAnalyzing: Function
}): Promise<WaveSurfer> => {
  if (!track?.id) throw errorHandler('No track to initialize.')
  if (!file) throw errorHandler(`Please try adding ${track.name} again.`)

  setAnalyzing(true)

  let { duration, bpm, offset } = track

  if (!duration || !bpm || !offset) {
    const analyziedTracks = await analyzeTracks([track])
    ;({ duration = 1, bpm = 1, offset = 1 } = analyziedTracks[0])
  }

  let beatInterval = 60 / bpm
  let startPoint = offset

  // Work backward from initialPeak to start of track (zerotime) based on bpm
  while (startPoint - beatInterval > 0) startPoint -= beatInterval

  // Now that we have zerotime, move forward with regions based on the bpm
  const regions: RegionParams[] = []

  for (let time = startPoint; time < duration; time += beatInterval * 4) {
    regions.push({
      start: time,
      end: time + beatInterval * 4,
      color: 'rgba(255, 255, 255, 0)',
      drag: false,
      resize: true,
      showTooltip: false,
      handleStyle: {
        left: {
          backgroundColor: time == startPoint ? 'none' : '#0492f79e',
        },
        right: { width: '0' },
      },
    })
  }

  const zoomview = WaveSurfer.create({
    container: `#zoomview-container_${track.id}`,
    height: 100,
    scrollParent: true,
    fillParent: false,
    pixelRatio: 1,
    barWidth: 2,
    barHeight: 0.9,
    barGap: 1,
    cursorColor: '#0492f752',
    interact: false,
    skipLength: beatInterval * 4,
    //@ts-ignore - author hasn't updated types for gradients
    waveColor: [
      'rgb(200, 165, 49)',
      'rgb(200, 165, 49)',
      'rgb(200, 165, 49)',
      'rgb(205, 124, 49)',
      'rgb(205, 124, 49)',
    ],
    progressColor: 'rgba(0, 0, 0, 0.25)',
    plugins: [
      PlayheadPlugin.create({
        returnOnPause: true,
        moveOnSeek: true,
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
      RegionsPlugin.create({
        regions,
        snapToGridOffset: offset,
        snapToGridInterval: beatInterval,
      }),
      MinimapPlugin.create({
        container: `#overview-container_${track.id}`,
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
        height: 50,
      }),
    ],
  })
  zoomview.loadBlob(file)

  zoomview.on('region-click', region => {
    if (!zoomview.isPlaying()) zoomview.playhead.setPlayheadTime(region.start)
    zoomview.playPause()
    zoomview.seekAndCenter(1 / (duration! / zoomview.playhead.playheadTime))
  })

  zoomview.on('ready', () => {
    setAnalyzing(false)
  })
  return zoomview
}

export { initWaveform }
