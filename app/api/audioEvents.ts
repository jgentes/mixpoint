// This file allows events to be received which need access to the waveform, rather than passing waveform around
import { now, Player, start, ToneAudioNode, Transport } from 'tone'
import { Tone } from 'tone/build/esm/core/Tone'
import {
  AudioState,
  getAudioState,
  setAudioState,
  setTableState,
  Stems,
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

const _getPlayers = (trackId?: number): Player[] => {
  // pull players from audioState for synchronized playback
  const [{ stems }] = getAudioState[trackId!]()
  if (!stems) return []

  return Object.values(stems).map(({ player }) => player as Player)
}

const _getAllPlayers = (): Player[] => {
  const [audioState] = getAudioState()

  let players: Player[] = []

  for (const [trackId, { stems }] of Object.entries(audioState)) {
    if (!stems) continue
    players = players.concat(_getPlayers(Number(trackId)))
  }

  return players
}

const _getAllWaveforms = (): WaveSurfer[] => {
  const [audioState] = getAudioState()

  let waveforms: WaveSurfer[] = []

  for (const { waveform } of Object.values(audioState)) {
    if (!waveform) continue
    waveforms.push(waveform)
  }

  return waveforms
}

const audioEvents = (trackId?: Track['id']) => {
  let audioState: AudioState, waveform: WaveSurfer, stems: Stems

  if (trackId) {
    ;[audioState] = getAudioState[trackId]()
    if (audioState.waveform) ({ waveform } = audioState)
    if (audioState.stems) ({ stems } = audioState)
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

    play: async (all?: boolean) => {
      //const { trackPrefs } = await getPrefs('mix')
      // pull audio elements from audioState and synchronize playback
      // setup an obj first to reduce latency
      // const { bpm } = (await db.tracks.get(Number(id))) || {}
      //   if (!bpm) continue
      // const { adjustedBpm } =
      // trackPrefs?.find(({ id: trackId }) => trackId === Number(id)) || {}
      // if (adjustedBpm) player.playbackRate = adjustedBpm / bpm

      await start()
      const contextTime = now()

      const [audioState] = getAudioState()
      for (const [id, { waveform }] of Object.entries(audioState)) {
        if (!waveform) continue
        if (!all && id !== String(trackId)) continue

        const startTime = waveform.getCurrentTime()
        const players = _getPlayers(Number(id))

        for (const player of players) {
          player.start(contextTime, startTime)
        }

        audioEvents(trackId)._playWaveform(waveform)
      }
    },

    _playWaveform: (wave: WaveSurfer) => {
      const { volumeMeterInterval = -1 } = audioState || {}

      waveform = wave || waveform

      // account for latency from tonejs
      const latency = 0.04
      const currentTime = waveform.getCurrentTime()
      const time = currentTime > latency ? currentTime - latency : currentTime

      waveform.play(time)

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

    playAll: () => audioEvents().play(true),
    pause: (all?: boolean) => {
      const { volumeMeterInterval } = audioState

      const players = all ? _getAllPlayers() : _getPlayers(trackId)
      for (const player of players) {
        player.stop()
      }

      const waveforms = all ? _getAllWaveforms() : [waveform]
      for (const wave of waveforms) {
        wave.pause()
      }

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
      console.log('nudge does not work properly, no offset')
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
      // if (playing) audioEvents(trackId).play(waveform.playhead.playheadTime)
      if (playing) audioEvents(trackId).play()
    },

    seekMixpoint: async () => {
      const { mixpointTime = 0 } = (await getTrackPrefs(trackId)) || {}
      const { playing } = audioState

      const time =
        mixpointTime > 0 ? 1 / (waveform.getDuration() / mixpointTime) : 0

      waveform.seekAndCenter(time)

      // if (playing) audioEvents(trackId).play(mixpointTime)
      if (playing) {
        audioEvents(trackId).pause()
        audioEvents(trackId).play()
      }
    },

    onSeek: (percentageTime: number) => {
      audioEvents(trackId).seek(waveform.getDuration() * percentageTime)
    },

    crossfade: async (sliderVal: number, stemType?: Stem) => {
      const { tracks = [] } = await getPrefs('mix', 'tracks')

      const [audioState] = getAudioState()

      const updateGain = (trackId: number, gain: number) => {
        const { stems } = audioState[trackId]
        if (!stems) return

        for (const stem of Object.keys(stems)) {
          if (stemType && stem != stemType) continue

          if (stems[stem as Stem]?.gainNode) {
            stems[stem as Stem]!.gainNode!.gain.value = gain
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
      if (stems) {
        for (const { element } of Object.values(stems)) {
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
      const element = stems[stem as Stem]?.element
      if (element) element.volume = volume / 100

      // set volume in state, which in turn will update components (volume sliders)
      setAudioState[trackId!].stems[stem as Stem].volume(volume)
    },

    stemMuteToggle: (stemType: Stem, mute: boolean) => {
      const stem = stems[stemType as Stem]
      const { element, volume } = stem || {}

      // update element volume (not volume in state)
      if (element) element.volume = mute ? 0 : (volume || 100) / 100

      // set muted in state, which in turn will update components (volume sliders)
      setAudioState[trackId!].stems[stemType as Stem].mute(mute)
    },

    stemSoloToggle: (stem: Stem, solo: boolean) => {
      for (const s of Object.keys(stems)) {
        if (s != stem) audioEvents(trackId).stemMuteToggle(s as Stem, solo)
      }
    },

    destroy: () => {
      const [{ volumeMeterInterval }] = getAudioState[trackId!]()
      if (volumeMeterInterval) clearInterval(volumeMeterInterval)

      for (let { player } of Object.values(stems)) {
        if (!player) continue

        player = player.dispose()
      }

      Transport.dispose()
      waveform.destroy()

      // remove audioState
      setAudioState[trackId!]()
    },
  }
}

export { audioEvents }
