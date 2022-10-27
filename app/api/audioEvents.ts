import { putTrackState, Track, TrackState } from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'
import { calcRegions } from './renderWaveform'

const loadAudioEvents = async ({
  track,
  trackState,
  waveform,
}: {
  track: Track
  trackState: TrackState
  waveform: WaveSurfer
}) => {
  const scrollEvent = ({
    direction,
    trackId,
  }: {
    direction: 'up' | 'down'
    trackId: number
  }) => {
    if (trackId == track.id)
      direction == 'down' ? waveform.skipBackward() : waveform.skipForward()
  }

  const beatResolutionEvent = async ({
    beatResolution,
    trackId,
  }: {
    beatResolution: TrackState['beatResolution']
    trackId: number
  }) => {
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
  EventBus.on('scroll', scrollEvent)
  EventBus.on('beatResolution', beatResolutionEvent)

  return waveform
}

export { loadAudioEvents }
