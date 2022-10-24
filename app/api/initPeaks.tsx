import WaveSurfer from 'wavesurfer.js'
import CursorPlugin from 'wavesurfer.js/src/plugin/cursor'
import MarkersPlugin from 'wavesurfer.js/src/plugin/markers'
import MinimapPlugin from 'wavesurfer.js/src/plugin/minimap'
import PlayheadPlugin from 'wavesurfer.js/src/plugin/playhead'
import RegionsPlugin, { RegionParams } from 'wavesurfer.js/src/plugin/regions'
import { putTrackState, Track, TrackState } from '~/api/db'
import { errorHandler } from '~/utils/notifications'

const initPeaks = async ({
  track,
  file,
  zoomviewRef,
  isFromTrack,
  setSliderControl,
  setAudioSrc,
  setAnalyzing,
}: {
  track: Track
  file: TrackState['file']
  zoomviewRef: React.RefObject<HTMLElement | string>
  isFromTrack: boolean
  setSliderControl: Function
  setAudioSrc: Function
  setAnalyzing: Function
}): Promise<WaveSurfer> => {
  if (!track?.id) throw errorHandler('No track to initialize.')
  if (!file) throw errorHandler(`Please try adding ${track.name} again.`)

  setAnalyzing(true)

  let { duration = 1, bpm = 1, offset = 1 } = track

  let beatInterval = 60 / bpm
  let startPoint = offset

  // work backward from initialPeak to peak out start of track (zerotime) based on bpm
  while (startPoint - beatInterval > 0) startPoint -= beatInterval

  // now that we have zerotime, move forward with reagions based on the bpm (hope the bpm is accurate!)
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
    container: zoomviewRef.current || '',
    height: 100,
    scrollParent: true,
    fillParent: false,
    pixelRatio: 1,
    barWidth: 2,
    barHeight: 0.9,
    barGap: 1,
    cursorColor: '#0492f752',
    interact: false,
    // @ts-ignore
    waveColor: [
      'rgb(200, 165, 49)',
      'rgb(200, 165, 49)',
      'rgb(200, 165, 49)',
      'rgb(205, 124, 49)',
      'rgb(205, 124, 49)',
    ],
    progressColor: 'rgba(0, 0, 0, 0.2)',
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
          color: '#000',
          padding: '4px',
          'font-size': '12px',
        },
      }),
      RegionsPlugin.create({
        regions,
        snapToGridOffset: offset,
        snapToGridInterval: beatInterval,
      }),
      // MinimapPlugin.create({
      //   waveColor: [
      //     'rgba(145, 145, 145, 0.8)',
      //     'rgba(145, 145, 145, 0.8)',
      //     'rgba(145, 145, 145, 0.8)',
      //     'rgba(145, 145, 145, 0.5)',
      //     'rgba(145, 145, 145, 0.5)',
      //   ],
      //   progressColor: 'rgba(0, 0, 0, 0.2)',
      //   interact: true,
      // }),
    ],
  })
  zoomview.loadBlob(file)

  zoomview.on('region-click', region => {
    if (!zoomview.isPlaying()) zoomview.playhead.setPlayheadTime(region.start)
    zoomview.playPause()
    zoomview.seekAndCenter(1 / (duration / zoomview.playhead.playheadTime))
  })

  zoomview.on('ready', () => {
    setAnalyzing(false)
  })
  return zoomview
}

export { initPeaks }
