// This file allows events to be received which need access to the waveform, rather than passing waveform around
import { Meter, now, Player, start, Transport } from "tone";
import { getAudioState, setAudioState, setTableState } from "~/api/appState";
import { calcMarkers } from "~/api/audioHandlers";
import {
	_removeFromMix,
	db,
	getPrefs,
	getTrackPrefs,
	setTrackPrefs,
	Stem,
	Track,
	TrackPrefs,
	updateTrack,
} from "~/api/db/dbHandlers";
import { convertToSecs, timeFormat } from "~/utils/tableOps";

// audioEvent are emitted by controls (e.g. buttons) to signal changes in audio, such as Play, adjust BPM, etc and the listeners are attached to the waveform when it is rendered

const clearVolumeMeter = (trackId: Track["id"]) => {
	const [volumeMeterInterval] =
		getAudioState[Number(trackId)].volumeMeterInterval();
	clearInterval(volumeMeterInterval);
	setAudioState[Number(trackId)].volumeMeter(0);
};

const _getAllPlayers = (): Player[] => {
	const [audioState] = getAudioState();

	const players: Player[] = [];

	for (const { player } of Object.values(audioState)) {
		if (!player) continue;
		players.push(player);
	}

	return players;
};

const audioEvents = {
	onReady: async (trackId: Track["id"], stem?: Stem) => {
		const [waveform] = getAudioState[trackId].waveform();
		if (!waveform) return;

		const {
			mixpointTime,
			beatResolution = 1,
		} = await getTrackPrefs(trackId);

		if (!stem) {
			// Generate beat markers and apply them to waveform
			await calcMarkers(trackId);

			// Adjust zoom based on previous mixPrefs
			waveform.zoom(
				beatResolution === 1 ? 80 : beatResolution === 0.5 ? 40 : 20,
			);

			// Remove analyzing overlay
			setTableState.analyzing((prev) => prev.filter((id) => id !== trackId));
		} else {
			setTableState.stemsAnalyzing((prev) =>
				prev.filter((id) => id !== trackId),
			);
		}

		// Update time
		const time = mixpointTime || waveform.markers.markers?.[0]?.time || 0;
		setAudioState[trackId].time(time);

		const {duration = 1} = await db.tracks.get(trackId) || {}

		audioEvents.seek(trackId, time / duration);
	},

	ejectTrack: async (trackId: Track["id"]) => {
		if (!trackId) return;

		// If this is not the last track in the mix, open drawer, otherwise the drawer will open automatically
		const { tracks = [] } = await getPrefs("mix");
		if (tracks.length > 1) setTableState.openDrawer(true);

		audioEvents.pause(trackId);

		// Destroy waveform and stems before removing from audioState
		audioEvents.destroy(trackId);

		// Remove track from mix state (dexie)
		await _removeFromMix(trackId);

		// Remove track from audioState (teaful)
		const [audioState] = getAudioState();
		const { [trackId]: _, ...rest } = audioState;
		setAudioState(rest);
	},

	playAll: async () => {
		const { tracks = [] } = await getPrefs("mix");
		for (const trackId of tracks) audioEvents.play(trackId);
	},

	play: async (trackId: Track["id"], startTime?: number) => {
		// use the same Tonejs audio context timer for all stems
		await start();
		const contextStartTime = now();

		const [audioState] = getAudioState();

		for (let [id, { waveform, player, time = 0 }] of Object.entries(
			audioState,
		)) {
			if (!waveform || !player || id !== String(trackId)) continue;

			time = startTime || time;

			// clear any running volume meter timers
			clearVolumeMeter(Number(id));

			// stem volume meters
			const meters: Partial<{ [key in Stem]: Meter }> = {};

			// check for bpm adjustment
			const { adjustedBpm } = await getTrackPrefs(Number(id));
			const { bpm = 1, duration = 1 } = (await db.tracks.get(Number(id))) || {}

			// pull players from audioState for synchronized playback
			const [stems] = getAudioState[Number(id)].stems();

			const addMeter = (player: Player, stem?: Stem) => {
				// connect Meter for volume monitoring
				const meter = new Meter({ normalRange: true });
				player.connect(meter);
				meters[(stem as Stem) || "main"] = meter;
				return player;
			};

			if (stems) {
				for (const [stem, { player }] of Object.entries(stems)) {
					if (!player) continue;
					
				if (adjustedBpm && bpm) player.playbackRate = adjustedBpm / bpm;

					addMeter(player, stem as Stem);

					player.start(contextStartTime, time);
				}
			} else {
				if (adjustedBpm && bpm) player.playbackRate = adjustedBpm / bpm;
				addMeter(player);

				player.start(contextStartTime, time);
			}

			// create interval for volume meters and drawer progress
			const newInterval: ReturnType<typeof setInterval> | number = setInterval(
				() => {
					if (!getAudioState[Number(id)].playing())
						return clearInterval(newInterval);

					const volumes: number[] = [];

					for (const [stem, meter] of Object.entries(meters)) {
						const vol = meter.getValue() as number;
						volumes.push(vol);

						// each stem volume is set here
						if (stem !== "main")
							setAudioState[Number(id)].stems[stem as Stem].volumeMeter(vol);
					}

					// this is the waveform volume meter
					setAudioState[Number(id)].volumeMeter(Math.max(...volumes));

					// update track timer
					if (player) {
						const startTime = (time || 0) + now() - contextStartTime;
						setAudioState[Number(id)].time(startTime || 0);

						// pause if we're at the end of the track
						const percentageTime = 1 / (duration / (startTime || 1)) || 0;
						if (percentageTime >= 1) audioEvents.pause(Number(id));

						// update waveform and minimap drawer (progress indicator)
						if (waveform) {
							waveform.drawer.progress(percentageTime);
							//@ts-ignore - minimap does indeed have a drawer.progress method
							waveform.minimap.drawer.progress(percentageTime);
						}
					}
				},
				20,
			);

			// store the interval so it can be cleared later
			setAudioState[Number(id)].volumeMeterInterval(newInterval);
			setAudioState[Number(id)].playing(true);
		}
	},

	pause: async (trackId?: Track["id"]) => {
		// this needs to pause all stems so requires a bit of logic
		let players;
		let trackIds;

		if (trackId) {
			const [player] = getAudioState[trackId].player();
			players = [player];
			trackIds = [trackId];
		} else {
			players = _getAllPlayers();
			const [audioState] = getAudioState();
			trackIds = Object.keys(audioState);
		}

		for (const player of players) {
			if (player) player.stop(Transport.context.currentTime + 0.1);
		}

		for (const id of trackIds) {
			const [stems] = getAudioState[Number(id)].stems();
			if (stems) {
				for (const [stem, { player }] of Object.entries(stems)) {
					// set volume meter to zero for the stem
					setAudioState[Number(id)].stems[stem as Stem].volumeMeter(0);

					if (!player) continue;
					player.stop(Transport.context.currentTime + 0.1);
				}
			}

			clearVolumeMeter(Number(id));
			setAudioState[Number(id)].playing(false);
		}
	},

	mute: (trackId: Track["id"]) => {
		const [waveform] = getAudioState[trackId].waveform();
		if (waveform) waveform.setMute(true);
	},

	// Scroll to previous/next beat marker
	seek: async (
		trackId: Track["id"],
		percentageTime: number = 0,
		direction?: "previous" | "next",
	) => {
		if (!trackId) return;

		const [{ waveform, playing }] = getAudioState[trackId]();
		if (!waveform) return;
		
		if (playing) await audioEvents.pause(trackId);

		const {duration = 1} = await db.tracks.get(trackId) || {}
		const startTime = duration * percentageTime

		// find the closest marker to the current time
		const { markers = [] } = waveform.markers || {};
const currentMarkerIndex = markers.findIndex(m => m.time > startTime) - 1;
const closestIndex = currentMarkerIndex < 0 ? 0 :
    currentMarkerIndex >= markers.length - 1 ? markers.length - 2 :
    startTime - markers[currentMarkerIndex].time < markers[currentMarkerIndex + 1].time - startTime ? currentMarkerIndex : currentMarkerIndex + 1;

		// ensure we don't go below the first or past last marker
		const newIndex = Math.max(
			0,
			Math.min(
				markers.length - 1,
				closestIndex + (direction ? (direction === "next" ? 1 : -1) : 0),
			),
		);

		let { time = 0 } = markers[newIndex] || {};

		const notAtClosestMarker = time && (time > startTime + 0.005 || time < startTime - 0.005);
				
		const progressTime = time / duration;

		// avoid looping if the closestMarker is within 5ms of the current time
		if (notAtClosestMarker) waveform.seekTo(progressTime);

		setAudioState[trackId].time(time);
		waveform.drawer.progress(progressTime);

		// resume playing if not at the end of track
		if (playing && percentageTime < 1) audioEvents.play(trackId, time);
	},

	seekMixpoint: async (trackId: Track["id"]) => {
		const { mixpointTime = 0 } = (await getTrackPrefs(trackId)) || {};
		const {duration = 1} = await db.tracks.get(trackId) || {}
		audioEvents.seek(trackId, mixpointTime / duration);
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
		const currentTime = now();

		// if we have a stemType, this is a stem crossfader
		if (stemType) {
			if (!stems) return;

			// adjust the gain of the stem as a percentage of the track volume
			// (75% crossfader x 50% stem fader = 37.5% stem volume)
			const stemGain = stems[stemType]?.gainNode;
			stemGain?.gain.setValueAtTime(trackVol * volume, currentTime);
			setAudioState[trackId].stems[stemType].volume(volume);
			return;
		}

		// otherwise this is main crossfader
		if (stemState !== "ready") {
			gainNode?.gain.setValueAtTime(volume, currentTime);
		} else if (stems) {
			for (const stem of Object.keys(stems)) {
				const [stemGain] =
					getAudioState[trackId].stems[stem as Stem].gainNode();
				const [stemVol = 1] =
					getAudioState[trackId].stems[stem as Stem].volume();

				// adjust the gain of the stem as a percentage of the track volume
				// (75% crossfader x 50% stem fader = 37.5% stem volume)
				stemGain?.gain.setValueAtTime(trackVol * stemVol, currentTime);
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
		const [{ stems, player }] = getAudioState[trackId]();
		if (!adjustedBpm) return;

		const { bpm } = (await db.tracks.get(trackId)) || {};

		const playbackRate = adjustedBpm / (bpm || adjustedBpm);

		// update stem playback rate in realtime
		if (stems) {
			for (const { player } of Object.values(stems)) {
				if (!player) continue;

				player.playbackRate = playbackRate;
			}
		} else {
			if (player) player.playbackRate = playbackRate;
		}

		Transport.bpm.value = adjustedBpm;

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

		const { mixpointTime } = (await getTrackPrefs(trackId)) || {};

		const newMixpoint = convertToSecs(
			mixpoint || timeFormat(waveform.playhead.playheadTime),
		);
		if (newMixpoint === mixpointTime) return;

		setTrackPrefs(trackId, { mixpointTime: newMixpoint });

		const {duration = 1} = await db.tracks.get(trackId) || {}

		audioEvents.seek(trackId, newMixpoint / duration);
	},

	stemVolume: (trackId: Track["id"], stemType: Stem, volume: number) => {
		const [stems] = getAudioState[trackId].stems();
		if (!stems) return;

		const gainNode = stems[stemType as Stem]?.gainNode;
		if (gainNode) gainNode.gain.setValueAtTime(volume, now());

		// set volume in state, which in turn will update components (volume sliders)
		setAudioState[trackId].stems[stemType as Stem].volume(volume);
	},

	stemMuteToggle: (trackId: Track["id"], stemType: Stem, mute: boolean) => {
		const [stems] = getAudioState[trackId].stems();
		if (!stems) return;

		const stem = stems[stemType as Stem];
		const { gainNode, volume } = stem || {};

		gainNode?.gain.setValueAtTime(mute ? 0 : volume || 1, now());

		setAudioState[trackId].stems[stemType as Stem].mute(mute);
	},

	stemSoloToggle: (trackId: Track["id"], stem: Stem, solo: boolean) => {
		const [stems] = getAudioState[trackId].stems();
		if (!stems) return;

		for (const s of Object.keys(stems)) {
			if (s !== stem) audioEvents.stemMuteToggle(trackId, s as Stem, solo);
		}
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
