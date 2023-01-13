// This file allows events to be received which need access to the waveform, rather than passing waveform around

import {
  AudioElements,
  AudioState,
  getAudioState,
  setAudioState,
  setTableState,
} from '~/api/appState'
import { calcMarkers } from '~/api/audioHandlers'
import {
  db,
  getPrefs,
  getTrackPrefs,
  setTrackPrefs,
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

const audioEvents = (trackId?: Track['id']) => {
  let audioState: AudioState, waveform: WaveSurfer, audioElements: AudioElements

  if (trackId) {
    ;[audioState] = getAudioState[trackId]()
    if (audioState.waveform) ({ waveform } = audioState)
    if (audioState.audioElements) ({ audioElements } = audioState)
  }

  return {
    // Init occurs before waveform is generated, so any adjustments to view should be done here to avoid abrupt changes after render
    init: async () => {
      await calcMarkers(trackId, waveform)

      const { beatResolution = 1 } = await getTrackPrefs(trackId)

      // Adjust zoom based on previous mixPrefs
      waveform.zoom(beatResolution == 1 ? 80 : beatResolution == 0.5 ? 40 : 20)
    },

    onReady: async () => {
      setTableState.analyzing(prev => prev.filter(id => id !== trackId))

      const { adjustedBpm, mixpointTime } = await getTrackPrefs(trackId)

      // Set playhead to mixpoint if it exists
      const currentPlayhead =
        mixpointTime || waveform.markers.markers?.[0].time || 0

      if (currentPlayhead) {
        waveform.seekAndCenter(1 / (waveform.getDuration() / currentPlayhead))
        waveform.playhead.setPlayheadTime(currentPlayhead)
      }

      // Adjust playbackrate if bpm has been modified
      if (adjustedBpm) {
        const { bpm } = (await db.tracks.get(trackId!)) || {}
        waveform.setPlaybackRate(adjustedBpm / (bpm || adjustedBpm))
      }
    },

    _playStems: async (startTime: number, all?: boolean) => {
      // Tone.setContext(new Tone.Context({ latencyHint: 'playback' }))
      // Tone.Transport.start('+0.1')

      const [audioState] = getAudioState()
      const playObj: {
        stem: string
        id: string
        element: HTMLMediaElement
        mixpointTime?: number
        bpm: number
        adjustedBpm?: number
      }[] = []
      const { trackPrefs } = await getPrefs('mix')

      // pull audio elements from audioState and synchronize playback
      // setup an obj first to reduce latency
      for (const [id, { audioElements }] of Object.entries(audioState)) {
        if (!all && String(trackId) !== id) continue
        if (!audioElements) continue

        const { bpm } = (await db.tracks.get(Number(id))) || {}
        if (!bpm) continue

        for (const [stem, { element }] of Object.entries(audioElements)) {
          if (!element) continue
          const { mixpointTime, adjustedBpm } =
            trackPrefs?.find(({ id: trackId }) => trackId === Number(id)) || {}
          playObj.push({ stem, id, element, mixpointTime, bpm, adjustedBpm })
        }
      }

      // Build the audioContext every time because once started (played),
      // it must be closed and recreated before it can be started again
      const context = new AudioContext()

      // use setTimeout to ensure synchronized start time of all stems
      window.setTimeout(() => {
        // store gainNodes to avoid updating state while synchronizing play of stems
        let gains: { stem: string; id: string; gainNode: GainNode }[] = []

        for (const {
          stem,
          id,
          element,
          mixpointTime,
          bpm,
          adjustedBpm,
        } of playObj) {
          // only one mediaElementSource can be connected, so try/catch here
          let source: MediaElementAudioSourceNode,
            gainNode: GainNode | undefined
          try {
            element.currentTime =
              startTime ?? mixpointTime ?? context.currentTime + 0.1
            if (adjustedBpm) element.playbackRate = adjustedBpm / bpm

            source = context.createMediaElementSource(element)

            gainNode = context.createGain()
            gainNode.connect(context.destination)
            gains.push({ stem, id, gainNode })

            source.connect(gainNode)
          } catch (e) {
            // source already connected
          }

          element.play()
        }

        // store gainNode for control via crossfader while playing
        for (const { stem, id, gainNode } of gains)
          setAudioState[Number(id)].audioElements[stem as Stem].gainNode(
            gainNode
          )
      }, 0)
    },

    _playWaveform: (startTime: number = waveform.getCurrentTime()) => {
      const { volumeMeterInterval = -1 } = audioState || {}

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

    play: (startTime: number = waveform.getCurrentTime(), all?: boolean) => {
      audioEvents(trackId)._playStems(startTime, all)
      audioEvents(trackId)._playWaveform(startTime)
    },

    pause: () => {
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

    nudge: (direction: 'backward' | 'forward') => {
      const nudgeVal = 0.005
      const offset =
        waveform.getCurrentTime() +
        (direction == 'backward' ? -nudgeVal : nudgeVal)
      audioEvents(trackId).play(offset)
    },

    mute: () => {
      waveform.setMute(true)
    },

    // Scroll to previous/next beat marker
    seek: (
      startTime: number = waveform.getCurrentTime(),
      direction?: 'previous' | 'next'
    ) => {
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

      // if the audio is playing, restart playing when seeking to new time
      if (playing) audioEvents(trackId).play(waveform.playhead.playheadTime)
    },

    seekMixpoint: async () => {
      const { mixpointTime = 0 } = (await getTrackPrefs(trackId)) || {}
      const { playing } = audioState

      const time =
        mixpointTime > 0 ? 1 / (waveform.getDuration() / mixpointTime) : 0

      waveform.seekAndCenter(time)

      if (playing) audioEvents(trackId).play(mixpointTime)
    },

    onSeek: (percentageTime: number) => {
      audioEvents(trackId).seek(waveform.getDuration() * percentageTime)
    },

    crossfade: async (sliderVal: number, stemType?: Stem) => {
      const { tracks = [] } = await getPrefs('mix', 'tracks')

      const [audioState] = getAudioState()

      const updateGain = (trackId: number, gain: number) => {
        const { audioElements } = audioState[trackId]
        if (!audioElements) return

        for (const stem of Object.keys(audioElements)) {
          if (stemType && stem != stemType) continue

          if (audioElements[stem as Stem]?.gainNode) {
            audioElements[stem as Stem]!.gainNode!.gain.value = gain
          }
        }
      }

      const sliderPercent = sliderVal / 100

      // Use an equal-power crossfading curve:
      const gains = [
        Math.cos(sliderPercent * 0.5 * Math.PI),
        Math.cos((1 - sliderPercent) * 0.5 * Math.PI),
      ]

      tracks.forEach((track, i) => {
        if (track) updateGain(track, gains[i])
      })
    },

    beatResolution: async (
      beatResolution: TrackPrefs['beatResolution']
    ): Promise<void> => {
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
      await setTrackPrefs(trackId, { beatResolution })

      calcMarkers(trackId, waveform)
    },

    bpm: async (adjustedBpm: TrackPrefs['adjustedBpm']): Promise<void> => {
      if (!adjustedBpm) return

      const { bpm } = (await db.tracks.get(trackId!)) || {}

      const playbackRate = adjustedBpm / (bpm || adjustedBpm)

      // Update waveform playback rate
      waveform.setPlaybackRate(playbackRate)

      // update stem playback rate in realtime
      if (audioElements) {
        for (const { element } of Object.values(audioElements)) {
          if (!element) continue

          element.playbackRate = playbackRate
        }
      }

      // Update mixPrefs
      await setTrackPrefs(trackId, { adjustedBpm })
    },

    offset: async (adjustedOffset: Track['adjustedOffset']): Promise<void> => {
      await updateTrack(trackId, { adjustedOffset })

      calcMarkers(trackId, waveform)
    },

    setMixpoint: async (
      mixpoint: string = timeFormat(waveform.playhead.playheadTime)
    ): Promise<void> => {
      audioEvents(trackId).pause()

      const { mixpointTime } = (await getTrackPrefs(trackId)) || {}

      const newMixpoint = convertToSecs(mixpoint)
      if (newMixpoint == mixpointTime) return

      setTrackPrefs(trackId, { mixpointTime: newMixpoint })
      waveform.seekAndCenter(1 / (waveform.getDuration() / newMixpoint))
    },

    stemVolume: (stem: Stem, volume: number) => {
      // update element volume
      const element = audioElements[stem as Stem]?.element
      if (element) element.volume = volume / 100

      // set volume in state, which in turn will update components (volume sliders)
      setAudioState[trackId!].audioElements[stem as Stem].volume(volume)
    },

    stemMuteToggle: (stem: Stem, mute: boolean) => {
      const audioElement = audioElements[stem as Stem]
      const { element, volume } = audioElement || {}

      // update element volume (not volume in state)
      if (element) element.volume = mute ? 0 : (volume || 100) / 100

      // set muted in state, which in turn will update components (volume sliders)
      setAudioState[trackId!].audioElements[stem as Stem].mute(mute)
    },

    stemSoloToggle: (stem: Stem, solo: boolean) => {
      for (const s of Object.keys(audioElements)) {
        if (s != stem) audioEvents(trackId).stemMuteToggle(s as Stem, solo)
      }
    },
  }
}

export { audioEvents }
