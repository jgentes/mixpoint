// This file allows events to be received which need access to the waveform, rather than passing waveform around

import { calcMarkers } from '~/api/audioHandlers'
import {
  db,
  getTrackStore,
  putTrackStore,
  Track,
  TrackStore,
  updateTrack,
} from '~/api/db/dbHandlers'
import { setAudioState, setWaveformState } from '~/api/uiState'
import { errorHandler } from '~/utils/notifications'
import { convertToSecs, timeFormat } from '~/utils/tableOps'
import { eventHandler } from './eventHandler'

// audioEvent are emitted by controls (e.g. buttons) to signal changes in audio, such as Play, adjust BPM, etc and the listeners are attached to the waveform when it is rendered

type AudioEvent =
  | 'seek'
  | 'beatResolution'
  | 'bpm'
  | 'offset'
  | 'nav'
  | 'setMixpoint'
  | 'destroy'
  | 'play'
  | 'pause'

type NavEvent =
  | 'Play'
  | 'Pause'
  | 'Set Mixpoint'
  | 'Go to Mixpoint'
  | 'Previous Beat Marker'
  | 'Next Beat Marker'

const audioEvent = eventHandler<AudioEvent>()

const initAudioEvents = async ({
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

  const { adjustedBpm, beatResolution, mixpointTime } =
    (await calcMarkers(trackId, waveform)) || {}

  // Adjust zoom based on previous mixStore
  waveform.zoom(beatResolution == 1 ? 80 : beatResolution == 0.5 ? 40 : 20)

  // Adjust bpm if set in mixStore
  if (adjustedBpm) {
    const { bpm } = (await db.tracks.get(trackId)) || {}
    waveform.setPlaybackRate(adjustedBpm / (bpm || adjustedBpm))
  }

  // for stems
  let sourceNodes: MediaElementAudioSourceNode[] = []

  // const audioElements = ['bass', 'drums', 'vocals', 'melody'].map(
  //   stem => document.getElementById(`${trackId}-${stem}`) as HTMLAudioElement
  // )

  const stemEvents = {
    play: ({
      context = new AudioContext(),
      offset = 0,
    }: {
      context?: AudioContext
      offset?: number
    }) => {
      // Build the audioContext every time because once started (played),
      // it must be closed and recreated before it can be started again

      // use setTimeout to ensure synchronized start time of all stems
      window.setTimeout(() => {
        for (const audioElement of audioElements) {
          audioElement.currentTime = context.currentTime + offset
          if (!sourceNodes.length) {
            const source = context.createMediaElementSource(audioElement)
            source.connect(context.destination)
            sourceNodes.push(source)
          }
          audioElement.play()
        }
      }, 0)
    },
    pause: () => {
      for (const audioElement of audioElements) {
        audioElement.pause()
      }
    },
  }

  const caclculateVolume = () => {
    analyzer.getByteFrequencyData(dataArray)

    let sum = 0
    for (const amplitude of dataArray) {
      sum += amplitude * amplitude
    }

    const volume = Math.sqrt(sum / (dataArray.length + 1000))

    setWaveformState[trackId].volume(volume)
  }

  const audioEvents = {
    onReady: () => {
      setAudioState.analyzing(prev => prev.filter(id => id !== trackId))

      // Set playhead to mixpoint if it exists
      const currentPlayhead =
        mixpointTime || waveform.markers.markers?.[0].time || 0

      if (currentPlayhead) {
        waveform.playhead.setPlayheadTime(currentPlayhead)
        waveform.seekAndCenter(1 / (waveform.getDuration() / currentPlayhead))
      }
    },
    play: ({ offset }: { offset?: number }) => {
      stemEvents.play({
        offset,
      })

      waveform.play()

      // Slow down sampling to 12ms
      if (volumeMeterInterval > -1) clearInterval(volumeMeterInterval)
      volumeMeterInterval = setInterval(caclculateVolume, 12.5)

      // Set play state, used to modify play button
      setAudioState.playing(prev => [...prev, trackId])
    },
    playAll: () => {
      const audioElements1 = ['bass', 'drums', 'vocals', 'melody'].map(
        stem => document.getElementById(`1-${stem}`) as HTMLAudioElement
      )

      const audioElements2 = ['bass', 'drums', 'vocals', 'melody'].map(
        stem => document.getElementById(`2-${stem}`) as HTMLAudioElement
      )

      const context = new AudioContext()

      const audioElements = [...audioElements1, ...audioElements2]
      console.log(audioElements)
      window.setTimeout(() => {
        for (const audioElement of audioElements) {
          audioElement.currentTime = context.currentTime + 0
          if (!sourceNodes.length) {
            const source = context.createMediaElementSource(audioElement)
            source.connect(context.destination)
            sourceNodes.push(source)
          }
          audioElement.play()
        }
      }, 0)
    },
    pause: () => {
      stemEvents.pause()

      waveform.pause()

      clearInterval(volumeMeterInterval)
      // Set to zero on pause
      setWaveformState[trackId].volume(0)

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
      beatResolution: TrackStore['beatResolution']
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

      // Update mixStore
      await putTrackStore(trackId, { beatResolution })

      calcMarkers(trackId, waveform)
    },
    bpm: async ({
      adjustedBpm,
    }: {
      adjustedBpm: TrackStore['adjustedBpm']
    }): Promise<void> => {
      if (!adjustedBpm) return

      const { bpm } = (await db.tracks.get(trackId)) || {}

      // Update playback rate based on new bpm
      const playbackRate = adjustedBpm / (bpm || adjustedBpm)
      waveform.setPlaybackRate(playbackRate)

      // Update mixStore
      putTrackStore(trackId, { adjustedBpm })
    },
    offset: async ({
      adjustedOffset,
    }: {
      adjustedOffset: Track['adjustedOffset']
    }): Promise<void> => {
      await updateTrack(trackId, { adjustedOffset })

      calcMarkers(trackId, waveform)
    },
    nav: async ({
      effect,
      context,
    }: {
      effect: NavEvent
      context: AudioContext
    }): Promise<void> => {
      const { mixpointTime } = (await getTrackStore(trackId)) || {}

      switch (effect) {
        case 'Play':
          audioEvents.play({})
          break
        case 'Pause':
          audioEvents.pause()
          break
        case 'Set Mixpoint':
          audioEvents.pause()

          audioEvents.setMixpoint({
            mixpoint: timeFormat(waveform.playhead.playheadTime),
          })
          break
        case 'Go to Mixpoint':
          waveform.seekAndCenter(
            mixpointTime ? 1 / (waveform.getDuration() / mixpointTime) : 0
          )
          audioEvents.play({})
          break
        case 'Previous Beat Marker':
          audioEvents.seek({ direction: 'previous' })
          break
        case 'Next Beat Marker':
          audioEvents.seek({ direction: 'next' })
          break
      }
    },
    setMixpoint: async ({ mixpoint }: { mixpoint: string }): Promise<void> => {
      const newMixpoint = convertToSecs(mixpoint)
      if (newMixpoint == mixpointTime) return

      putTrackStore(trackId, { mixpointTime: newMixpoint })
      waveform.seekAndCenter(1 / (waveform.getDuration() / newMixpoint))
    },
    destroy: (): void => {
      audioEvent.off(trackId, audioEventHandler)
      if (waveform) waveform.destroy()
    },
  }

  // Initialize wavesurfer event listeners
  waveform.on('ready', audioEvents.onReady)
  waveform.on('seek', audioEvents.seek)

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

  const audioEventHandler = ({
    type,
    args,
  }: {
    type: AudioEvent
    args?: any
  }) => audioEvents[type](args || {})

  // add event listener
  audioEvent.on(trackId, audioEventHandler)
}

export type { AudioEvent, NavEvent }
export { audioEvent, initAudioEvents }
