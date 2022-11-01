import { db, getMixTrack, MixTrack, Track } from '~/api/dbHandlers'
import { errorHandler } from '~/utils/notifications'
import { tableOps } from '~/utils/tableOps'
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
  adjustedBpm: MixTrack['adjustedBpm']
  skipLength: number
  beatResolution: MixTrack['beatResolution']
  regions: any[] // RegionParams exists, but can't access it using deferred import style
  mixpoint: MixTrack['mixpoint']
}> => {
  let { duration, offset, adjustedOffset, bpm } = track

  // isNaN check here to allow for zero values
  const valsMissing = !duration || isNaN(Number(bpm)) || isNaN(Number(offset))

  if (valsMissing) {
    const analyzedTracks = await analyzeTracks([track])
    ;({ duration, bpm, offset } = analyzedTracks[0])
  }

  if (!duration) throw errorHandler(`Please try adding ${track.name} again.`)

  const prevMixTrack = await getMixTrack(track.id)
  const mixTrack = { ...prevMixTrack, ...partialMixTrack }
  let { adjustedBpm, beatResolution = 0.25, mixpoint } = mixTrack

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
      resize: false,
      showTooltip: false,
    })
  }
  return {
    duration,
    adjustedBpm,
    skipLength,
    regions,
    beatResolution,
    mixpoint,
  }
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

  const {
    duration,
    adjustedBpm,
    skipLength,
    regions,
    beatResolution,
    mixpoint,
  } = await calcRegions(track)

  const waveform = WaveSurfer.create({
    container: `#zoomview-container_${trackId}`,
    scrollParent: true,
    fillParent: false,
    pixelRatio: 1,
    barWidth: 2,
    barHeight: 0.9,
    barGap: 1,
    cursorColor: 'secondary.mainChannel',
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

  waveform.loadBlob(file)
  waveform.zoom(beatResolution == 1 ? 80 : beatResolution == 0.5 ? 40 : 20)
  if (adjustedBpm)
    waveform.setPlaybackRate(adjustedBpm / (track.bpm || adjustedBpm))

  // Configure wavesurfer event listeners
  waveform.on('ready', () => {
    setAnalyzing(false)

    // Set playhead to mixpoint if it exists
    const currentPlayhead = mixpoint
      ? tableOps.convertToSecs(mixpoint)
      : regions[0].start
    waveform.playhead.setPlayheadTime(currentPlayhead)
    waveform.seekAndCenter(1 / (duration! / currentPlayhead))
  })

  waveform.on('region-dblclick', region => {
    // Double click sets a mixpoint at current region
    // waveform.play(region.start)
    // waveform.playhead.setPlayheadTime(region.start)
    // audioEvent.emit('mixpoint', { trackId: track.id, mixpoint: region.start })
  })

  waveform.on('region-click', region => {
    if (waveform.isPlaying()) return waveform.pause()

    // Time gets inconsistent at 14 digits so need to round here
    const time = waveform.getCurrentTime().toFixed(3)
    const clickInsideOfPlayheadRegion =
      waveform.playhead.playheadTime.toFixed(3) == region.start.toFixed(3)
    const cursorIsAtPlayhead = time == waveform.playhead.playheadTime.toFixed(3)

    if (cursorIsAtPlayhead && clickInsideOfPlayheadRegion) {
      waveform.play()
    } else if (clickInsideOfPlayheadRegion) {
      // Take the user back to playhead
      waveform.seekAndCenter(1 / (duration! / waveform.playhead.playheadTime))
    } else {
      // Move playhead to new region (seek is somewhat disorienting)
      waveform.playhead.setPlayheadTime(region.start)
    }
  })

  waveform.on('destroy', () => waveform.unAll())

  return waveform
}

export { renderWaveform, calcRegions }
