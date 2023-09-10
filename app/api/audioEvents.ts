// This file allows events to be received which need access to the waveform, rather than passing waveform aroun'
import type WaveSurfer from "wavesurfer.js";
import { WaveSurferOptions } from "wavesurfer.js";
import RegionsPlugin, {
	type Region,
} from "wavesurfer.js/dist/plugins/regions.js";
import { calcMarkers } from "~/api/audioHandlers";
import {
	getAppState,
	getAudioState,
	setAppState,
	setAudioState,
} from "~/api/db/appState";
import {
	Stem,
	Track,
	TrackPrefs,
	_removeFromMix,
	db,
	getPrefs,
	getTrackPrefs,
	setTrackPrefs,
	updateTrack,
} from "~/api/db/dbHandlers";
import {
	PRIMARY_WAVEFORM_CONFIG,
	initAudioContext,
	initWaveform,
} from "~/api/renderWaveform";
import { convertToSecs } from "~/utils/tableOps";

// audioEvent are emitted by controls (e.g. buttons) to signal changes in audio, such as Play, adjust BPM, etc and the listeners are attached to the waveform when it is rendered

const _getAllWaveforms = (): WaveSurfer[] => {
	const [audioState] = getAudioState();

	const waveforms: WaveSurfer[] = [];

	for (const { waveform } of Object.values(audioState)) {
		if (!waveform) continue;
		waveforms.push(waveform);
	}

	return waveforms;
};

