// This file allows events to be received which need access to the waveform, rather than passing waveform around
import { Meter, now, start, Transport } from 'tone'
import { getAudioState, setAudioState, setTableState } from '~/api/appState'
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

const MUTE_DB = -60

const percentageToDb = (percentage: number) =>
  (percentage / 100) * -MUTE_DB + MUTE_DB

const decibelToPercentage = (decibel: number) => {
  decibel = Math.max(decibel, MUTE_DB)
  return ((decibel + -MUTE_DB) / -MUTE_DB) * 100
}

const maxDb = (dbArray: number[]) =>
  Math.max(...dbArray.map(decibelToPercentage))

const clearVolumeMeter = (trackId: Track['id']) => {
  const [volumeMeterInterval] =
    getAudioState[Number(trackId)].volumeMeterInterval()
  clearInterval(volumeMeterInterval)
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
  onReady: async (trackId: Track['id'], usingPcm: boolean) => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform) return

    // Generate beat markers and apply them to waveform
    await calcMarkers(trackId, waveform)

    const {
      adjustedBpm,
      mixpointTime,
      beatResolution = 1,
    } = await getTrackPrefs(trackId)

    // Adjust zoom based on previous mixPrefs
    waveform.zoom(beatResolution == 1 ? 80 : beatResolution == 0.5 ? 40 : 20)

    // Set playhead to mixpoint if it exists
    const currentPlayhead =
      mixpointTime || waveform.markers.markers?.[0].time || 0

    if (currentPlayhead) {
      waveform.playhead.setPlayheadTime(currentPlayhead)
      waveform.drawer.recenter(1 / (waveform.getDuration() / currentPlayhead))
    }

    // Adjust playbackrate if bpm has been modified
    if (adjustedBpm) {
      const { bpm } = (await db.tracks.get(trackId!)) || {}
      waveform.setPlaybackRate(adjustedBpm / (bpm || adjustedBpm))
    }

    // Remove analyzing overlay
    setTableState.analyzing(prev => prev.filter(id => id !== trackId))
  },

  play: async (trackId?: Track['id']) => {
    // use the same Tonejs audio context timer for all stems
    await start()
    const contextStartTime = now()

    const [audioState] = getAudioState()

    for (const [id, { waveform }] of Object.entries(audioState)) {
      if (!waveform) continue
      if (trackId && id !== String(trackId)) continue

      // clear any running volume meter timers
      clearVolumeMeter(Number(id))

      // stem volume meters
      const meters: Partial<{ [key in Stem]: Meter }> = {}

      // check for bpm adjustment
      let bpm
      const { adjustedBpm } = await getTrackPrefs(Number(id))
      if (adjustedBpm) {
        ;({ bpm } = (await db.tracks.get(Number(id))) || {})
      }

      // pull players from audioState for synchronized playback
      const [stems] = getAudioState[Number(id)!].stems()

      if (stems) {
        console.log('playing stems', stems)
        for (const [stem, { player }] of Object.entries(stems)) {
          if (!player) continue

          if (adjustedBpm && bpm) player.playbackRate = adjustedBpm / bpm

          // connect Meter for volume monitoring
          const meter = new Meter()
          player.connect(meter)
          meters[stem as Stem] = meter

          player.start(contextStartTime, waveform.getCurrentTime())
        }
      } else waveform.play()

      const startTime = waveform.getCurrentTime()

      // create interval for volume meters
      const newInterval = setInterval(() => {
        const volumes: number[] = []

        for (const [stem, meter] of Object.entries(meters)) {
          const vol = meter.getValue() as number
          volumes.push(vol)
          const volumeMeter = decibelToPercentage(vol)

          // each stem volume is set here
          setAudioState[Number(id)].stems[stem as Stem].volumeMeter(volumeMeter)
        }

        const time = startTime + now() - contextStartTime

        // move the playmarker ahead
        waveform.drawer.progress(1 / (waveform.getDuration() / time))

        // this is the waveform volume meter
        setAudioState[Number(id)].volumeMeter(maxDb(volumes))
        setAudioState[Number(id)].time(time)
      }, 20)

      // store the interval so it can be cleared later
      setAudioState[Number(id)].volumeMeterInterval(newInterval)
      setAudioState[Number(id)].playing(true)
    }
  },

  pause: async (trackId?: Track['id']) => {
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
      const [stems] = getAudioState[Number(id)].stems()
      if (stems) {
        for (const [stem, { player }] of Object.entries(stems)) {
          // set volume meter to zero for the stem
          setAudioState[Number(id)].stems[stem as Stem].volumeMeter(0)

          if (!player) continue
          player.stop(Transport.context.currentTime + 0.1)
        }
      }

      clearVolumeMeter(Number(id))

      setAudioState[Number(id)].volumeMeter(0)
      setAudioState[Number(id)].volumeMeterInterval(-1)
      setAudioState[Number(id)].playing(false)

      audioEvents.seek(Number(id)) // move to closest beat marker (necessary for sync)
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
    // @ts-ignore
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

    // Find the closest marker to the current time
    const currentMarkerIndex = Math.floor(startTime / waveform.skipLength)

    const index =
      currentMarkerIndex + (direction ? (direction == 'next' ? 1 : -1) : 0)

    const { time } = markers[index] || {}

    // Estimate that we're at the right time and move playhead (and center if using prev/next buttons)
    if (time && (time > startTime + 0.005 || time < startTime - 0.005)) {
      if (direction) waveform.skipForward(time - startTime)
      else {
        waveform.playhead.setPlayheadTime(time) // fires a seek event
      }
    } else {
      // if the audio is playing, restart playing when seeking to new time
      if (playing) audioEvents.play(trackId)
    }
  },

  seekMixpoint: async (trackId?: Track['id']) => {
    let tracks
    if (trackId) tracks = [trackId]
    else {
      const [audioState] = getAudioState()
      tracks = Object.keys(audioState)
    }

    for (const trackId of tracks) {
      const { mixpointTime = 0 } = (await getTrackPrefs(Number(trackId))) || {}
      const [{ playing, waveform }] = getAudioState[Number(trackId)]()
      if (!waveform) return

      const time =
        mixpointTime > 0 ? 1 / (waveform.getDuration() / mixpointTime) : 0

      waveform.seekAndCenter(time)

      if (playing) audioEvents.play(Number(trackId))
    }
  },

  onSeek: (trackId: Track['id'], percentageTime: number) => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform) return

    audioEvents.seek(trackId, waveform.getDuration() * percentageTime)
  },

  crossfade: async (sliderVal: number, stemType?: Stem) => {
    const { tracks } = await getPrefs('mix')

    const updateVolume = (trackId: number, volume: number) => {
      const [stems] = getAudioState[trackId].stems()
      if (!stems) return

      for (const stem of Object.keys(stems)) {
        if (stemType && stem != stemType) continue

        if (stems[stem as Stem]!.player)
          stems[stem as Stem]!.player!.volume.value = percentageToDb(volume)
      }
    }

    const sliderPercent = sliderVal / 100

    // Keep volumes at 100% when at 50% crossfade
    let volumes = [
      Math.min(1, 1 + Math.cos(sliderPercent * Math.PI)) * 100,
      Math.min(1, 1 + Math.cos((1 - sliderPercent) * Math.PI)) * 100,
    ]

    if (tracks)
      tracks.forEach((track, i) => {
        if (track) updateVolume(Number(track), volumes[i])
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

    // update element gain (not volume in state)
    if (player) {
      // player volume is in db!
      player.volume.value = mute ? MUTE_DB : percentageToDb(volume || 100)
    }

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
    audioEvents.pause(trackId)

    const [{ stems, waveform }] = getAudioState[trackId!]()

    if (stems) {
      for (let { player } of Object.values(stems)) {
        if (!player) continue

        player = player.dispose()
      }
    }

    if (waveform) waveform.destroy()

    // remove audioState
    setAudioState(prev => {
      delete prev[trackId!]
      return { ...prev }
    })
  },
}

export { audioEvents }
