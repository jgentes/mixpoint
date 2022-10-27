// This file allows events to be received which need access to the waveform, rather than passing waveform around as a property of functions

import {
  db,
  putTracks,
  putTrackState,
  Track,
  TrackState,
  useLiveQuery,
} from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'
import { calcRegions } from './renderWaveform'

const loadAudioEvents = async ({
  trackId,
  waveform,
}: {
  trackId: Track['id']
  waveform: WaveSurfer
}) => {
  if (!trackId) return null
  const track = useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

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
    trackId,
    beatResolution,
  }: {
    trackId: number
    beatResolution: TrackState['beatResolution']
  }) => {
    if (!beatResolution || trackId !== track.id) return

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
    const { regions } = await calcRegions(track, { beatResolution })
    for (const region of regions) waveform.regions.add(region)

    // Update mixState
    await putTrackState(trackId, { beatResolution })
  }

  const offsetEvent = async ({
    trackId,
    adjustedOffset,
  }: {
    trackId: number
    adjustedOffset: Track['adjustedOffset']
  }) => {
    if (trackId !== track.id) return

    const newTrack = { ...track, adjustedOffset }

    // Rebuild regions
    waveform.regions.clear()
    const { regions } = await calcRegions(newTrack)
    for (const region of regions) waveform.regions.add(region)

    // Update mixState
    await putTracks([newTrack])
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
  EventBus.on('offset', offsetEvent)

  return waveform
}

export { loadAudioEvents }
