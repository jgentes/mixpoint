// This file allows events to be received which need access to the waveform, rather than passing waveform around

import { calcMarkers } from '~/api/audioHandlers'
import {
  db,
  getTrackState,
  putTrackState,
  Track,
  TrackState,
  updateTrack,
} from '~/api/db/dbHandlers'
import { setAudioState, setVolumeState } from '~/api/uiState'
import { errorHandler } from '~/utils/notifications'
import { convertToSecs, timeFormat } from '~/utils/tableOps'
import { eventHandler } from './eventHandler'

// WaveformEvents are emitted by controls (e.g. buttons) to signal changes in audio, such as Play, adjust BPM, etc and the listeners are attached to the waveform when it is rendered

type WaveformEvent =
  | 'seek'
  | 'beatResolution'
  | 'bpm'
  | 'offset'
  | 'nav'
  | 'mixpoint'
  | 'destroy'

type NavEvent =
  | 'Play'
  | 'Pause'
  | 'Set Mixpoint'
  | 'Go to Mixpoint'
  | 'Previous Beat Marker'
  | 'Next Beat Marker'

const waveformEvent = eventHandler<WaveformEvent>()

// WaveformEvents are emitted by interaction with the Waveform, such as seek, region interactions, etc, as opposed to external controls
const initWaveformEvents = async ({
  trackId,
  waveform,
}: {
  trackId: Track['id']
  waveform: WaveSurfer
}): Promise<void> => {
  if (!trackId) return

  // Setup for volume meter
  let volumeMeterInterval: ReturnType<typeof setInterval> | number // placeholder for setInterval

  // @ts-ignore
  const analyzer = waveform.backend.analyser
  const bufferLength = analyzer.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const { adjustedBpm, beatResolution, mixpoint } =
    (await calcMarkers(trackId, waveform)) || {}

  // Adjust zoom based on previous mixState
  waveform.zoom(beatResolution == 1 ? 80 : beatResolution == 0.5 ? 40 : 20)

  // Adjust bpm if set in mixState
  if (adjustedBpm) {
    const { bpm } = (await db.tracks.get(trackId)) || {}
    waveform.setPlaybackRate(adjustedBpm / (bpm || adjustedBpm))
  }

  const waveformEvents = {
    caclculateVolume: () => {
      analyzer.getByteFrequencyData(dataArray)

      let sum = 0
      for (const amplitude of dataArray) {
        sum += amplitude * amplitude
      }

      const volume = Math.sqrt(sum / (dataArray.length + 1000))

      setVolumeState[trackId].volume(volume)
    },
    onReady: () => {
      setAudioState.analyzing(prev => prev.filter(id => id !== trackId))

      // Set playhead to mixpoint if it exists
      const currentPlayhead = mixpoint
        ? convertToSecs(mixpoint)
        : waveform.markers.markers?.[0].time || 0

      if (currentPlayhead) {
        waveform.playhead.setPlayheadTime(currentPlayhead)
        waveform.seekAndCenter(1 / (waveform.getDuration() / currentPlayhead))
      }
    },
    onPlay: () => {
      // Slow down sampling to 10ms
      if (volumeMeterInterval > -1) clearInterval(volumeMeterInterval)
      volumeMeterInterval = setInterval(
        () => waveformEvents.caclculateVolume(),
        15
      )

      // Set play state, used to modify play button
      setAudioState.playing(prev => [...prev, trackId])
    },
    onPause: () => {
      clearInterval(volumeMeterInterval)
      // Set to zero on pause
      setVolumeState[trackId].volume(0)

      // Set play state, used to modify play button
      setAudioState.playing(prev => prev.filter(id => id !== trackId))
    },
    // Scroll to previous/next beat marker
    seek: ({
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
    },
    crossfade: () => {
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
    },
    beatResolution: async ({
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

      calcMarkers(trackId, waveform)
    },
    bpm: async ({
      adjustedBpm,
    }: {
      adjustedBpm: TrackState['adjustedBpm']
    }): Promise<void> => {
      if (!adjustedBpm) return

      const { bpm } = (await db.tracks.get(trackId)) || {}

      // Update playback rate based on new bpm
      const playbackRate = adjustedBpm / (bpm || adjustedBpm)
      waveform.setPlaybackRate(playbackRate)

      // Update mixState
      putTrackState(trackId, { adjustedBpm })
    },
    offset: async ({
      adjustedOffset,
    }: {
      adjustedOffset: Track['adjustedOffset']
    }): Promise<void> => {
      await updateTrack(trackId, { adjustedOffset })

      calcMarkers(trackId, waveform)
    },
    nav: ({ effect }: { effect: NavEvent }): void => {
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

        //   waveformEvent.emit(trackId, 'mixpoint', {
        //     mixpoint: timeFormat(mixpoint),
        //   })
        //   break
        case 'Go to Mixpoint':
          waveform.seekAndCenter(1 / (waveform.getDuration() / mixpoint))
          waveform.pause()
          break
        case 'Previous Beat Marker':
          waveformEvents.seek({ direction: 'previous' })
          break
        case 'Next Beat Marker':
          waveformEvents.seek({ direction: 'next' })
          break
      }
    },
    mixpoint: async ({ mixpoint }: { mixpoint: string }): Promise<void> => {
      const { mixpoint: prevMixpoint } = (await getTrackState(trackId)) || {}

      if (mixpoint == prevMixpoint) return

      putTrackState(trackId, { mixpoint })
      waveform.seekAndCenter(
        1 / (waveform.getDuration() / convertToSecs(mixpoint))
      )
    },
    destroy: (): void => {
      waveformEvent.off(trackId, waveformEventHandler)
      if (waveform) waveform.destroy()
    },
  }

  // Initialize wavesurfer event listeners
  waveform.on('ready', waveformEvents.onReady)
  waveform.on('play', waveformEvents.onPlay)
  waveform.on('pause', waveformEvents.onPause)
  waveform.on('seek', () => waveformEvent.emit(trackId, 'seek', {}))

  // waveform.on('region-click', region => {
  //   if (waveform.isPlaying()) return waveform.pause()

  //   // Time gets inconsistent at 14 digits so need to round here
  //   const time = waveform.getCurrentTime().toFixed(3)
  //   const clickInsideOfPlayheadRegion =
  //     waveform.playhead.playheadTime.toFixed(3) == region.start.toFixed(3)
  //   const cursorIsAtPlayhead = time == waveform.playhead.playheadTime.toFixed(3)

  //   if (cursorIsAtPlayhead && clickInsideOfPlayheadRegion) {
  //     waveform.play()
  //   } else if (clickInsideOfPlayheadRegion) {
  //     // Take the user back to playhead
  //     waveform.seekAndCenter(
  //       1 / (waveform.getDuration() / waveform.playhead.playheadTime)
  //     )
  //   } else {
  //     // Move playhead to new region (seek is somewhat disorienting)
  //     waveform.playhead.setPlayheadTime(region.start)
  //   }
  // })

  const waveformEventHandler = ({
    type,
    args,
  }: {
    type: WaveformEvent
    args?: any
  }) => {
    console.log('event', type, 'args:', args)
    waveformEvents[type](args)
  }

  // add event listener
  waveformEvent.on(trackId, waveformEventHandler)
}

export type { WaveformEvent, NavEvent }
export { waveformEvent, initWaveformEvents }
