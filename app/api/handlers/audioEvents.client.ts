// This file allows events to be received which need access to the waveform, rather than passing waveform aroun'
import { ref } from 'valtio'
import type WaveSurfer from 'wavesurfer.js'
import type RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import type { Region } from 'wavesurfer.js/dist/plugins/regions.js'
import { calcMarkers } from '~/api/handlers/audioHandlers.client'
import {
  type Stem,
  type Track,
  _removeFromMix,
  db,
  updateTrack,
  type TrackPrefs,
} from '~/api/handlers/dbHandlers'
import { appState, audioState, mixState } from '~/api/models/appState.client'
import { convertToSecs } from '~/utils/tableOps'

// audioEvent are emitted by controls (e.g. buttons) to signal changes in audio, such as Play, adjust BPM, etc and the listeners are attached to the waveform when it is rendered

const _getAllWaveforms = (): WaveSurfer[] => {
  const waveforms: WaveSurfer[] = []

  for (const { waveform } of Object.values(audioState)) {
    if (!waveform) continue
    waveforms.push(waveform)
  }

  return waveforms
}

const audioEvents = {
  initAudioContext: ({
    trackId,
    stem,
    media,
  }: {
    trackId: Track['id']
    stem?: Stem
    media: HTMLAudioElement
  }) => {
    // audioContext cannot be initialized without user intervention, so this function is called when the audio is played for the first time per track or stem

    // Ensure this function is not called twice for the same track or stem
    const gainExists = stem
      ? audioState[trackId]?.stems?.[stem as Stem]?.gainNode
      : audioState[trackId]?.gainNode

    if (gainExists) return

    let audioContext = appState.audioContext
    if (!audioContext) {
      audioContext = new AudioContext()
      appState.audioContext = ref(audioContext)
    }

    // gainNode is used to control volume of all stems at once
    const gainNode = audioContext.createGain()
    gainNode.connect(audioContext.destination)

    const analyserNode = audioContext.createAnalyser()

    // Connect the audio to the analyzer
    media.addEventListener(
      'play',
      async () => {
        // Create a MediaElementSourceNode from the audio element
        const mediaNode = audioContext?.createMediaElementSource(media)

        mediaNode?.connect(gainNode)
        mediaNode?.connect(analyserNode)
      },
      { once: true }
    )

    // Save waveform in audioState to track user interactions with the waveform and show progress
    if (stem && audioState[trackId]?.stems?.[stem]) {
      //@ts-ignore doesn't understand null check
      audioState[trackId].stems[stem].gainNode = ref(gainNode)
      //@ts-ignore doesn't understand null check
      audioState[trackId].stems[stem].analyserNode = ref(analyserNode)
    } else {
      audioState[trackId].gainNode = ref(gainNode)
      audioState[trackId].analyserNode = ref(analyserNode)
    }
  },
  onReady: async (waveform: WaveSurfer, trackId: Track['id'], stem?: Stem) => {
    // Save waveform in audioState
    if (stem) {
      // Remove from stemsAnalyzing
      appState.stemsAnalyzing.delete(trackId)

      if (audioState[trackId]?.stems?.[stem as Stem]) {
        //@ts-ignore doesn't understand null check
        audioState[trackId].stems[stem as Stem].waveform = ref(waveform)
      }
    } else {
      audioState[trackId].waveform = ref(waveform)

      // Generate beat markers (regions) and apply them to waveform
      await calcMarkers(trackId)
      const plugins = waveform.getActivePlugins()
      const regionsPlugin = plugins[0] as RegionsPlugin
      const { mixpointTime, beatResolution = 1 } =
        mixState.trackPrefs[trackId] || {}
      // Adjust zoom based on previous mixPrefs
      waveform.zoom(
        beatResolution === '1:1' ? 80 : beatResolution === '1:2' ? 40 : 20
      )
      // Remove analyzing overlay
      appState.analyzing.delete(trackId)
      // Style scrollbar (this is a workaround for https://github.com/katspaugh/wavesurfer.js/issues/2933)
      const style = document.createElement('style')
      style.textContent = `::-webkit-scrollbar {
      	height: 18px;
      }
      ::-webkit-scrollbar-corner, ::-webkit-scrollbar-track {
      	border-top: 1px solid rgba(128,128,128,.3);
      }
      ::-webkit-scrollbar-thumb {
      	background-color: rgba(4, 146, 247, 0.5);
      	border-radius: 8px;
      	border: 6px solid transparent;
      	width: 15%;
      	background-clip: content-box;
      }`
      //waveform.getWrapper().appendChild(style)
      // add classname value to waveform.getWrapper()
      waveform.getWrapper().classList.add('wrapper')
      // Update time
      let time = audioState[trackId]?.time
      if (!time) {
        time = mixpointTime || regionsPlugin.getRegions()[0]?.start || 0
        audioState[trackId].time = time
      }

      // if zoom is set to a stem, use the stem cache to redraw the primary waveform with the stem
      // const { stemZoom } = (await getTrackPrefs(trackId)) || {}
      // console.log('stemzoom:', stemZoom)
      // if (stemZoom) audioEvents.stemZoom(trackId, stemZoom)

      // account for resize of browser window
      waveform.on('redraw', () => audioEvents.seek(trackId))
    }

    // Update BPM if adjusted
    const { adjustedBpm } = mixState.trackPrefs[trackId] || {}
    const { bpm = 1 } = (await db.tracks.get(trackId)) || {}
    const playbackRate = (adjustedBpm || bpm) / bpm
    waveform.setPlaybackRate(playbackRate)
  },

  clickToSeek: async (
    trackId: Track['id'],
    e: React.MouseEvent,
    parentElement: HTMLElement
  ) => {
    // get click position of parent element and convert to time
    const shadowRoot = parentElement.shadowRoot as ShadowRoot
    const wrapper = shadowRoot.querySelector('.wrapper') as HTMLElement
    const scrollbar = shadowRoot.querySelector('.scroll') as HTMLElement
    const boundary = wrapper.getBoundingClientRect()
    const position = Math.min(
      1,
      (e.clientX +
        scrollbar.scrollLeft -
        Math.abs(scrollbar.scrollLeft - Math.abs(boundary.x))) /
        boundary.width
    )

    const { duration = 1 } = (await db.tracks.get(trackId)) || {}

    audioEvents.seek(trackId, duration * position)
  },

  ejectTrack: async (trackId: Track['id']) => {
    if (!trackId) return

    audioEvents.pause(trackId)

    // Destroy waveform and stems before removing from audioState
    audioEvents.destroy(trackId)
    audioEvents.destroyStems(trackId)

    // Remove track from mix state (dexie)
    await _removeFromMix(trackId)

    // Remove track from audioState (valtio)
    delete audioState[trackId]

    // If this is not the last track in the mix, open drawer, otherwise the drawer will open automatically
    const mixViewVisible = !!mixState.tracks?.filter(t => t).length

    if (mixViewVisible) appState.openDrawer = true
  },

  play: async (trackId?: Track['id']) => {
    let tracks = []
    if (!trackId) {
      // pull players from audioState to play all
      tracks = Object.keys(audioState).map(Number)
    } else tracks = [trackId]

    // synchronize playback of all tracks
    audioEvents.playSync(tracks.filter(id => !!id))
  },

  playSync: async (trackIds: Track['id'][]) => {
    // Sync all waveforms to the same position
    let syncTimer = appState.syncTimer
    if (syncTimer) cancelAnimationFrame(syncTimer)

    const dataArray = new Uint8Array(2048) // fftSize

    const getVolume = (analyserNode: AnalyserNode) => {
      analyserNode.getByteTimeDomainData(dataArray)
      return (Math.max(...dataArray) - 128) / 128
    }

    // setup sync loop
    const syncLoop = () => {
      syncTimer = requestAnimationFrame(syncLoop)
      appState.syncTimer = syncTimer

      // for volume meters
      for (const trackId of trackIds) {
        const { stems, analyserNode } = audioState[trackId]

        const volumes: number[] = [] // to aggregate for main volume meter

        let waveform: WaveSurfer | undefined
        if (stems) {
          for (const [stem, { analyserNode }] of Object.entries(stems)) {
            if (analyserNode) {
              const vol = getVolume(analyserNode)
              volumes.push(vol)
              if (audioState[trackId]?.stems?.[stem as Stem]) {
                //@ts-ignore doesn't understand null check
                audioState[trackId].stems[stem as Stem].volumeMeter = vol
              }
            }
          }
          waveform = stems.drums?.waveform
        } else {
          if (analyserNode) volumes.push(getVolume(analyserNode))
          waveform = audioState[trackId].waveform
        }

        // aggregate stem volumes for main volume meter
        audioState[trackId].volumeMeter = Math.max(...volumes)
        audioState[trackId].time = waveform?.getCurrentTime() // for track timer, not play position
      }
    }

    syncTimer = requestAnimationFrame(syncLoop)

    for (const trackId of trackIds) {
      const { waveform, stems } = audioState[trackId]
      if (!waveform) continue

      audioState[trackId].playing = true

      audioEvents.initAudioContext({
        trackId,
        media: waveform.getMediaElement(),
      })

      waveform.play()

      if (stems) {
        // if we have stems, mute the main waveforms
        waveform.setVolume(0)

        for (const [stem, { waveform: stemWaveform }] of Object.entries(
          stems
        )) {
          if (stemWaveform) {
            audioEvents.initAudioContext({
              trackId,
              stem: stem as Stem,
              media: stemWaveform.getMediaElement(),
            })
            stemWaveform.play()
          }
        }
      }
    }
  },

  pause: async (trackId?: Track['id']) => {
    // this needs to pause all stems so requires a bit of logic
    let waveforms = []
    let trackIds = []

    if (appState.syncTimer) cancelAnimationFrame(appState.syncTimer)

    if (trackId) {
      const waveform = audioState[trackId]?.waveform
      waveforms = [waveform]
      trackIds = [trackId]
    } else {
      waveforms = _getAllWaveforms()
      trackIds = Object.keys(audioState)
    }

    const stopWaveform = (waveform: WaveSurfer) => waveform.pause()

    for (const waveform of waveforms) {
      if (waveform) stopWaveform(waveform)
    }

    for (const id of trackIds) {
      const stems = audioState[Number(id)].stems
      if (stems) {
        for (const [stem, { waveform }] of Object.entries(stems)) {
          // set volume meter to zero for the stem
          if (stems[stem as Stem]) {
            stems[stem as Stem].volumeMeter = 0
          }

          if (waveform) stopWaveform(waveform)
        }
      }
      audioState[Number(id)].playing = false
      audioState[Number(id)].volumeMeter = 0
    }
  },

  // Scroll to previous/next beat marker
  seek: async (
    trackId: Track['id'],
    seconds?: number, // no default here, we want to be able to seek to 0
    direction?: 'previous' | 'next'
  ) => {
    if (!trackId) return

    const { waveform, playing, time = 0 } = audioState[trackId]
    if (!waveform) return
    console.log('seek')
    const currentTime = seconds ?? time
    if (playing) await audioEvents.pause(trackId)

    const { duration = 1 } = (await db.tracks.get(trackId)) || {}

    const regionsPlugin = waveform.getActivePlugins()[0] as RegionsPlugin

    // find the closest marker to the current time
    const regions = regionsPlugin.getRegions()

    const findClosestRegion = (time: number) => {
      return regions.findIndex((region: Region) => {
        if (region.start > time) return true
      })
    }

    let currentIndex = findClosestRegion(!direction ? currentTime : time)
    currentIndex = currentIndex === -1 ? regions.length - 1 : currentIndex

    const previous = regions[(currentIndex || 1) - 1]
    const current = regions[currentIndex]
    const next = regions[Math.min(currentIndex, regions.length - 2) + 1]

    const previousDiff = Math.abs(currentTime - previous.start)
    const currentDiff = Math.abs(currentTime - current.start)
    const nextDiff = Math.abs(currentTime - next.start)

    let closestTime = current.start // default current wins
    if (direction) {
      closestTime =
        direction === 'previous'
          ? regions[Math.max(currentIndex - 2, 0)].start
          : current.start
    } else if (previousDiff < currentDiff) {
      // previous wins
      if (currentDiff < nextDiff) {
        // previous wins
        closestTime = previous.start
      } else {
        if (previousDiff < nextDiff) {
          // previous wins
          closestTime = previous.start
        } else {
          // next wins
          closestTime = next.start
        }
      }
    }

    audioState[trackId].time = closestTime

    const stems = audioState[trackId].stems

    if (stems) {
      for (const [, { waveform: stemWave }] of Object.entries(stems)) {
        stemWave?.seekTo(closestTime / duration)
      }
    }

    waveform.seekTo(closestTime / duration)

    // resume playing if not at the end of track
    if (playing && closestTime < duration) audioEvents.play(trackId)
  },

  seekMixpoint: async (trackId: Track['id']) => {
    const { mixpointTime = 0 } = mixState.trackPrefs[trackId] || {}
    audioEvents.seek(trackId, mixpointTime)
  },

  // crossfade handles the sliders that mix between stems or full track
  crossfade: async (sliderVal: number, stemType?: Stem) => {
    const sliderPercent = sliderVal / 100

    // Keep volumes at 100% when at 50% crossfade
    // [left, right] @ 0% = [1, 0] 50% = [1, 1] 100% = [0, 1]
    const volumes = [
      Math.min(1, 1 + Math.cos(sliderPercent * Math.PI)),
      Math.min(1, 1 + Math.cos((1 - sliderPercent) * Math.PI)),
    ]

    if (mixState.tracks.length) {
      for (const [i, track] of mixState.tracks.entries()) {
        if (track) audioEvents.updateVolume(Number(track), volumes[i], stemType)
      }
    }
  },

  updateVolume: (trackId: number, volume: number, stemType?: Stem) => {
    const {
      volume: trackVol = 1,
      stems,
      gainNode,
      stemState,
    } = audioState[trackId]

    // if we have a stemType, this is a stem crossfader
    if (stemType) {
      if (!stems) return

      // adjust the gain of the stem as a percentage of the track volume
      // (75% crossfader x 50% stem fader = 37.5% stem volume)
      const stemGain = stems[stemType]?.gainNode
      stemGain?.gain.setValueAtTime(trackVol * volume, 0)
      if (audioState[trackId].stems?.[stemType]) {
        //@ts-ignore doesn't understand null check
        audioState[trackId].stems[stemType].volume = volume
      }
      return
    }

    // otherwise this is main crossfader
    if (stemState !== 'ready') {
      gainNode?.gain.setValueAtTime(volume, 0)
    } else if (stems) {
      for (const stem of Object.keys(stems)) {
        const stemGain = audioState[trackId]?.stems?.[stem as Stem]?.gainNode
        const stemVol = audioState[trackId]?.stems?.[stem as Stem]?.volume || 1

        // adjust the gain of the stem as a percentage of the track volume
        // (75% crossfader x 50% stem fader = 37.5% stem volume)
        stemGain?.gain.setValueAtTime(trackVol * stemVol, 0)
      }
      audioState[trackId].volume = volume
    }
  },

  beatResolution: async (
    trackId: Track['id'],
    beatResolution: TrackPrefs['beatResolution']
  ): Promise<void> => {
    const waveform = audioState[trackId]?.waveform
    if (!waveform || !beatResolution) return

    // Update mixState
    mixState.trackPrefs[trackId].beatResolution = beatResolution

    await calcMarkers(trackId)

    // Adjust zoom
    switch (beatResolution) {
      case '1:4':
        waveform.zoom(20)
        break
      case '1:2':
        waveform.zoom(40)
        break
      case '1:1':
        waveform.zoom(80)
        break
    }
  },

  bpm: async (
    trackId: Track['id'],
    adjustedBpm: TrackPrefs['adjustedBpm']
  ): Promise<void> => {
    const { stems, waveform, playing } = audioState[trackId]
    if (!adjustedBpm) return

    const { bpm } = (await db.tracks.get(trackId)) || {}

    const playbackRate = adjustedBpm / (bpm || adjustedBpm)

    if (playing) audioEvents.pause(trackId)

    const adjustPlaybackRate = (waveform: WaveSurfer) =>
      waveform.setPlaybackRate(playbackRate)

    // update stem playback rate in realtime
    if (stems) {
      for (const { waveform } of Object.values(stems)) {
        if (!waveform) continue

        adjustPlaybackRate(waveform)
      }
    } else {
      if (waveform) adjustPlaybackRate(waveform)
    }

    if (playing) audioEvents.play(trackId)

    // Update mixState
    mixState.trackPrefs[trackId].adjustedBpm = adjustedBpm
  },

  offset: async (
    trackId: Track['id'],
    adjustedOffset: Track['adjustedOffset']
  ): Promise<void> => {
    await updateTrack(trackId, { adjustedOffset })

    calcMarkers(trackId)
  },

  setMixpoint: async (
    trackId: Track['id'],
    mixpoint?: string
  ): Promise<void> => {
    const waveform = audioState[trackId]?.waveform
    if (!waveform) return

    audioEvents.pause(trackId)

    const time = audioState[trackId]?.time || 0
    const { mixpointTime = 0 } = mixState.trackPrefs[trackId] || {}

    const newMixpoint = mixpoint ? convertToSecs(mixpoint) : time
    if (newMixpoint === mixpointTime) return

    mixState.trackPrefs[trackId].mixpointTime = newMixpoint

    audioEvents.seek(trackId, newMixpoint)
  },

  stemVolume: (trackId: Track['id'], stemType: Stem, volume: number) => {
    const stems = audioState[trackId]?.stems
    if (!stems) return

    const gainNode = stems[stemType as Stem]?.gainNode
    if (gainNode) gainNode.gain.setValueAtTime(volume, 0)

    // set volume in state, which in turn will update components (volume sliders)
    if (audioState[trackId].stems?.[stemType]) {
      //@ts-ignore doesn't understand null check
      audioState[trackId].stems[stemType].volume = volume
    }
  },

  stemMuteToggle: (trackId: Track['id'], stemType: Stem, mute: boolean) => {
    const stems = audioState[trackId]?.stems
    if (!stems) return

    const stem = stems[stemType as Stem]
    const { gainNode, volume } = stem || {}

    gainNode?.gain.setValueAtTime(mute ? 0 : volume || 1, 0)
    if (audioState[trackId].stems?.[stemType as Stem]) {
      //@ts-ignore doesn't understand null check
      audioState[trackId].stems[stemType as Stem].mute = mute
    }
  },

  stemSoloToggle: (trackId: Track['id'], stem: Stem, solo: boolean) => {
    const stems = audioState[trackId]?.stems
    if (!stems) return

    for (const s of Object.keys(stems)) {
      if (s !== stem) audioEvents.stemMuteToggle(trackId, s as Stem, solo)
    }
  },

  stemZoom: async (
    trackId: Track['id'],
    stem: TrackPrefs['stemZoom'] | 'all'
  ) => {
    // add track to analyzing state
    appState.analyzing.add(trackId)

    const oldWaveform = audioState[trackId]?.waveform
    if (oldWaveform) audioEvents.destroy(trackId)

    let file: File | undefined

    if (stem === 'all') {
      ;({ file } = (await db.trackCache.get(trackId)) || {})
    } else {
      const { stems } = (await db.trackCache.get(trackId)) || {}
      if (!stems) return

      file = stems[stem as Stem]?.file
    }

    if (!file) return

    //await initWaveform({ trackId, file })

    mixState.trackPrefs[trackId].stemZoom = stem === 'all' ? undefined : stem

    const { waveform, time = 0, playing } = audioState[trackId]
    if (waveform) {
      waveform.setVolume(0)
      waveform.setTime(time)
      if (playing) waveform.play()
    }
  },

  destroy: (trackId: Track['id']) => {
    const waveform = audioState[trackId]?.waveform
    if (waveform) waveform.destroy()
  },

  destroyStems: (trackId: Track['id']) => {
    const stems = audioState[trackId]?.stems

    if (stems) {
      for (const stem of Object.values(stems)) {
        stem?.waveform?.destroy()
      }
    }

    // Remove from stemsAnalyzing
    appState.stemsAnalyzing.delete(trackId)
  },
}

export { audioEvents }
