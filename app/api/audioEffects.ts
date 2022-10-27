import { putTrackState, Track, TrackState } from '~/api/dbHandlers'
import { Events } from '~/api/Events'
import { calcRegions } from './renderWaveform'

const loadAudioEffects = async ({
  track,
  trackState,
  waveform,
}: {
  track: Track
  trackState: TrackState
  waveform: WaveSurfer
}) => {
  const scrollEffect = (scrollEvent: {
    direction: 'up' | 'down'
    trackId: number
  }) => {
    const { direction, trackId } = scrollEvent
    if (trackId == track.id)
      direction == 'down' ? waveform.skipBackward() : waveform.skipForward()
  }

  const beatResolutionEffect = async (beatResolutionEvent: {
    beatResolution: TrackState['beatResolution']
    trackId: number
  }) => {
    const { beatResolution, trackId } = beatResolutionEvent
    if (!beatResolution) return

    if (trackId == track.id) {
      // Adjust zoom
      switch (+beatResolution) {
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

      // Rebuild regions
      waveform.regions.clear()
      const { regions } = await calcRegions(track, {
        ...trackState,
        beatResolution,
      })
      for (const region of regions) waveform.regions.add(region)

      // Update mixState
      await putTrackState(trackId, { beatResolution })
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

export { loadAudioEffects }
