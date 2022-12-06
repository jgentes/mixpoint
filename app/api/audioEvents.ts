// This file allows events to be received which need access to the waveform, rather than passing waveform around as a property of functions

import {
  db,
  getTrackState,
  putTracks,
  putTrackState,
  Track,
  TrackState,
} from '~/api/dbHandlers'
import { calcMarkers } from '~/api/waveformEvents'
import { errorHandler } from '~/utils/notifications'
import { convertToSecs, timeFormat } from '~/utils/tableOps'

// AudioEvents are emitted by controls (e.g. buttons) to signal changes in audio, such as Play, adjust BPM, etc and the listeners are attached to the waveform when it is rendered

const audioEventTypes = [
  'seek',
  'beatResolution',
  'bpm',
  'offset',
  'nav',
  'mixpoint',
  'destroy',
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

  // Scroll to previous/next beat marker
  const seekEvent = ({
    time: startTime = waveform.playhead.playheadTime,
    direction,
  }: {
    time?: number
    direction?: 'previous' | 'next'
  }) => {
    const { markers = [] } = waveform.markers || {}

    // Find the closest (left-most) marker to the current time
    const currentMarkerIndex = Math.floor(startTime / waveform.skipLength)

    const index =
      currentMarkerIndex + (direction ? (direction == 'next' ? 1 : -1) : 0)
    const { time } = markers[index] || {}

    // Estimate that we're at the right time and move playhead (and center if using prev/next buttons)
    if (time && (time > startTime + 0.005 || time < startTime - 0.005)) {
      if (direction) waveform.skipForward(time - startTime)
      else {
        waveform.playhead.setPlayheadTime(time)
        // Only update mixpoint if we're not scrolling with the mouse
        putTrackState(trackId, { mixpoint: timeFormat(time) })
      }
    }
  }

  const crossfadeEvent = () => {
    // https://github.com/notthetup/smoothfade
    // or
    // from https://codepen.io/lukeandersen/pen/QEmwYG
    // Fades between 0 (all source 1) and 1 (all source 2)
    // CrossfadeSample.crossfade = function (element) {
    //   var x = parseInt(element.value) / parseInt(element.max)
    //   // Use an equal-power crossfading curve:
    //   var gain1 = Math.cos(x * 0.5 * Math.PI)
    //   var gain2 = Math.cos((1.0 - x) * 0.5 * Math.PI)
    //   this.ctl1.gainNode.gain.value = gain1
    //   this.ctl2.gainNode.gain.value = gain2
    // }
  }

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

    // Update mixState
    await putTrackState(trackId, { beatResolution })

    calcMarkers(track, waveform)
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

    // Update track
    await putTracks([newTrack])

    calcMarkers(newTrack, waveform)
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
      // case 'Set Mixpoint':
      //   waveform.pause()

      //   audioEvent.emit(trackId, 'mixpoint', {
      //     mixpoint: timeFormat(mixpoint),
      //   })
      //   break
      case 'Go to Mixpoint':
        waveform.seekAndCenter(1 / (waveform.getDuration() / mixpoint))
        waveform.pause()
        break
      case 'Previous Beat Marker':
        seekEvent({ direction: 'previous' })
        break
      case 'Next Beat Marker':
        seekEvent({ direction: 'next' })
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
    waveform.seekAndCenter(
      1 / (waveform.getDuration() / convertToSecs(mixpoint))
    )
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
      case 'seek':
        seekEvent(args)
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
