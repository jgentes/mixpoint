import { db, getMixTrack, MixTrack, putMixTrack, Track } from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'
import { errorHandler } from '~/utils/notifications'
import { analyzeTracks } from './audioHandlers'
import { getPermission } from './fileHandlers'

// Only load WaveSurfer in the browser
let WaveSurfer: typeof import('wavesurfer.js'),
  PlayheadPlugin: typeof import('wavesurfer.js/src/plugin/playhead').default,
  CursorPlugin: typeof import('wavesurfer.js/src/plugin/cursor').default,
  RegionsPlugin: typeof import('wavesurfer.js/src/plugin/regions').default,
  MinimapPlugin: typeof import('wavesurfer.js/src/plugin/minimap').default
if (typeof document !== 'undefined') {
  WaveSurfer = require('wavesurfer.js')
  PlayheadPlugin = require('wavesurfer.js/src/plugin/playhead').default
  CursorPlugin = require('wavesurfer.js/src/plugin/cursor').default
  RegionsPlugin = require('wavesurfer.js/src/plugin/regions').default
  MinimapPlugin = require('wavesurfer.js/src/plugin/minimap').default
}

const calcRegions = async (
  track: Track,
  partialMixTrack: Partial<MixTrack> = {}
): Promise<{
  duration: Track['duration']
  skipLength: number
  beatResolution: MixTrack['beatResolution']
  regions: any[] // RegionParams exists, but can't access it using deferred import style
}> => {
  let { duration, offset, adjustedOffset, bpm } = track

  // isNaN check here to allow for zero values
  const valsMissing = !duration || isNaN(Number(bpm)) || isNaN(Number(offset))

  if (valsMissing) {
    const analyzedTracks = await analyzeTracks([track])
    ;({ duration, bpm, offset } = analyzedTracks[0])
  }

  if (!duration) throw errorHandler(`Please try adding ${track.name} again.`)

  const mixTrack = await getMixTrack(track.id)
  const newMixTrack = { ...mixTrack, ...partialMixTrack }
  let { adjustedBpm, beatResolution = 0.25 } = newMixTrack

  const beatInterval = 60 / (adjustedBpm || bpm || 1)
  let startPoint = adjustedOffset || offset || 0
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
  trackId,
  setAnalyzing,
}: {
  trackId: Track['id']
  setAnalyzing: Function
}): Promise<WaveSurfer> => {
  if (!trackId) throw errorHandler('No track to initialize.')

  const track = await db.tracks.get(trackId)
  if (!track) throw errorHandler('Could not retrieve track from database.')

  const file = await getPermission(track)
  if (!file) throw errorHandler(`Please try adding ${track.name} again.`)

  setAnalyzing(true)

  const { duration, skipLength, regions, beatResolution } = await calcRegions(
    track
  )

  const zoomview = WaveSurfer.create({
    container: `#zoomview-container_${trackId}`,
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
      }),
    ],
  })

  zoomview.loadBlob(file)
  zoomview.zoom(beatResolution == 1 ? 80 : beatResolution == 0.5 ? 40 : 20)

  // Configure wavesurfer event listeners
  zoomview.on('ready', () => {
    setAnalyzing(false)
    // do this elsewhere when initializing mxipoint from state:
    // if (zoomview.playhead.playheadTime == 0)
    //   zoomview.playhead.setPlayheadTime(regions[0].start)
  })

  zoomview.on('region-click', region => {
    // If audio isn't playing, set playhead to region start
    //if (!zoomview.isPlaying()) zoomview.playhead.setPlayheadTime(region.start)

    // Mixpoint is the current playhead position
    //const mixpoint = zoomview.playhead.playheadTime
    const mixpoint = region.start

    zoomview.playPause()
    zoomview.seekAndCenter(1 / (duration! / mixpoint))

    EventBus.emit('mixpoint', { trackId: track.id, mixpoint })
  })

  zoomview.on('destroy', () => zoomview.unAll())

  return zoomview
}

export { renderWaveform, calcRegions }
