// This file allows events to be received which need access to the waveform, rather than passing waveform around
import { Meter, now, PitchShift, Player, start, Transport } from 'tone'
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

const clearVolumeMeter = (trackId: Track['id']) => {
  const [volumeMeterInterval] =
    getAudioState[Number(trackId)].volumeMeterInterval()
  clearInterval(volumeMeterInterval)
}

const _getAllPlayers = (): Player[] => {
  const [audioState] = getAudioState()

  let players: Player[] = []

  for (const { player } of Object.values(audioState)) {
    if (!player) continue
    players.push(player)
  }

  return players
}

const audioEvents = {
  onReady: async (trackId: Track['id'], stem?: Stem) => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform) return

    const {
      adjustedBpm,
      mixpointTime,
      beatResolution = 1,
    } = await getTrackPrefs(trackId)

    if (!stem) {
      // Generate beat markers and apply them to waveform
      await calcMarkers(trackId, waveform)

      // Adjust zoom based on previous mixPrefs
      waveform.zoom(beatResolution == 1 ? 80 : beatResolution == 0.5 ? 40 : 20)

      // Remove analyzing overlay
      setTableState.analyzing(prev => prev.filter(id => id !== trackId))
    }

    // Adjust playbackrate if bpm has been modified
    if (adjustedBpm) {
      const { bpm } = (await db.tracks.get(trackId!)) || {}
      waveform.setPlaybackRate(adjustedBpm / (bpm || adjustedBpm))
    }

    // Update time
    const time = mixpointTime || waveform.markers.markers?.[0]?.time || 0
    setAudioState[trackId!].time(time)

    audioEvents.seek(trackId, time)
  },

  play: async (trackId?: Track['id']) => {
    // use the same Tonejs audio context timer for all stems
    await start()
    const contextStartTime = now()

    const [audioState] = getAudioState()
    const { duration = 1 } = (await db.tracks.get(trackId!)) || {}

    for (const [id, { waveform, player, time = 0 }] of Object.entries(
      audioState
    )) {
      if (!waveform || !player || (trackId && id !== String(trackId))) continue

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

      const addMeter = (player: Player, stem?: Stem) => {
        // connect Meter for volume monitoring
        const meter = new Meter({ normalRange: true })
        player.connect(meter)
        meters[(stem as Stem) || 'main'] = meter
        return player
      }

      if (stems) {
        for (const [stem, { player }] of Object.entries(stems)) {
          if (!player) continue

          addMeter(player, stem as Stem)

          player.start(contextStartTime, time)
        }
      } else {
        if (adjustedBpm && bpm) player.playbackRate = adjustedBpm / bpm
        addMeter(player)
        player.start(contextStartTime, time)
      }

      // create interval for volume meters and drawer progress
      const newInterval: ReturnType<typeof setInterval> | number = setInterval(
        () => {
          if (!setAudioState[Number(id)]) return clearInterval(newInterval)

          const volumes: number[] = []

          for (const [stem, meter] of Object.entries(meters)) {
            const vol = meter.getValue() as number
            volumes.push(vol)

            // each stem volume is set here
            if (stem != 'main')
              setAudioState[Number(id)].stems[stem as Stem].volumeMeter(vol)
          }
          console.log('update volume on ', id, volumes)
          // this is the waveform volume meter
          setAudioState[Number(id)].volumeMeter(Math.max(...volumes))

          // update track timer
          const startTime =
            ((time || 0) + now() - contextStartTime) * player.playbackRate
          setAudioState[Number(id)].time(startTime)

          // pause if we're at the end of the track
          const drawerTime = 1 / (duration / startTime) || 0
          if (drawerTime >= 1) audioEvents.pause(Number(id))

          // update waveform and minimap progress
          waveform.drawer.progress(drawerTime)
          //@ts-ignore - minimap does indeed have a drawer.progress method
          waveform.minimap.drawer.progress(drawerTime)
        },
        20
      )

      // store the interval so it can be cleared later
      setAudioState[Number(id)].volumeMeterInterval(newInterval)
      setAudioState[Number(id)].playing(true)
    }
  },

  pause: async (trackId?: Track['id']) => {
    let players, trackIds
    if (trackId) {
      const [player] = getAudioState[trackId].player()
      players = [player]
      trackIds = [trackId]
    } else {
      players = _getAllPlayers()
      const [audioState] = getAudioState()
      trackIds = Object.keys(audioState)
    }

    for (const player of players) {
      if (player) player.stop(Transport.context.currentTime + 0.1)
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
    }
  },

  mute: (trackId: Track['id']) => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (waveform) waveform.setMute(true)
  },

  // onSeek is the handler for the WaveSurfer 'seek' event
  onSeek: (trackId: Track['id'], percentageTime: number) => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform) return

    audioEvents.seek(trackId, waveform.getDuration() * percentageTime)
  },

  // Scroll to previous/next beat marker
  seek: async (
    trackId: Track['id'],
    startTime?: number,
    direction?: 'previous' | 'next'
  ) => {
    const [{ waveform, playing, time: trackTime }] = getAudioState[trackId!]()
    if (!waveform) return

    if (playing) await audioEvents.pause(trackId)

    const { markers = [] } = waveform.markers || {}

    startTime = startTime || trackTime || 1

    const skipLength = markers[1]?.time - markers[0]?.time

    // Find the closest marker to the current time
    const currentMarkerIndex = Math.floor(startTime / skipLength) || 0

    const newIndex =
      currentMarkerIndex + (direction ? (direction == 'next' ? 1 : -1) : 0)

    const { time } = markers[newIndex] || {}

    // avoid looping if the time is within 5ms of the current time
    if (time && (time > startTime + 0.005 || time < startTime - 0.005)) {
      waveform.playhead.setPlayheadTime(time)
      setAudioState[trackId!].time(time)
    }

    if (playing) audioEvents.play(trackId)

    const { duration = 1 } = (await db.tracks.get(trackId!)) || {}
    if (waveform) {
      // TODO: this should probably not be in the TrackTime component :/
      const drawerTime = 1 / (duration / time) || 0

      if (drawerTime >= 1) audioEvents.pause(trackId!)

      waveform.drawer.progress(drawerTime)
      //@ts-ignore - minimap does indeed have a drawer.progress method
      waveform.minimap.drawer.progress(drawerTime)
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

  // crossfade handles the sliders that mix between stems or full track
  crossfade: async (sliderVal: number, stemType?: Stem) => {
    const { tracks } = await getPrefs('mix')

    const sliderPercent = sliderVal / 100

    // Keep volumes at 100% when at 50% crossfade
    // [left, right] @ 0% = [1, 0] 50% = [1, 1] 100% = [0, 1]
    let volumes = [
      Math.min(1, 1 + Math.cos(sliderPercent * Math.PI)),
      Math.min(1, 1 + Math.cos((1 - sliderPercent) * Math.PI)),
    ]

    tracks?.forEach((track, i) => {
      if (track) audioEvents.updateVolume(Number(track), volumes[i], stemType)
    })
  },

  updateVolume: (trackId: number, volume: number, stemType?: Stem) => {
    const [{ volume: trackVol = 1, stems, gainNode, stemState }] =
      getAudioState[trackId]()
    const currentTime = now()

    // if we have a stemType, this is a stem crossfader
    if (stemType) {
      if (!stems) return

      // adjust the gain of the stem as a percentage of the track volume
      // (75% crossfader x 50% stem fader = 37.5% stem volume)
      const stemGain = stems[stemType]?.gainNode
      stemGain?.gain.setValueAtTime(trackVol * volume, currentTime)
      setAudioState[trackId].stems[stemType].volume(volume)
      return
    }

    // otherwise this is main crossfader
    if (stemState !== 'ready') {
      gainNode?.gain.setValueAtTime(volume, currentTime)
    } else if (stems) {
      for (const stem of Object.keys(stems)) {
        const [stemGain] = getAudioState[trackId].stems[stem as Stem].gainNode()
        const [stemVol = 1] =
          getAudioState[trackId].stems[stem as Stem].volume()

        // adjust the gain of the stem as a percentage of the track volume
        // (75% crossfader x 50% stem fader = 37.5% stem volume)
        stemGain?.gain.setValueAtTime(trackVol * stemVol, currentTime)
      }

      setAudioState[trackId].volume(volume)
    }
  },

  beatResolution: async (
    trackId: Track['id'],
    beatResolution: TrackPrefs['beatResolution']
  ): Promise<void> => {
    const [waveform] = getAudioState[trackId!].waveform()
    if (!waveform || !beatResolution) return

    // Update mixPrefs
    await setTrackPrefs(trackId, { beatResolution })

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

    calcMarkers(trackId, waveform)
  },

  bpm: async (
    trackId: Track['id'],
    adjustedBpm: TrackPrefs['adjustedBpm']
  ): Promise<void> => {
    const [{ stems, waveform, player }] = getAudioState[trackId!]()
    if (!waveform || !adjustedBpm) return

    const { bpm } = (await db.tracks.get(trackId!)) || {}

    const playbackRate = adjustedBpm / (bpm || adjustedBpm)

    // update stem playback rate in realtime
    if (stems) {
      for (const { player } of Object.values(stems)) {
        if (!player) continue

        player.playbackRate = playbackRate
      }
    } else {
      if (player) player.playbackRate = playbackRate
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

    const gainNode = stems[stemType as Stem]?.gainNode
    if (gainNode) gainNode.gain.setValueAtTime(volume, now())

    // set volume in state, which in turn will update components (volume sliders)
    setAudioState[trackId!].stems[stemType as Stem].volume(volume)
  },

  stemMuteToggle: (trackId: Track['id'], stemType: Stem, mute: boolean) => {
    const [stems] = getAudioState[trackId!].stems()
    if (!stems) return

    const stem = stems[stemType as Stem]
    const { gainNode, volume } = stem || {}

    gainNode?.gain.setValueAtTime(mute ? 0 : volume || 1, now())

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
    const [waveform] = getAudioState[trackId!].waveform()
    if (waveform) waveform.destroy()
  },
}

export { audioEvents }
