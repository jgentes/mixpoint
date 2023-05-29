import { Card } from "@mui/joy";
import { SxProps } from "@mui/joy/styles/types";
import { useEffect, useRef } from "react";
import WaveSurfer, { type WaveSurferOptions } from 'wavesurfer.js';
import Minimap from "wavesurfer.js/dist/plugins/minimap.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import {
	getTableState,
	setAudioState,
	setTableState,
} from "~/api/appState";
import { audioEvents } from "~/api/audioEvents";
import { Stem, Track, db } from "~/api/db/dbHandlers";
import { errorHandler } from "~/utils/notifications";
import { getPermission } from "./fileHandlers";


// This function accepts either a full track (with no stem) or an individual stem ('bass', etc)
const initWaveform = async ({
	trackId,
	file,
	stem,
	waveformConfig,
}: {
	trackId: Track[ "id" ];
	file: File;
	stem?: Stem;
	waveformConfig: WaveSurferOptions;
}): Promise<void> => {
	if (!trackId) throw errorHandler("No track ID provided to initWaveform");

	// an Audio object is required for Wavesurfer to use Web Audio
	const media = new Audio();
	media.src = URL.createObjectURL(file);

	const config: WaveSurferOptions = {
		media,
		pixelRatio: 1,
		cursorColor: "secondary.mainChannel",
		interact: true,
		waveColor: [
			"rgb(200, 165, 49)",
			"rgb(211, 194, 138)",
			"rgb(205, 124, 49)",
			"rgb(205, 98, 49)",
		],
		progressColor: "rgba(0, 0, 0, 0.45)",
		...waveformConfig,
	};

	const waveform = WaveSurfer.create(config);

	// Create Web Audio context
	const audioContext = new AudioContext()

	// gainNode is used to control volume of all stems at once
	const gainNode = audioContext.createGain();
	gainNode.connect(audioContext.destination)

	// Connect the audio to the equalizer
	media.addEventListener(
		'canplay',
		() => {
			// Create a MediaElementSourceNode from the audio element
			const mediaNode = audioContext.createMediaElementSource(media)
			mediaNode.connect(gainNode)
		},
		{ once: true },
	)

	// Save waveform in audioState to track user interactions with the waveform and show progress
	if (stem) {
		setAudioState[ trackId ].stems[ stem as Stem ]({
			gainNode,
			volume: 1,
			mute: false,
			waveform,
		});
	} else {
		setAudioState[ trackId ].waveform(waveform);
		setAudioState[ trackId ].gainNode(gainNode);
	}

	waveform.once('ready', () => audioEvents.onReady(trackId, stem));
	waveform.on('seeking', (time: number) => audioEvents.seek(trackId, time));
	waveform.on('timeupdate', (time: number) => { });
};

const Waveform = ({
	trackId,
	sx,
}: {
	trackId: Track[ "id" ];
	sx: SxProps;
}): JSX.Element | null => {
	if (!trackId) throw errorHandler("No track to initialize.");

	const zoomviewRef = useRef(null);

	useEffect(() => {
		// Retrieve track, file and region data, then store waveform in audioState
		const init = async () => {
			const track = await db.tracks.get(trackId);
			if (!track) throw errorHandler("Could not retrieve track from database.");

			const file = await getPermission(track);
			if (!file) throw errorHandler(`Please try adding ${track.name} again.`);

			const waveformConfig: WaveSurferOptions = {
				container: zoomviewRef.current || "",
				height: 60,
				autoScroll: true,
				autoCenter: true,
				hideScrollbar: false,
				barWidth: 2,
				barHeight: 0.9,
				barGap: 1,
				plugins: [
					// Playhead.create({
					// 	moveOnSeek: true,
					// 	returnOnPause: false,
					// 	draw: true,
					// }),
					// CursorPlugin.create({
					// 	showTime: true,
					// 	opacity: "1",
					// 	customShowTimeStyle: {
					// 		color: "#eee",
					// 		padding: "0 4px",
					// 		"font-size": "10px",
					// 		backgroundColor: "rgba(0, 0, 0, 0.3)",
					// 	},
					// }),
					RegionsPlugin.create(),
					Minimap.create({
						container: `#overview-container_${trackId}`,
						height: 25,
						waveColor: [
							"rgba(145, 145, 145, 0.8)",
							"rgba(145, 145, 145, 0.8)",
							"rgba(145, 145, 145, 0.5)",
							"rgba(145, 145, 145, 0.5)",
						],
						progressColor: "rgba(0, 0, 0, 0.25)",
						interact: true,
						scrollParent: false,
						hideScrollbar: true,
						pixelRatio: 1,
					}),
				],
			};

			initWaveform({ trackId, file, waveformConfig });
		};

		// prevent duplication on re-render while loading
		const [ analyzingTracks ] = getTableState.analyzing();
		const analyzing = analyzingTracks.includes(trackId);

		if (!analyzing) init();

		// add track to analyzing state
		setTableState.analyzing((prev) =>
			prev.includes(trackId) ? prev : [ ...prev, trackId ],
		);

		return () => audioEvents.destroy(trackId);
	}, [ trackId ]);

	return (
		<Card
			ref={zoomviewRef}
			className="zoomview-container"
			sx={{
				...sx,
				zIndex: 1,
			}}
			onWheel={(e) =>
				audioEvents.seek(trackId, undefined, e.deltaY > 0 ? "next" : "previous")
			}
		/>
	);
};

export { Waveform as default, initWaveform };
