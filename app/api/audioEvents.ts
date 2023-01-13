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

const percentageToDb = (percentage: number) => {
  return -3 + (percentage / 100) * 3
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

const audioEvents = {
  // Init occurs before waveform is generated, so any adjustments to view should be done here to avoid abrupt changes after render
  init: async (trackId: Track['id']) => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform) return

    await calcMarkers(trackId, waveform)

    const { beatResolution = 1 } = await getTrackPrefs(trackId)

    // Adjust zoom based on previous mixPrefs
    waveform.zoom(beatResolution == 1 ? 80 : beatResolution == 0.5 ? 40 : 20)
  },

  onReady: async (trackId: Track['id']) => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform) return

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

  play: async (trackId?: Track['id']) => {
    // pull audio elements from audioState and synchronize playback
    const [audioState] = getAudioState()

    // use the same Tonejs audio context timer for all stems
    await start()
    const contextTime = now()

    for (const [id, { waveform }] of Object.entries(audioState)) {
      if (!waveform) continue
      if (trackId && id !== String(trackId)) continue

      // check for bpm adjustment
      let bpm
      const { adjustedBpm } = await getTrackPrefs(Number(id))
      if (adjustedBpm) {
        ;({ bpm } = (await db.tracks.get(Number(id))) || {})
      }

      const startTime = waveform.getCurrentTime()
      const players = _getPlayers(Number(id))

      for (const player of players) {
        if (adjustedBpm && bpm) player.playbackRate = adjustedBpm / bpm
        player.start(contextTime, startTime)
      }

      audioEvents._playWaveform(waveform)
    }
  },

  _playWaveform: (waveform: WaveSurfer) => {
    // account for latency from tonejs
    const latency = 0.04
    const currentTime = waveform.getCurrentTime()
    const time = currentTime > latency ? currentTime - latency : currentTime

    waveform.play(time)

    // Setup for volume meter

    // // @ts-ignore
    // const analyzer = waveform.backend.analyser
    // const bufferLength = analyzer.frequencyBinCount
    // const dataArray = new Uint8Array(bufferLength)

    // // Slow down sampling to 12ms
    // if (volumeMeterInterval > -1) clearInterval(volumeMeterInterval)
    // const newInterval = setInterval(() => {
    //   const volumeMeter = _caclculateVolume(analyzer, dataArray)
    //   setAudioState[trackId!](prev => ({
    //     ...prev,
    //     volumeMeter,
    //     time: waveform.getCurrentTime(),
    //   }))
    // }, 12.5)

    // setAudioState[trackId!](prev => ({
    //   ...prev,
    //   volumeMeterInterval: newInterval,
    //   playing: true,
    // }))
  },

  pause: async (trackId?: Track['id']) => {
    const players = trackId ? _getPlayers(trackId) : _getAllPlayers()

    const time = now()
    for (const player of players) {
      player.stop(time)
    }

    let waveforms, trackIds
    if (trackId) {
      const [waveform] = getAudioState[trackId!].waveform()
      waveforms = [waveform]
      trackIds = [trackId]
    } else {
      waveforms = _getAllWaveforms()
      const [audioState] = getAudioState()
      trackIds = Object.keys(audioState)
    }

    for (const wave of waveforms) {
      if (wave) wave.pause()
    }

    for (const id of trackIds) {
      const [volumeMeterInterval] =
        getAudioState[Number(id)].volumeMeterInterval()
      clearInterval(volumeMeterInterval)

      setAudioState[Number(id)]((prev: AudioState) => ({
        ...prev,
        volumeMeterInterval: -1,
        volumeMeter: 0,
        playing: false,
      }))
    }
  },

  nudge: (trackId: Track['id'], direction: 'backward' | 'forward') => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform) return

    const nudgeVal = 0.005
    const offset =
      waveform.getCurrentTime() +
      (direction == 'backward' ? -nudgeVal : nudgeVal)
    console.log('nudge does not work properly, no offset')
    audioEvents.play(trackId, offset)
  },

  mute: (trackId: Track['id']) => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (waveform) waveform.setMute(true)
  },

  // Scroll to previous/next beat marker
  seek: (
    trackId: Track['id'],
    startTime?: number,
    direction?: 'previous' | 'next'
  ) => {
    const [{ playing, waveform }] = getAudioState[trackId!]()
    if (!waveform) return

    const { markers = [] } = waveform.markers || {}

    startTime = startTime || waveform.getCurrentTime()

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
    if (playing) {
      audioEvents.pause(trackId)
      audioEvents.play(trackId)
      //audioEvents.play(trackId, waveform.playhead.playheadTime)
    }
  },

  seekMixpoint: async (trackId: Track['id']) => {
    const { mixpointTime = 0 } = (await getTrackPrefs(trackId)) || {}
    const [{ playing, waveform }] = getAudioState[trackId!]()
    if (!waveform) return

    const time =
      mixpointTime > 0 ? 1 / (waveform.getDuration() / mixpointTime) : 0

    waveform.seekAndCenter(time)

    // if (playing) audioEvents.play(trackId, mixpointTime)
    if (playing) {
      audioEvents.pause(trackId)
      audioEvents.play(trackId)
    }
  },

  onSeek: (trackId: Track['id'], percentageTime: number) => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform) return

    audioEvents.seek(trackId, waveform.getDuration() * percentageTime)
  },

  crossfade: async (sliderVal: number, stemType?: Stem) => {
    const [audioState] = getAudioState()
    const tracks = Object.keys(audioState)

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
      if (track) updateGain(Number(track), gains[i])
    })
  },

  beatResolution: async (
    trackId: Track['id'],
    beatResolution: TrackPrefs['beatResolution']
  ): Promise<void> => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform || !beatResolution) return

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

  bpm: async (
    trackId: Track['id'],
    adjustedBpm: TrackPrefs['adjustedBpm']
  ): Promise<void> => {
    const [{ stems, waveform }] = getAudioState[trackId!]()
    if (!waveform || !adjustedBpm) return

    const { bpm } = (await db.tracks.get(trackId!)) || {}

    const playbackRate = adjustedBpm / (bpm || adjustedBpm)

    // Update waveform playback rate
    waveform.setPlaybackRate(playbackRate)

    // update stem playback rate in realtime
    if (stems) {
      for (const { player } of Object.values(stems)) {
        if (!player) continue

        player.playbackRate = playbackRate
      }
    }

    // Update mixPrefs
    await setTrackPrefs(trackId, { adjustedBpm })
  },

  offset: async (
    trackId: Track['id'],
    adjustedOffset: Track['adjustedOffset']
  ): Promise<void> => {
    await updateTrack(trackId, { adjustedOffset })

    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform) return

    calcMarkers(trackId, waveform)
  },

  setMixpoint: async (
    trackId: Track['id'],
    mixpoint?: string
  ): Promise<void> => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform) return

    audioEvents.pause(trackId)

    const { mixpointTime } = (await getTrackPrefs(trackId)) || {}

    const newMixpoint = convertToSecs(
      mixpoint || timeFormat(waveform.playhead.playheadTime)
    )
    if (newMixpoint == mixpointTime) return

    setTrackPrefs(trackId, { mixpointTime: newMixpoint })
    waveform.seekAndCenter(1 / (waveform.getDuration() / newMixpoint))
  },

  stemVolume: (trackId: Track['id'], stemType: Stem, volume: number) => {
    const [stems] = getAudioState[trackId!].stems()
    if (!stems) return

    // update player volume
    const player = stems[stemType as Stem]?.player
    if (player) player.volume.value = percentageToDb(volume)

    // set volume in state, which in turn will update components (volume sliders)
    setAudioState[trackId!].stems[stemType as Stem].volume(volume)
  },

  stemMuteToggle: (trackId: Track['id'], stemType: Stem, mute: boolean) => {
    const [stems] = getAudioState[trackId!].stems()
    if (!stems) return

    const stem = stems[stemType as Stem]
    const { player, volume } = stem || {}

    // update element volume (not volume in state)
    if (player) player.volume.value = mute ? -3 : percentageToDb(volume || 100)

    // set muted in state, which in turn will update components (volume sliders)
    setAudioState[trackId!].stems[stemType as Stem].mute(mute)
  },

  stemSoloToggle: (trackId: Track['id'], stem: Stem, solo: boolean) => {
    const [stems] = getAudioState[trackId!].stems()
    if (!stems) return

    for (const s of Object.keys(stems)) {
      if (s != stem) audioEvents.stemMuteToggle(trackId, s as Stem, solo)
    }
  },

  destroy: (trackId: Track['id']) => {
    const [{ volumeMeterInterval }] = getAudioState[trackId!]()
    if (volumeMeterInterval) clearInterval(volumeMeterInterval)

    const [{ stems, waveform }] = getAudioState[trackId!]()
    if (!stems || !waveform) return

    for (let { player } of Object.values(stems)) {
      if (!player) continue

      player = player.dispose()
    }

    waveform.destroy()

    // remove audioState
    setAudioState[trackId!]()
  },
}

export { audioEvents }
