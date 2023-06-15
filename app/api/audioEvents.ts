// This file allows events to be received which need access to the waveform, rather than passing waveform around
// @ts-ignore until https://github.com/katspaugh/wavesurfer.js/issues/2877
import type WaveSurfer from 'wavesurfer.js'
// @ts-ignore until https://github.com/katspaugh/wavesurfer.js/issues/2877
import type MinimapPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import type {
	Region,
	RegionsPlugin
	// @ts-ignore until https://github.com/katspaugh/wavesurfer.js/issues/2877
} from 'wavesurfer.js/dist/plugins/regions.js'
import {
	getAppState,
	getAudioState,
	setAppState,
	setAudioState
} from '~/api/appState'
import { calcMarkers } from '~/api/audioHandlers'
import {
	Stem,
	Track,
	TrackPrefs,
	_removeFromMix,
	db,
	getPrefs,
	getTrackPrefs,
	setTrackPrefs,
	updateTrack
} from '~/api/db/dbHandlers'
import { convertToSecs, timeFormat } from '~/utils/tableOps'

// audioEvent are emitted by controls (e.g. buttons) to signal changes in audio, such as Play, adjust BPM, etc and the listeners are attached to the waveform when it is rendered

type MultiSyncTrack = {
	trackId: Track['id']
	duration: number
	mixpointTime: TrackPrefs['mixpointTime']
	media: HTMLAudioElement[]
	getWrapper: Function
}

const clearVolumeMeter = (trackId: Track['id']) => {
	setAudioState[Number(trackId)].volumeMeter(0)
}

const _getAllWaveforms = (): WaveSurfer[] => {
	const [audioState] = getAudioState()

	const waveforms: WaveSurfer[] = []

	for (const { waveform } of Object.values(audioState)) {
		if (!waveform) continue
		waveforms.push(waveform)
	}

	return waveforms
}