const audioEvents = {
	onReady: async (trackId: Track["id"], stem?: Stem) => {
		const [waveform] = getAudioState[trackId].waveform();
		if (!waveform) return;

		if (!stem) {
			// Generate beat markers (regions) and apply them to waveform
			await calcMarkers(trackId);

			const plugins = waveform.getActivePlugins();
			const regionsPlugin = plugins[0] as RegionsPlugin;

			const { mixpointTime, beatResolution = 1 } = await getTrackPrefs(trackId);

			// Adjust zoom based on previous mixPrefs
			waveform.zoom(
				beatResolution === 1 ? 80 : beatResolution === 0.5 ? 40 : 20,
			);

			// Remove analyzing overlay
			setAppState.analyzing((prev) => prev.filter((id) => id !== trackId));

			// Style scrollbar (this is a workaround for https://github.com/katspaugh/wavesurfer.js/issues/2933)
			const style = document.createElement("style");
			style.textContent = `::-webkit-scrollbar {
				background: rgba(4, 146, 247, 0.5);
				height: 18px;
			}

			::-webkit-scrollbar-corner, ::-webkit-scrollbar-track {
				border-top: 1px solid var(--joy-palette-divider);
				background-color: var(--joy-palette-background-surface);
			}

			::-webkit-scrollbar-thumb {
				background-color: rgba(4, 146, 247, 0.5);
				border-radius: 8px;
				border: 6px solid transparent;
				width: 15%;
				background-clip: content-box;
			}`;
			waveform.getWrapper().appendChild(style);

			// Update time
			let [time] = getAudioState[trackId].time();
			if (!time) {
				time = mixpointTime || regionsPlugin.getRegions()[0]?.start || 0;
				setAudioState[trackId].time(time);
			}

			waveform.on("redraw", () => audioEvents.seek(trackId));
		} else {
			setAppState.stemsAnalyzing((prev) => prev.filter((id) => id !== trackId));
		}

		// Update BPM if adjusted
		const { adjustedBpm } = await getTrackPrefs(trackId);
		const { bpm = 1 } = (await db.tracks.get(trackId)) || {};
		const playbackRate = (adjustedBpm || bpm) / bpm;
		waveform.setPlaybackRate(playbackRate);
	},

	clickToSeek: async (
		trackId: Track["id"],
		e: React.MouseEvent,
		parentElement: HTMLElement,
	) => {
		// get click position of parent element and convert to time
		const shadowRoot = parentElement.shadowRoot as ShadowRoot;
		const wrapper = shadowRoot.querySelector(".wrapper") as HTMLElement;
		const scrollbar = shadowRoot.querySelector(".scroll") as HTMLElement;
		const boundary = wrapper.getBoundingClientRect();
		const position = Math.min(
			1,
			(e.clientX +
				scrollbar.scrollLeft -
				Math.abs(scrollbar.scrollLeft - Math.abs(boundary.x))) /
				boundary.width,
		);

		const { duration = 1 } = (await db.tracks.get(trackId)) || {};

		audioEvents.seek(trackId, duration * position);
	},

	ejectTrack: async (trackId: Track["id"]) => {
		if (!trackId) return;

		audioEvents.pause(trackId);

		// Destroy waveform and stems before removing from audioState
		audioEvents.destroy(trackId);

		// Remove track from mix state (dexie)
		await _removeFromMix(trackId);

		// Remove track from audioState (teaful)
		const [audioState] = getAudioState();
		const { [trackId]: _, ...rest } = audioState;
		setAudioState(rest);

		// If this is not the last track in the mix, open drawer, otherwise the drawer will open automatically
		const { tracks } = (await getPrefs("mix", "tracks")) || {};
		const mixViewVisible = !!tracks?.filter((t) => t).length;

		if (mixViewVisible) setAppState.openDrawer(true);
	},

	play: async (trackId?: Track["id"]) => {
		let tracks;
		if (!trackId) {
			// pull players from audioState to play all
			[tracks] = getAudioState();
			tracks = Object.keys(tracks).map(Number);
		} else tracks = [trackId];

		// synchronize playback of all tracks
		audioEvents.multiSync(tracks.filter((id) => !!id));
	},

	multiSync: async (trackIds: Track["id"][]) => {
		// Sync all waveforms to the same position
		let [syncTimer] = getAppState.syncTimer();
		if (syncTimer) cancelAnimationFrame(syncTimer);

		const dataArray = new Uint8Array(2048); // fftSize

		const getVolume = (analyserNode: AnalyserNode) => {
			analyserNode.getByteTimeDomainData(dataArray);
			return (Math.max(...dataArray) - 128) / 128;
		};

		// setup sync loop
		const syncLoop = () => {
			syncTimer = requestAnimationFrame(syncLoop);
			setAppState.syncTimer(syncTimer);

			// for volume meters
			for (const trackId of trackIds) {
				const [{ waveform, stems, analyserNode }] = getAudioState[trackId]();

				const volumes: number[] = []; // to aggregate for main volume meter

				if (stems) {
					for (const [stem, { analyserNode }] of Object.entries(stems)) {
						if (analyserNode) {
							const vol = getVolume(analyserNode);
							volumes.push(vol);
							setAudioState[trackId].stems[stem as Stem].volumeMeter(vol);
						}
					}
				} else volumes.push(getVolume(analyserNode));

				// aggregate stem volumes for main volume meter
				setAudioState[trackId].volumeMeter(Math.max(...volumes));
				setAudioState[trackId].time(waveform.getCurrentTime());
			}
		};

		syncTimer = requestAnimationFrame(syncLoop);

		for (const trackId of trackIds) {
			const [{ waveform, stems }] = getAudioState[trackId]();
			if (!waveform) continue;

			setAudioState[trackId as number].playing(true);

			initAudioContext({
				trackId,
				media: waveform.getMediaElement(),
			});

			waveform.play();

			if (stems) {
				// if we have stems, mute the main waveforms
				waveform.setVolume(0);

				for (const [stem, { waveform }] of Object.entries(stems)) {
					if (waveform) {
						initAudioContext({
							trackId,
							stem: stem as Stem,
							media: waveform.getMediaElement(),
						});
						waveform.play();
					}
				}
			}
		}
	},

	pause: async (trackId?: Track["id"]) => {
		// this needs to pause all stems so requires a bit of logic
		let waveforms;
		let trackIds;

		const [syncTimer] = getAppState.syncTimer();
		if (syncTimer) cancelAnimationFrame(syncTimer);

		if (trackId) {
			const [waveform] = getAudioState[trackId].waveform();
			waveforms = [waveform];
			trackIds = [trackId];
		} else {
			waveforms = _getAllWaveforms();
			const [tracks] = getAudioState();
			trackIds = Object.keys(tracks);
		}

		const stopWaveform = (waveform: WaveSurfer) => waveform.pause();

		for (const waveform of waveforms) {
			if (waveform) stopWaveform(waveform);
		}

		for (const id of trackIds) {
			const [stems] = getAudioState[Number(id)].stems();
			if (stems) {
				for (const [stem, { waveform }] of Object.entries(stems)) {
					// set volume meter to zero for the stem
					setAudioState[Number(id)].stems[stem as Stem].volumeMeter(0);

					if (waveform) stopWaveform(waveform);
				}
			}
			setAudioState[Number(id)].playing(false);
			setAudioState[Number(id)].volumeMeter(0);
		}
	},

	// Scroll to previous/next beat marker
	seek: async (
		trackId: Track["id"],
		seconds?: number, // no default here, we want to be able to seek to 0
		direction?: "previous" | "next",
	) => {
		if (!trackId) return;

		const [{ waveform, playing, time }] = getAudioState[trackId]();
		if (!waveform) return;

		const currentTime = seconds ?? time;
		if (playing) await audioEvents.pause(trackId);

		const { duration = 1 } = (await db.tracks.get(trackId)) || {};

		const regionsPlugin = waveform.getActivePlugins()[0] as RegionsPlugin;

		// find the closest marker to the current time
		const regions = regionsPlugin.getRegions();

		const findClosestRegion = (time: number) => {
			return regions.findIndex((region: Region) => {
				if (region.start > time) return true;
			});
		};

		let currentIndex = findClosestRegion(!direction ? currentTime : time);
		currentIndex = currentIndex === -1 ? regions.length - 1 : currentIndex;

		const previous = regions[(currentIndex || 1) - 1];
		const current = regions[currentIndex];
		const next = regions[Math.min(currentIndex, regions.length - 2) + 1];

		const previousDiff = Math.abs(currentTime - previous.start);
		const currentDiff = Math.abs(currentTime - current.start);
		const nextDiff = Math.abs(currentTime - next.start);

		let closestTime = current.start; // default current wins
		if (direction) {
			closestTime =
				direction === "previous"
					? regions[Math.max(currentIndex - 2, 0)].start
					: current.start;
		} else if (previousDiff < currentDiff) {
			// previous wins
			if (currentDiff < nextDiff) {
				// previous wins
				closestTime = previous.start;
			} else {
				if (previousDiff < nextDiff) {
					// previous wins
					closestTime = previous.start;
				} else {
					// next wins
					closestTime = next.start;
				}
			}
		}

		setAudioState[trackId].time(closestTime);

		const [stems] = getAudioState[trackId].stems();
		if (stems) {
			for (const [, { waveform: stemWave }] of Object.entries(stems)) {
				stemWave?.seekTo(closestTime / duration);
			}
		}

		waveform.seekTo(closestTime / duration);

		// resume playing if not at the end of track
		if (playing && closestTime < duration) audioEvents.play(trackId);
	},

	seekMixpoint: async (trackId: Track["id"]) => {
		const { mixpointTime = 0 } = (await getTrackPrefs(trackId)) || {};
		audioEvents.seek(trackId, mixpointTime);
	},

	// crossfade handles the sliders that mix between stems or full track
	crossfade: async (sliderVal: number, stemType?: Stem) => {
		const { tracks } = await getPrefs("mix");

		const sliderPercent = sliderVal / 100;

		// Keep volumes at 100% when at 50% crossfade
		// [left, right] @ 0% = [1, 0] 50% = [1, 1] 100% = [0, 1]
		const volumes = [
			Math.min(1, 1 + Math.cos(sliderPercent * Math.PI)),
			Math.min(1, 1 + Math.cos((1 - sliderPercent) * Math.PI)),
		];

		tracks?.forEach((track, i) => {
			if (track) audioEvents.updateVolume(Number(track), volumes[i], stemType);
		});
	},

	updateVolume: (trackId: number, volume: number, stemType?: Stem) => {
		const [{ volume: trackVol = 1, stems, gainNode, stemState }] =
			getAudioState[trackId]();

		// if we have a stemType, this is a stem crossfader
		if (stemType) {
			if (!stems) return;

			// adjust the gain of the stem as a percentage of the track volume
			// (75% crossfader x 50% stem fader = 37.5% stem volume)
			const stemGain = stems[stemType]?.gainNode;
			stemGain?.gain.setValueAtTime(trackVol * volume, 0);
			setAudioState[trackId].stems[stemType].volume(volume);
			return;
		}

		// otherwise this is main crossfader
		if (stemState !== "ready") {
			gainNode?.gain.setValueAtTime(volume, 0);
		} else if (stems) {
			for (const stem of Object.keys(stems)) {
				const [stemGain] =
					getAudioState[trackId].stems[stem as Stem].gainNode();
				const [stemVol = 1] =
					getAudioState[trackId].stems[stem as Stem].volume();

				// adjust the gain of the stem as a percentage of the track volume
				// (75% crossfader x 50% stem fader = 37.5% stem volume)
				stemGain?.gain.setValueAtTime(trackVol * stemVol, 0);
			}

			setAudioState[trackId].volume(volume);
		}
	},

	beatResolution: async (
		trackId: Track["id"],
		beatResolution: TrackPrefs["beatResolution"],
	): Promise<void> => {
		const [waveform] = getAudioState[trackId].waveform();
		if (!waveform || !beatResolution) return;

		// Update mixPrefs
		await setTrackPrefs(trackId, { beatResolution });

		// Adjust zoom
		switch (beatResolution) {
			case 0.25:
				waveform.zoom(20);
				break;
			case 0.5:
				waveform.zoom(40);
				break;
			case 1:
				waveform.zoom(80);
				break;
		}

		calcMarkers(trackId);
	},

	bpm: async (
		trackId: Track["id"],
		adjustedBpm: TrackPrefs["adjustedBpm"],
	): Promise<void> => {
		const [{ stems, waveform, playing }] = getAudioState[trackId]();
		if (!adjustedBpm) return;

		const { bpm } = (await db.tracks.get(trackId)) || {};

		const playbackRate = adjustedBpm / (bpm || adjustedBpm);

		if (playing) audioEvents.pause(trackId);

		const adjustPlaybackRate = (waveform: WaveSurfer) =>
			waveform.setPlaybackRate(playbackRate);

		// update stem playback rate in realtime
		if (stems) {
			for (const { waveform } of Object.values(stems)) {
				if (!waveform) continue;

				adjustPlaybackRate(waveform);
			}
		} else {
			if (waveform) adjustPlaybackRate(waveform);
		}

		if (playing) audioEvents.play(trackId);

		// Update mixPrefs
		await setTrackPrefs(trackId, { adjustedBpm });
	},

	offset: async (
		trackId: Track["id"],
		adjustedOffset: Track["adjustedOffset"],
	): Promise<void> => {
		await updateTrack(trackId, { adjustedOffset });

		calcMarkers(trackId);
	},

	setMixpoint: async (
		trackId: Track["id"],
		mixpoint?: string,
	): Promise<void> => {
		const [waveform] = getAudioState[trackId].waveform();
		if (!waveform) return;

		audioEvents.pause(trackId);

		const [time = 0] = getAudioState[trackId].time();
		const { mixpointTime = 0 } = (await getTrackPrefs(trackId)) || {};

		const newMixpoint = mixpoint ? convertToSecs(mixpoint) : time;
		if (newMixpoint === mixpointTime) return;

		setTrackPrefs(trackId, { mixpointTime: newMixpoint });

		audioEvents.seek(trackId, newMixpoint);
	},

	stemVolume: (trackId: Track["id"], stemType: Stem, volume: number) => {
		const [stems] = getAudioState[trackId].stems();
		if (!stems) return;

		const gainNode = stems[stemType as Stem]?.gainNode;
		if (gainNode) gainNode.gain.setValueAtTime(volume, 0);

		// set volume in state, which in turn will update components (volume sliders)
		setAudioState[trackId].stems[stemType as Stem].volume(volume);
	},

	stemMuteToggle: (trackId: Track["id"], stemType: Stem, mute: boolean) => {
		const [stems] = getAudioState[trackId].stems();
		if (!stems) return;

		const stem = stems[stemType as Stem];
		const { gainNode, volume } = stem || {};

		gainNode?.gain.setValueAtTime(mute ? 0 : volume || 1, 0);

		setAudioState[trackId].stems[stemType as Stem].mute(mute);
	},

	stemSoloToggle: (trackId: Track["id"], stem: Stem, solo: boolean) => {
		const [stems] = getAudioState[trackId].stems();
		if (!stems) return;

		for (const s of Object.keys(stems)) {
			if (s !== stem) audioEvents.stemMuteToggle(trackId, s as Stem, solo);
		}
	},

	stemZoom: async (
		trackId: Track["id"],
		stem: TrackPrefs["stemZoom"] | "all",
	) => {
		const [{ waveform }] = getAudioState[trackId]();
		if (waveform) waveform.destroy();

		let file;

		if (stem === "all") {
			({ file } = (await db.trackCache.get(trackId)) || {});
		} else {
			const { stems } = (await db.trackCache.get(trackId)) || {};
			if (!stems) return;

			file = stems[stem as Stem]?.file;
		}

		if (!file) return;

		const waveformConfig: WaveSurferOptions = {
			container: `#zoomview-container_${trackId}`,
			...PRIMARY_WAVEFORM_CONFIG,
			plugins: [
				// Do not change the order of plugins! They are referenced by index :(
				RegionsPlugin.create(),
			],
		};

		await initWaveform({
			trackId,
			file,
			waveformConfig,
		});

		await setTrackPrefs(trackId, {
			stemZoom: stem === "all" ? undefined : stem,
		});
	},

	destroy: (trackId: Track["id"]) => {
		const [waveform] = getAudioState[trackId].waveform();

		audioEvents.destroyStems(trackId);
		if (waveform) waveform.destroy();
	},

	destroyStems: (trackId: Track["id"]) => {
		const [stems] = getAudioState[trackId].stems();

		if (stems) {
			for (const stem of Object.values(stems)) {
				stem?.waveform?.destroy();
			}
		}
	},
};

export { audioEvents };
