// This file allows events to be received which need access to the waveform, rather than passing waveform around as a property of functions

import {
  db,
  getMixTrack,
  MixTrack,
  putMixTrack,
  putTracks,
  Track,
} from '~/api/dbHandlers'
import { errorHandler } from '~/utils/notifications'
import { tableOps } from '~/utils/tableOps'
import { calcRegions } from './renderWaveform'

// Events are emitted by controls (e.g. buttons) to signal changes in audio, such as Play, adjust BPM, etc and the listeners are attached to the waveform when it is rendered

const audioEventTypes = [
  'scroll',
  'beatResolution',
  'bpm',
  'offset',
  'nav',
  'mixpoint',
] as const
type AudioEvent = typeof audioEventTypes[number]

const audioEvent = {
  on(event: AudioEvent, callback: Function) {
    window.addEventListener(event, (e: CustomEventInit) => callback(e.detail))
  },
  emit(event: AudioEvent, data?: any) {
    window.dispatchEvent(new CustomEvent(event, { detail: data }))
  },
  off(event: AudioEvent, callback: any) {
    window.removeEventListener(event, callback)
  },
}

type NavEvent =
  | 'Play'
  | 'Pause'
  | 'Set Mixpoint'
  | 'Go to Mixpoint'
  | 'Previous Beat Marker'
  | 'Next Beat Marker'

const loadAudioEvents = async ({
  trackId,
  waveform,
}: {
  trackId: Track['id']
  waveform: WaveSurfer
}): Promise<void> => {
  if (!trackId) return

  const track = await db.tracks.get(trackId)
  if (!track)
    throw errorHandler('Track not found while setting up audio events.')

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

  const navEvent = ({
    tracks,
    effect,
  }: {
    tracks: Track['id'][]
    effect: NavEvent
  }): void => {
    if (!tracks.includes(trackId)) return

    const mixpoint = waveform.playhead.playheadTime

    switch (effect) {
      case 'Play':
        waveform.playPause()
        break
      case 'Pause':
        waveform.pause()
        break
      case 'Set Mixpoint':
        waveform.pause()

        audioEvent.emit('mixpoint', {
          trackId: track.id,
          mixpoint: tableOps.timeFormat(mixpoint),
        })
        break
      case 'Go to Mixpoint':
        waveform.seekAndCenter(1 / (track.duration! / mixpoint))
        waveform.pause()
        break
      case 'Previous Beat Marker':
        waveform.skipBackward(skipLength)
        break
      case 'Next Beat Marker':
        waveform.skipForward(skipLength)
        break
    }
  }

  const mixpointEvent = async ({
    trackId,
    mixpoint,
  }: {
    trackId: Track['id']
    mixpoint: string
  }): Promise<void> => {
    if (trackId !== track.id) return

    const { mixpoint: prevMixpoint } = (await getMixTrack(trackId)) || {}

    if (mixpoint == prevMixpoint) return

    putMixTrack(trackId, { mixpoint })
    waveform.seekAndCenter(
      1 / (track.duration! / tableOps.convertToSecs(mixpoint))
    )
  }

  // add event listeners
  audioEvent.on('scroll', scrollEvent)
  audioEvent.on('bpm', bpmEvent)
  audioEvent.on('beatResolution', beatResolutionEvent)
  audioEvent.on('offset', offsetEvent)
  audioEvent.on('nav', navEvent)
  audioEvent.on('mixpoint', mixpointEvent)
}

export type { AudioEvent, NavEvent }
export { audioEvent, loadAudioEvents }
