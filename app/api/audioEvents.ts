// This file allows events to be received which need access to the waveform, rather than passing waveform around

import { calcMarkers } from '~/api/audioHandlers'
import {
  db,
  getTrackPrefs,
  putTrackPrefs,
  Track,
  TrackPrefs,
  updateTrack,
} from '~/api/db/dbHandlers'
import { validateTrackStemAccess } from '~/api/fileHandlers'
import { getAudioState, setAudioState, setTableState } from '~/api/uiState'
import { convertToSecs, timeFormat } from '~/utils/tableOps'
import { eventHandler } from './eventHandler'

// audioEvent are emitted by controls (e.g. buttons) to signal changes in audio, such as Play, adjust BPM, etc and the listeners are attached to the waveform when it is rendered

type AudioEvent =
  | 'init'
  | 'onReady'
  | 'play'
  | 'playAll'
  | 'pause'
  | 'mute'
  | 'crossfade'
  | 'seek'
  | 'beatResolution'
  | 'bpm'
  | 'offset'
  | 'nav'
  | 'setMixpoint'
  | 'seekMixpoint'

type NavEvent =
  | 'Play'
  | 'Pause'
  | 'Set Mixpoint'
  | 'Go to Mixpoint'
  | 'Previous Beat Marker'
  | 'Next Beat Marker'

//const audioEvent = eventHandler<AudioEvent>()

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

const caclculateVolume = (analyzer: AnalyserNode, dataArray: Uint8Array) => {
  analyzer.getByteFrequencyData(dataArray)

  let sum = 0
  for (const amplitude of dataArray) {
    sum += amplitude * amplitude
  }

  return Math.sqrt(sum / (dataArray.length + 1000))
}

