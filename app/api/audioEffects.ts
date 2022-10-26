import { Track } from '~/api/dbHandlers'
import { Events } from '~/api/Events'

// Only load initPeaks in the browser
let initWaveform: typeof import('~/api/initWaveform').initWaveform
let calcRegions: typeof import('~/api/initWaveform').calcRegions
if (typeof document !== 'undefined') {
  import('~/api/initWaveform').then(m => {
    initWaveform = m.initWaveform
    calcRegions = m.calcRegions
  })
}

const renderWaveform = async (props: {
  track: Track
  setAnalyzing: Function
}) => {
  const waveform = await initWaveform(props)
  const { track, setAnalyzing } = props

  const scrollEffect = (scrollEvent: {
    direction: 'up' | 'down'
    trackId: number
  }) => {
    const { direction, trackId } = scrollEvent
    if (trackId == track.id)
      direction == 'down' ? waveform.skipBackward() : waveform.skipForward()
  }

  const beatResolutionEffect = async (beatResolutionEvent: {
    resolution: 0.25 | 0.5 | 1
    trackId: number
  }) => {
    const { resolution, trackId } = beatResolutionEvent
    if (trackId == track.id) {
      // Rebuild regions
      waveform.regions.clear()
      const { regions } = await calcRegions(track, resolution)
      for (const region of regions) waveform.regions.add(region)

      // Now zoom
      switch (resolution) {
        case 0.25:
          waveform.zoom(20)
          break
        case 0.5:
          waveform.zoom(40)
          break
        case 1:
          waveform.zoom(80)
          break
      }
    }
  }

  // const audioEffect = (detail: { tracks: number[]; effect: string }) => {
  //   if (!detail.tracks.includes(track.id)) return

  //   setPlaying(detail.effect == 'play')

  //   switch (detail.effect) {
  //     case 'play':
  //       zoomview.enableAutoScroll(true)
  //       audioElement.current?.play()
  //       break
  //     case 'pause':
  //       audioElement.current?.pause()
  //       zoomview.enableAutoScroll(true)
  //       break
  //     case 'stop':
  //       audioElement.current?.pause()
  //       waveform?.player.seek(mixPoint || 0)
  //       zoomview.enableAutoScroll(true)
  //   }
  // }

  // add event listeners
  //Events.on('audio', audioEffect)
  Events.on('scroll', scrollEffect)
  Events.on('beatResolution', beatResolutionEffect)

  return waveform
}

export { renderWaveform }
