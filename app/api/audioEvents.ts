// This file allows events to be received which need access to the waveform, rather than passing waveform around as a property of functions

import {
  db,
  getMixTrack,
  MixTrack,
  putMixTrack,
  putTracks,
  Track,
} from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'
import { errorHandler } from '~/utils/notifications'
import { calcRegions } from './renderWaveform'

const loadAudioEvents = async ({
  trackId,
  waveform,
}: {
  trackId: Track['id']
  waveform: WaveSurfer
}): Promise<void> => {
  if (!trackId) return

  const track = await db.tracks.get(trackId)
  if (!track) throw errorHandler('Track not found for waveform generation.')

  // Allow adjustment in skipLength, as this cannot be updated via wavesurfer
  let skipLength = waveform.skipLength

  const scrollEvent = ({
    trackId,
    direction,
  }: {
    trackId: Track['id']
    direction: 'up' | 'down'
  }) => {
    if (trackId == track.id)
      direction == 'down'
        ? waveform.skipBackward(skipLength)
        : waveform.skipForward(skipLength)
  }

  const beatResolutionEvent = async ({
    trackId,
    beatResolution,
  }: {
    trackId: Track['id']
    beatResolution: MixTrack['beatResolution']
  }): Promise<void> => {
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
    const { regions, skipLength: newSkipLength } = await calcRegions(track, {
      beatResolution,
    })
    for (const region of regions) waveform.regions.add(region)

    // Adjust skiplength
    skipLength = newSkipLength

    // Update mixState
    putMixTrack(trackId, { beatResolution })
  }

  const bpmEvent = ({
    trackId,
    adjustedBpm,
  }: {
    trackId: Track['id']
    adjustedBpm: MixTrack['adjustedBpm']
  }): void => {
    if (!adjustedBpm || trackId !== track.id) return

    // Update playback rate based on new bpm
    const playbackRate = adjustedBpm / (track.bpm || adjustedBpm)
    waveform.setPlaybackRate(playbackRate)

    // Update mixState
    putMixTrack(trackId, { adjustedBpm })
  }

  const offsetEvent = async ({
    trackId,
    adjustedOffset,
  }: {
    trackId: Track['id']
    adjustedOffset: Track['adjustedOffset']
  }): Promise<void> => {
    if (trackId !== track.id) return

    const newTrack = { ...track, adjustedOffset }

    // Rebuild regions
    waveform.regions.clear()
    const { regions } = await calcRegions(newTrack)
    for (const region of regions) waveform.regions.add(region)

    // Update track
    putTracks([newTrack])
  }

  const audioEvent = ({
    tracks,
    effect,
  }: {
    tracks: Track['id'][]
    effect: 'Play' | 'Pause' | 'Stop'
  }): void => {
    if (!tracks.includes(trackId)) return

    switch (effect) {
      case 'Play':
      case 'Pause':
        waveform.playPause()
        break
      case 'Stop':
        waveform.stop()
        break
    }
  }

  const mixpointEvent = async ({
    trackId,
    mixpoint,
  }: {
    trackId: Track['id']
    mixpoint: MixTrack['mixpoint']
  }): Promise<void> => {
    if (trackId !== track.id) return

    const { mixpoint: prevMixpoint } = (await getMixTrack(trackId)) || {}
    console.log(prevMixpoint, mixpoint)
    if (mixpoint !== prevMixpoint) putMixTrack(trackId, { mixpoint })
  }

  // add event listeners
  EventBus.on('scroll', scrollEvent)
  EventBus.on('bpm', bpmEvent)
  EventBus.on('beatResolution', beatResolutionEvent)
  EventBus.on('offset', offsetEvent)
  EventBus.on('audio', audioEvent)
  EventBus.on('mixpoint', mixpointEvent)
}

export { loadAudioEvents }
