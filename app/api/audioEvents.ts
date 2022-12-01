// This file allows events to be received which need access to the waveform, rather than passing waveform around as a property of functions

import {
  db,
  getTrackState,
  putTracks,
  putTrackState,
  Track,
  TrackState,
} from '~/api/dbHandlers'
import { errorHandler } from '~/utils/notifications'
import { convertToSecs, timeFormat } from '~/utils/tableOps'
import { calcRegions } from './renderWaveform'

// Events are emitted by controls (e.g. buttons) to signal changes in audio, such as Play, adjust BPM, etc and the listeners are attached to the waveform when it is rendered

const audioEventTypes = [
  'scroll',
  'beatResolution',
  'bpm',
  'offset',
  'nav',
  'mixpoint',
  'destroy',
  'volumeMeter', // handled in VolumeMeter component
] as const
type AudioEvent = typeof audioEventTypes[number]

const audioEvent = {
  on(trackId: number, callback: Function) {
    window.addEventListener(String(trackId), (e: CustomEventInit) =>
      callback(e.detail)
    )
  },
  emit(trackId: number, event: AudioEvent, args?: any) {
    window.dispatchEvent(
      new CustomEvent(String(trackId), { detail: { event, args } })
    )
  },
  off(trackId: number, callback: any) {
    window.removeEventListener(String(trackId), callback)
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

  const scrollEvent = ({ up }: { up: boolean }) =>
    up ? waveform.skipForward(skipLength) : waveform.skipBackward(skipLength)

  const beatResolutionEvent = async ({
    beatResolution,
  }: {
    beatResolution: TrackState['beatResolution']
  }): Promise<void> => {
    if (!beatResolution) return

    // Adjust zoom
    switch (beatResolution) {
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
    putTrackState(trackId, { beatResolution })
  }

  const bpmEvent = ({
    adjustedBpm,
  }: {
    adjustedBpm: TrackState['adjustedBpm']
  }): void => {
    if (!adjustedBpm) return

    // Update playback rate based on new bpm
    const playbackRate = adjustedBpm / (track.bpm || adjustedBpm)
    waveform.setPlaybackRate(playbackRate)

    // Update mixState
    putTrackState(trackId, { adjustedBpm })
  }

  const offsetEvent = async ({
    adjustedOffset,
  }: {
    adjustedOffset: Track['adjustedOffset']
  }): Promise<void> => {
    const newTrack = { ...track, adjustedOffset }

    // Rebuild regions
    waveform.regions.clear()
    const { regions } = await calcRegions(newTrack)
    for (const region of regions) waveform.regions.add(region)

    // Update track
    putTracks([newTrack])
  }

  const navEvent = ({ effect }: { effect: NavEvent }): void => {
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

        audioEvent.emit(trackId, 'mixpoint', {
          mixpoint: timeFormat(mixpoint),
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
    mixpoint,
  }: {
    mixpoint: string
  }): Promise<void> => {
    const { mixpoint: prevMixpoint } = (await getTrackState(trackId)) || {}

    if (mixpoint == prevMixpoint) return

    putTrackState(trackId, { mixpoint })
    waveform.seekAndCenter(1 / (track.duration! / convertToSecs(mixpoint)))
  }

  const destroyEvent = (): void => {
    audioEvent.off(trackId, waveformEffects)
    if (waveform) waveform.destroy()
  }

  const waveformEffects = ({
    event,
    args,
  }: {
    event: AudioEvent
    args?: any
  }) => {
    switch (event) {
      case 'scroll':
        scrollEvent(args)
        break
      case 'beatResolution':
        beatResolutionEvent(args)
        break
      case 'bpm':
        bpmEvent(args)
        break
      case 'offset':
        offsetEvent(args)
        break
      case 'nav':
        navEvent(args)
        break
      case 'mixpoint':
        mixpointEvent(args)
        break
      case 'destroy':
        destroyEvent()
        break
    }
  }

  // add event listener
  audioEvent.on(trackId, waveformEffects)
}

export type { AudioEvent, NavEvent }
export { audioEvent, loadAudioEvents }