const audioEvents = {
	onReady: async (trackId: Track['id'], stem?: Stem) => {
		const [waveform] = getAudioState[trackId].waveform()
		if (!waveform) return

		const plugins = waveform.getActivePlugins()
		const regionspPlugin = plugins.find(
			(plugin: RegionsPlugin) => plugin.regions
		)

		const minimapPlugin = plugins.find(
			(plugin: MinimapPlugin) => plugin.miniWavesurfer
		)

		if (minimapPlugin) {
			minimapPlugin.miniWavesurfer.on('interaction', (time: number) =>
				audioEvents.seek(trackId, time)
			)
		}

		const { mixpointTime, beatResolution = 1 } = await getTrackPrefs(trackId)

		if (!stem) {
			// Generate beat markers and apply them to waveform
			await calcMarkers(trackId)

			// Adjust zoom based on previous mixPrefs
			waveform.zoom(
				beatResolution === 1 ? 80 : beatResolution === 0.5 ? 40 : 20
			)

			// Remove analyzing overlay
			setAppState.analyzing((prev) => prev.filter((id) => id !== trackId))
		} else {
			setAppState.stemsAnalyzing((prev) => prev.filter((id) => id !== trackId))
		}

		// Update time
		const time = mixpointTime || regionspPlugin.regions?.[0]?.start || 0
		setAudioState[trackId].time(time)

		const { adjustedBpm } = await getTrackPrefs(trackId)
		const { bpm = 1 } = (await db.tracks.get(trackId)) || {}
		const playbackRate = (adjustedBpm || bpm) / bpm
		waveform.setPlaybackRate(playbackRate)

		audioEvents.seek(trackId, time)
	},

	clickToSeek: async (trackId: Track['id'], e: React.MouseEvent) => {
		// get click position of parent element and convert to time
		const parent = e.currentTarget.firstElementChild as HTMLElement
		const shadowRoot = parent.shadowRoot as ShadowRoot
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

		// If this is not the last track in the mix, open drawer, otherwise the drawer will open automatically
		const { tracks = [] } = await getPrefs('mix')
		if (tracks.length > 1) setAppState.openDrawer(true)

		audioEvents.pause(trackId)

		// Destroy waveform and stems before removing from audioState
		audioEvents.destroy(trackId)

		// Remove track from mix state (dexie)
		await _removeFromMix(trackId)

		// Remove track from audioState (teaful)
		const [audioState] = getAudioState()
		const { [trackId]: _, ...rest } = audioState
		setAudioState(rest)
	},

	updateVolumeMeter: (trackId: Track['id']) => {
		const volumes: number[] = []

		const [stems] = getAudioState[trackId].stems()

		if (stems) {
			for (const [stem, { waveform }] of Object.entries(stems)) {
				if (!waveform) continue
				const vol = waveform.getVolume()
				volumes.push(vol)
				setAudioState[trackId].stems[stem as Stem].volumeMeter(vol)
			}
		} else {
			const [waveform] = getAudioState[trackId].waveform()
			volumes.push(waveform.getVolume())
		}

		// this is the waveform volume meter
		setAudioState[trackId].volumeMeter(Math.max(...volumes))
	},

	play: async (trackId: Track['id']) => {
		// stem volume meters
		//const meters: Partial<{ [key in Stem]: Meter }> = {}
		// pull players from audioState for synchronized playback
		const { tracks = [trackId] } = await getPrefs('mix')

		for (const trackId of tracks) {
			setAudioState[trackId].playing(true)
		}

		audioEvents.multiSync(tracks)
	},

	updatePosition: (track: MultiSyncTrack, syncTime: number) => {
		const precisionSeconds = 0.1

		const [{ playing, time = 0 }] = getAudioState[track.trackId]()

		if (Math.abs(syncTime - time) > 0.05) {
			setAudioState[track.trackId].time(syncTime)
		}

		// Update the current time of each audio
		for (const audio of track.media) {
			const newTime = syncTime - (track.mixpointTime || 0)

			if (Math.abs(audio.currentTime - newTime) > precisionSeconds) {
				audio.currentTime = newTime
			}

			// If the position is out of the track bounds, pause it
			if (!playing || newTime < 0 || newTime > track.duration) {
				!audio.paused && audio.pause()
			} else if (playing) {
				// If the position is in the track bounds, play it
				audio.paused && audio.play()
			}
		}
	},

	multiSync: async (trackIds: Track['id'][]) => {
		// Sync all waveforms to the same position

		// Collect audio data to use for sync
		const tracks: MultiSyncTrack[] = []

		for (const [index, trackId] of trackIds.entries()) {
			const { mixpointTime } = await getTrackPrefs(trackId)
			const { duration = 1 } = (await db.tracks.get(trackId)) || {}
			const [{ waveform, stems }] = getAudioState[trackId]()

			if (!waveform) continue

			// if we have stems, mute the main waveform
			if (stems) waveform.media.volume = 0

			tracks.push({
				trackId,
				duration,
				mixpointTime,
				media: [waveform.media],
				getWrapper: waveform.getWrapper.bind(waveform)
			})

			if (stems) {
				for (const [, { waveform }] of Object.entries(stems)) {
					if (waveform) tracks[index].media.push(waveform.media)
				}
			}
		}

		const onFrame = () => {
			for (const track of tracks) {
				const [time = 0] = getAudioState[track.trackId].time()
				const syncTime = track.media.reduce<number>((pos, audio) => {
					let position = pos
					if (!audio.paused) {
						position = Math.max(
							pos,
							audio.currentTime + (track.mixpointTime || 0)
						)
					}
					return position
				}, time)

				if (syncTime > time) {
					audioEvents.updatePosition(track, syncTime)
				}
			}

			const frameRequest = requestAnimationFrame(onFrame)
			setAppState.multiSyncAnimation(frameRequest)
		}

		onFrame()

		for (const track of tracks) {
			for (const audio of track.media) {
				audio.play()
			}
		}
	},

	pause: async (trackId?: Track['id']) => {
		// this needs to pause all stems so requires a bit of logic
		let waveforms
		let trackIds

		if (trackId) {
			const [waveform] = getAudioState[trackId].waveform()
			waveforms = [waveform]
			trackIds = [trackId]
		} else {
			waveforms = _getAllWaveforms()
			const [audioState] = getAudioState()
			trackIds = Object.keys(audioState)
		}

		const stopWaveform = (waveform: WaveSurfer) => waveform.pause()

		for (const waveform of waveforms) {
			if (waveform) stopWaveform(waveform)
		}

		for (const id of trackIds) {
			const [stems] = getAudioState[Number(id)].stems()
			if (stems) {
				for (const [stem, { waveform }] of Object.entries(stems)) {
					// set volume meter to zero for the stem
					setAudioState[Number(id)].stems[stem as Stem].volumeMeter(0)

					if (waveform) stopWaveform(waveform)
				}
			}

			clearVolumeMeter(Number(id))
			setAudioState[Number(id)].playing(false)
		}

		// stop multi-sync animation
		const [sync] = getAppState.multiSyncAnimation()
		if (sync) cancelAnimationFrame(sync)
	},

	mute: (trackId: Track['id']) => {
		const [waveform] = getAudioState[trackId].waveform()
		if (waveform) waveform.setMute(true)
	},

	// Scroll to previous/next beat marker
	seek: async (
		trackId: Track['id'],
		seconds: number, // no default here, we want to be able to seek to 0
		direction?: 'previous' | 'next'
	) => {
		if (!trackId) return

		const [{ waveform, playing, time = 0 }] = getAudioState[trackId]()
		if (!waveform) return

		if (playing) await audioEvents.pause(trackId)

		const { duration = 1 } = (await db.tracks.get(trackId)) || {}

		const regionsPlugin = waveform
			.getActivePlugins()
			.find((plugin: RegionsPlugin) => plugin.regions)

		// find the closest marker to the current time
		const { regions = [] } = regionsPlugin || {}

		const findClosestRegion = (time: number) => {
			return regions.findIndex((region: Region) => {
				if (region.start > time) return true
			})
		}

		let currentIndex = findClosestRegion(!direction ? seconds ?? time : time)
		currentIndex = currentIndex === -1 ? regions.length - 1 : currentIndex

		const previous = regions[(currentIndex || 1) - 1]
		const current = regions[currentIndex]
		const next = regions[Math.min(currentIndex, regions.length - 2) + 1]

		const previousDiff = Math.abs(seconds - previous.start)
		const currentDiff = Math.abs(seconds - current.start)
		const nextDiff = Math.abs(seconds - next.start)

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

		waveform.seekTo(closestTime / duration)

		const [stems] = getAudioState[trackId].stems()
		if (stems) {
			for (const [, { waveform }] of Object.entries(stems)) {
				waveform?.seekTo(closestTime / duration)
			}
		}

		setAudioState[trackId].time(closestTime)

		// resume playing if not at the end of track
		if (playing && closestTime < duration) audioEvents.play(trackId)
	},

	seekMixpoint: async (trackId: Track['id']) => {
		const { mixpointTime = 0 } = (await getTrackPrefs(trackId)) || {}
		audioEvents.seek(trackId, mixpointTime)
	},

	// crossfade handles the sliders that mix between stems or full track
	crossfade: async (sliderVal: number, stemType?: Stem) => {
		const { tracks } = await getPrefs('mix')

		const sliderPercent = sliderVal / 100

		// Keep volumes at 100% when at 50% crossfade
		// [left, right] @ 0% = [1, 0] 50% = [1, 1] 100% = [0, 1]
		const volumes = [
			Math.min(1, 1 + Math.cos(sliderPercent * Math.PI)),
			Math.min(1, 1 + Math.cos((1 - sliderPercent) * Math.PI))
		]

		tracks?.forEach((track, i) => {
			if (track) audioEvents.updateVolume(Number(track), volumes[i], stemType)
		})
	},

	updateVolume: (trackId: number, volume: number, stemType?: Stem) => {
		const [{ volume: trackVol = 1, stems, gainNode, stemState }] =
			getAudioState[trackId]()

		// if we have a stemType, this is a stem crossfader
		if (stemType) {
			if (!stems) return

			// adjust the gain of the stem as a percentage of the track volume
			// (75% crossfader x 50% stem fader = 37.5% stem volume)
			const stemGain = stems[stemType]?.gainNode
			stemGain?.gain.setValueAtTime(trackVol * volume, 0)
			setAudioState[trackId].stems[stemType].volume(volume)
			return
		}

		// otherwise this is main crossfader
		if (stemState !== 'ready') {
			gainNode?.gain.setValueAtTime(volume, 0)
		} else if (stems) {
			for (const stem of Object.keys(stems)) {
				const [stemGain] = getAudioState[trackId].stems[stem as Stem].gainNode()
				const [stemVol = 1] =
					getAudioState[trackId].stems[stem as Stem].volume()

				// adjust the gain of the stem as a percentage of the track volume
				// (75% crossfader x 50% stem fader = 37.5% stem volume)
				stemGain?.gain.setValueAtTime(trackVol * stemVol, 0)
			}

			setAudioState[trackId].volume(volume)
		}
	},

	beatResolution: async (
		trackId: Track['id'],
		beatResolution: TrackPrefs['beatResolution']
	): Promise<void> => {
		const [waveform] = getAudioState[trackId].waveform()
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

		calcMarkers(trackId)
	},

	bpm: async (
		trackId: Track['id'],
		adjustedBpm: TrackPrefs['adjustedBpm']
	): Promise<void> => {
		const [{ stems, waveform, playing }] = getAudioState[trackId]()
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

		// Update mixPrefs
		await setTrackPrefs(trackId, { adjustedBpm })
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
		const [waveform] = getAudioState[trackId].waveform()
		if (!waveform) return

		audioEvents.pause(trackId)

		const [time = 0] = getAudioState[trackId].time()
		const { mixpointTime = 0 } = (await getTrackPrefs(trackId)) || {}

		const newMixpoint = mixpoint ? convertToSecs(mixpoint) : time
		if (newMixpoint === mixpointTime) return

		setTrackPrefs(trackId, { mixpointTime: newMixpoint })

		audioEvents.seek(trackId, newMixpoint)
	},

	stemVolume: (trackId: Track['id'], stemType: Stem, volume: number) => {
		const [stems] = getAudioState[trackId].stems()
		if (!stems) return

		const gainNode = stems[stemType as Stem]?.gainNode
		if (gainNode) gainNode.gain.setValueAtTime(volume, 0)

		// set volume in state, which in turn will update components (volume sliders)
		setAudioState[trackId].stems[stemType as Stem].volume(volume)
	},

	stemMuteToggle: (trackId: Track['id'], stemType: Stem, mute: boolean) => {
		const [stems] = getAudioState[trackId].stems()
		if (!stems) return

		const stem = stems[stemType as Stem]
		const { gainNode, volume } = stem || {}

		gainNode?.gain.setValueAtTime(mute ? 0 : volume || 1, 0)

		setAudioState[trackId].stems[stemType as Stem].mute(mute)
	},

	stemSoloToggle: (trackId: Track['id'], stem: Stem, solo: boolean) => {
		const [stems] = getAudioState[trackId].stems()
		if (!stems) return

		for (const s of Object.keys(stems)) {
			if (s !== stem) audioEvents.stemMuteToggle(trackId, s as Stem, solo)
		}
	},

	destroy: (trackId: Track['id']) => {
		const [waveform] = getAudioState[trackId].waveform()

		audioEvents.destroyStems(trackId)
		if (waveform) waveform.destroy()
	},

	destroyStems: (trackId: Track['id']) => {
		const [stems] = getAudioState[trackId].stems()

		if (stems) {
			for (const stem of Object.values(stems)) {
				stem?.waveform?.destroy()
			}
		}
	}
}

export { audioEvents }
