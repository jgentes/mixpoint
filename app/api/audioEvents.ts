// This file allows events to be received which need access to the waveform, rather than passing waveform around

import preventClick from 'wavesurfer.js/src/util/prevent-click'
import { getAudioState, setAudioState, setTableState } from '~/api/appState'
import { calcMarkers } from '~/api/audioHandlers'
import {
  db,
  getPrefs,
  getTrackPrefs,
  putTrackPrefs,
  Stem,
  Track,
  TrackPrefs,
  updateTrack,
} from '~/api/db/dbHandlers'
import { convertToSecs, timeFormat } from '~/utils/tableOps'

// audioEvent are emitted by controls (e.g. buttons) to signal changes in audio, such as Play, adjust BPM, etc and the listeners are attached to the waveform when it is rendered

const _caclculateVolume = (analyzer: AnalyserNode, dataArray: Uint8Array) => {
  analyzer.getByteFrequencyData(dataArray)

  let sum = 0
  for (const amplitude of dataArray) {
    sum += amplitude * amplitude
  }

  return Math.sqrt(sum / (dataArray.length + 1000))
}

const audioEvents = (trackId: Track['id']) => {
  const [audioState] = getAudioState[trackId!]()
  const { waveform, audioElements } = audioState || {}

  return {
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
    _playStems(startTime: number) {
      // pull audio elements from audioState and synchronize playback
      if (!audioElements) return

      const elementArray = Object.values(audioElements || {}).map(
        ({ element }) => element!
      )

      // Build the audioContext every time because once started (played),
      // it must be closed and recreated before it can be started again
      const context = new AudioContext()

      // use setTimeout to ensure synchronized start time of all stems
      window.setTimeout(() => {
        for (const element of elementArray) {
          if (!element) continue

          element.currentTime = context.currentTime + startTime
          // only one mediaElementSource can be connected, so try/catch here
          let source
          try {
            source = context.createMediaElementSource(element)
            source.connect(context.destination)
          } catch (e) {
            // source already connected
          }
          element.play()
        }
      }, 0)
    },
    _playWaveform(startTime: number) {
      const { volumeMeterInterval } = audioState || {}

      waveform.play(startTime)

      // Setup for volume meter

      // @ts-ignore
      const analyzer = waveform.backend.analyser
      const bufferLength = analyzer.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      // Slow down sampling to 12ms
      if (volumeMeterInterval > -1) clearInterval(volumeMeterInterval)
      const newInterval = setInterval(() => {
        const volumeMeter = _caclculateVolume(analyzer, dataArray)
        setAudioState[trackId!](prev => ({
          ...prev,
          volumeMeter,
          time: waveform.getCurrentTime(),
        }))
      }, 12.5)

      setAudioState[trackId!](prev => ({
        ...prev,
        volumeMeterInterval: newInterval,
        playing: true,
      }))
    },
    play(offset: number = audioState.waveform.getCurrentTime()) {
      audioEvents(trackId)._playStems(offset)
      audioEvents(trackId)._playWaveform(offset)
    },
    pause() {
      const { volumeMeterInterval } = audioState

      if (audioElements) {
        for (const { element } of Object.values(audioElements)) {
          if (element) element.pause()
        }
      }

      waveform.pause()

      clearInterval(volumeMeterInterval)

      setAudioState[trackId!](prev => ({
        ...prev,
        volumeMeterInterval: -1,
        volumeMeter: 0,
        playing: false,
      }))
    },
    mute() {
      waveform.setMute(true)
    },
    // Scroll to previous/next beat marker
    seek(
      startTime: number = audioState.waveform.getCurrentTime(),
      direction?: 'previous' | 'next'
    ) {
      const { playing } = audioState
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
      // if the audio is playing, restart playing on seek to new time

      if (playing) audioEvents(trackId).play(waveform.playhead.playheadTime)
    },
    onSeek(percentageTime: number) {
      audioEvents(trackId).seek(waveform.getDuration() * percentageTime)
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
    async setMixpoint(
      mixpoint: string = timeFormat(waveform.playhead.playheadTime)
    ): Promise<void> {
      audioEvents(trackId).pause()

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
      audioEvents(trackId).play()
    },
    stemVolume(stem: Stem, volume: number) {
      // update element volume
      const element = audioElements[stem as Stem]?.element
      if (element) element.volume = volume / 100

      // set volume in state, which in turn will update components (volume sliders)
      setAudioState[trackId!].audioElements[stem as Stem].volume(volume)
    },
    stemMuteToggle(stem: Stem, mute: boolean) {
      const audioElement = audioElements[stem as Stem]
      const { element, volume } = audioElement || {}

      // update element volume (not volume in state)
      if (element) element.volume = mute ? 0 : (volume || 100) / 100

      // set muted in state, which in turn will update components (volume sliders)
      setAudioState[trackId!].audioElements[stem as Stem].mute(mute)
    },
    stemSoloToggle(stem: Stem, solo: boolean) {
      for (const s of Object.keys(audioElements)) {
        if (s != stem) audioEvents(trackId).stemMuteToggle(s as Stem, solo)
      }
    },
  }
}

export { audioEvents }