const audioEvents = (trackId: Track['id']) => {
  let [waveform] = getAudioState[trackId!].waveform()
  let sourceNodes = []

  const events = {
    async init() {
      const { adjustedBpm, beatResolution } =
        (await calcMarkers(trackId, waveform)) || {}

      // Adjust zoom based on previous mixPrefs
      waveform.zoom(beatResolution == 1 ? 80 : beatResolution == 0.5 ? 40 : 20)

      // Adjust bpm if set in mixPrefs
      if (adjustedBpm) {
        const { bpm } = (await db.tracks.get(trackId!)) || {}
        waveform.setPlaybackRate(adjustedBpm / (bpm || adjustedBpm))
      }
    },
    async onReady() {
      setTableState.analyzing(prev => prev.filter(id => id !== trackId))

      const { mixpointTime } = await getTrackPrefs(trackId)

      // Set playhead to mixpoint if it exists
      const currentPlayhead =
        mixpointTime || waveform.markers.markers?.[0].time || 0

      if (currentPlayhead) {
        waveform.playhead.setPlayheadTime(currentPlayhead)
        waveform.seekAndCenter(1 / (waveform.getDuration() / currentPlayhead))
      }
    },
    play(offset: number = waveform.getCurrentTime()) {
      // Setup for volume meter
      const [volumeMeterInterval] =
        getAudioState[trackId!].volumeMeterInterval()

      // @ts-ignore
      const analyzer = waveform.backend.analyser
      const bufferLength = analyzer.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      // Build the audioContext every time because once started (played),
      // it must be closed and recreated before it can be started again
      const [audioElements] = getAudioState[trackId!].audioElements()

      if (audioElements) {
        const context = new AudioContext()

        // use setTimeout to ensure synchronized start time of all stems
        window.setTimeout(() => {
          for (const audioElement of Object.values(audioElements)) {
            audioElement.currentTime = context.currentTime + offset
            // only one mediaElementSource can be connected, so try/catch here
            let source
            try {
              source = context.createMediaElementSource(audioElement)
              source.connect(context.destination)
            } catch (e) {
              // source already connected
            }
            audioElement.play()
          }
        }, 0)
      }

      waveform.play()

      // Slow down sampling to 12ms
      if (volumeMeterInterval > -1) clearInterval(volumeMeterInterval)
      const newInterval = setInterval(() => {
        const volume = caclculateVolume(analyzer, dataArray)
        setAudioState[trackId!].volume(volume)
      }, 12.5)

      setAudioState[trackId!](prev => ({
        ...prev,
        volumeMeterInterval: newInterval,
        playing: true,
      }))
    },
    playAll(offset: number = waveform.getCurrentTime()) {
      const [audioState] = getAudioState()

      // collect all audioElements
      let audioElements: HTMLAudioElement[] = []
      Object.keys(audioState).forEach(trackId => {
        for (const audioElement of Object.values(
          audioState[trackId].audioElements
        )) {
          audioElements.push(audioElement)
        }
      })

      const context = new AudioContext()

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
    pause() {
      const [audioElements] = getAudioState[trackId!].audioElements()
      if (audioElements) {
        for (const audioElement of Object.values(audioElements)) {
          audioElement.pause()
        }
      }

      waveform.pause()

      const [volumeMeterInterval] =
        getAudioState[trackId!].volumeMeterInterval()
      clearInterval(volumeMeterInterval)

      setAudioState[trackId!](prev => ({
        ...prev,
        volumeMeterInterval: -1,
        volume: 0,
        playing: false,
      }))
    },
    mute() {
      waveform.setMute(true)
    },
    // Scroll to previous/next beat marker
    seek(
      startTime: number = waveform.getCurrentTime(),
      direction?: 'previous' | 'next'
    ) {
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
    onSeek(percentageTime: number) {
      events.seek(waveform.getDuration() * percentageTime)
    },
    crossfade() {
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
    async beatResolution(
      beatResolution: TrackPrefs['beatResolution']
    ): Promise<void> {
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

      // Update mixPrefs
      await putTrackPrefs(trackId, { beatResolution })

      calcMarkers(trackId, waveform)
    },
    async bpm(adjustedBpm: TrackPrefs['adjustedBpm']): Promise<void> {
      if (!adjustedBpm) return

      const { bpm } = (await db.tracks.get(trackId!)) || {}

      // Update playback rate based on new bpm
      const playbackRate = adjustedBpm / (bpm || adjustedBpm)
      waveform.setPlaybackRate(playbackRate)

      // Update mixPrefs
      putTrackPrefs(trackId, { adjustedBpm })
    },
    offset: async (adjustedOffset: Track['adjustedOffset']): Promise<void> => {
      await updateTrack(trackId, { adjustedOffset })

      calcMarkers(trackId, waveform)
    },
    async nav(effect: NavEvent) {
      switch (effect) {
        case 'Play':
          events.play()
          break
        case 'Pause':
          events.pause()
          break
        case 'Set Mixpoint':
          events.setMixpoint(timeFormat(waveform.playhead.playheadTime))
          break
        case 'Go to Mixpoint':
          events.seekMixpoint()
          break
        case 'Previous Beat Marker':
          events.seek(undefined, 'previous')
          break
        case 'Next Beat Marker':
          events.seek(undefined, 'next')
          break
      }
    },
    async setMixpoint(mixpoint: string): Promise<void> {
      events.pause()

      const { mixpointTime } = (await getTrackPrefs(trackId)) || {}

      const newMixpoint = convertToSecs(mixpoint)
      if (newMixpoint == mixpointTime) return

      putTrackPrefs(trackId, { mixpointTime: newMixpoint })
      waveform.seekAndCenter(1 / (waveform.getDuration() / newMixpoint))
    },
    async seekMixpoint() {
      const { mixpointTime } = (await getTrackPrefs(trackId)) || {}
      if (mixpointTime)
        waveform.seekAndCenter(1 / (waveform.getDuration() / mixpointTime))
      events.play()
    },
    // destroy(): void {
    //   if (waveform) waveform.destroy()
    // },
  }

  return events
}

export type { AudioEvent, NavEvent }
export { audioEvents }
