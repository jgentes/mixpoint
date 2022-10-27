import { Track, TrackState } from '~/api/dbHandlers'
import { errorHandler } from '~/utils/notifications'
import { analyzeTracks } from './audioHandlers'
import { getPermission } from './fileHandlers'

// Only load WaveSurfer in the browser
let WaveSurfer: typeof import('wavesurfer.js'),
  PlayheadPlugin: typeof import('wavesurfer.js/src/plugin/playhead').default,
  CursorPlugin: typeof import('wavesurfer.js/src/plugin/cursor').default,
  RegionsPlugin: typeof import('wavesurfer.js/src/plugin/regions').default
if (typeof document !== 'undefined') {
  WaveSurfer = require('wavesurfer.js')
  PlayheadPlugin = require('wavesurfer.js/src/plugin/playhead').default
  CursorPlugin = require('wavesurfer.js/src/plugin/cursor').default
  RegionsPlugin = require('wavesurfer.js/src/plugin/regions').default
}

const calcRegions = async (
  track: Track,
  trackState: TrackState
): Promise<{
  duration: Track['duration']
  skipLength: number
  beatResolution: TrackState['beatResolution']
  regions: any[] // RegionParams exists, but can't access it using deferred import style
}> => {
  let { duration, bpm, offset } = track
  let { adjustedBpm, adjustedOffset, beatResolution = 0.25 } = trackState

  if (!duration || !bpm || !offset) {
    const analyzedTracks = await analyzeTracks([track])
    ;({ duration = 1, bpm = 1, offset = 1 } = analyzedTracks[0])

    if (!duration || !bpm || !offset)
      throw errorHandler(`Please try adding ${track.name} again.`)
  }

  const beatInterval = 60 / (adjustedBpm || bpm)
  let startPoint = adjustedOffset || offset
  const skipLength = beatInterval * (1 / beatResolution)

  // Work backward from initialPeak to start of track (zerotime) based on bpm
  while (startPoint - beatInterval > 0) startPoint -= beatInterval

  // Now that we have zerotime, move forward with regions based on the bpm
  const regions = []

  for (let time = startPoint; time < duration; time += skipLength) {
    regions.push({
      start: time,
      end: time + skipLength,
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
  return { duration, skipLength, regions, beatResolution }
}

const renderWaveform = async ({
  track,
  trackState,
  setAnalyzing,
}: {
  track: Track
  trackState: TrackState
  setAnalyzing: Function
}): Promise<WaveSurfer> => {
  if (!track?.id) throw errorHandler('No track to initialize.')

  const file = await getPermission(track)
  if (!file) throw errorHandler(`Please try adding ${track.name} again.`)

  setAnalyzing(true)

  const { duration, skipLength, regions, beatResolution } = await calcRegions(
    track,
    trackState
  )

  const zoomview = WaveSurfer.create({
    container: `#zoomview-container_${track.id}`,
    scrollParent: true,
    fillParent: false,
    pixelRatio: 1,
    barWidth: 2,
    barHeight: 0.9,
    barGap: 1,
    cursorColor: '#0492f752',
    interact: false,
    skipLength,
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
      }),
      // MinimapPlugin.create({
      //   container: `#overview-container_${track.id}`,
      //   waveColor: [
      //     'rgba(145, 145, 145, 0.8)',
      //     'rgba(145, 145, 145, 0.8)',
      //     'rgba(145, 145, 145, 0.8)',
      //     'rgba(145, 145, 145, 0.5)',
      //     'rgba(145, 145, 145, 0.5)',
      //   ],
      //   progressColor: 'rgba(0, 0, 0, 0.25)',
      //   interact: true,
      //   scrollParent: false,
      //   hideScrollbar: true,
      //   pixelRatio: 1,
      // }),
    ],
  })

  zoomview.loadBlob(file)

  zoomview.zoom(beatResolution == 1 ? 80 : beatResolution == 0.5 ? 40 : 20)

  zoomview.on('region-click', region => {
    if (!zoomview.isPlaying()) zoomview.playhead.setPlayheadTime(region.start)
    zoomview.playPause()
    zoomview.seekAndCenter(1 / (duration! / zoomview.playhead.playheadTime))
  })

  zoomview.on('ready', () => {
    setAnalyzing(false)
  })

  zoomview.on('destroy', () => zoomview.unAll())

  return zoomview
}

export { renderWaveform, calcRegions }