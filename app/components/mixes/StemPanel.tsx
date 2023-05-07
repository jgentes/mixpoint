import { Box } from "@mui/joy";
import { useEffect } from "react";
import { WaveSurferParams } from "wavesurfer.js/types/params";
import {
	audioState,
	getAudioState,
	getTableState,
	setTableState,
} from "~/api/appState";
import { STEMS, Stem, Track, db } from "~/api/db/dbHandlers";
import { validateTrackStemAccess } from "~/api/fileHandlers";
import { initWaveform } from "~/api/renderWaveform";
import StemAccessButton from "~/components/mixes/StemAccessButton";
import { StemControl } from "~/components/tracks/Controls";
import { errorHandler } from "~/utils/notifications";

const StemPanel = ({ trackId }: { trackId: Track["id"] }) => {
	if (!trackId) throw errorHandler("No track ID provided to StemPanel");

	const [stemState] = audioState[trackId].stemState();

	// check stems on disk to determine component state
	useEffect(() => {
		const initStems = async () => {
			await validateTrackStemAccess(trackId);

			// if stems exist, generate Tonejs players for each
			if (stemState === "ready") {
				const { stems: stemCache } = (await db.trackCache.get(trackId)) || {};

				if (stemCache) {
					for (const [stem, { file }] of Object.entries(stemCache)) {
						if (!file) continue;

						const waveformConfig: WaveSurferParams = {
							container: `#zoomview-container_${trackId}_${stem}`,
							scrollParent: false,
							fillParent: true,
							hideScrollbar: true,
							barWidth: 1,
							normalize: true,
						};

						await initWaveform({
							trackId,
							file,
							stem: stem as Stem,
							waveformConfig,
						});
					}
				}
			}
		};

		// prevent duplication on re-render while loading
		const [analyzingTracks] = getTableState.stemsAnalyzing();
		const analyzing = analyzingTracks.includes(trackId);

		if (!analyzing) initStems();

		// add stems to analyzing state
		setTableState.stemsAnalyzing((prev) =>
			prev.includes(trackId) ? prev : [...prev, trackId],
		);

		return () => {
			const [stems] = getAudioState[trackId].stems();

			if (stems) {
				for (const stem of Object.values(stems)) {
					stem?.waveform?.destroy();
				}
			}
		};
	}, [trackId, stemState]);

	return stemState !== "ready" ? (
		<StemAccessButton trackId={trackId} />
	) : (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: 1,
				p: 1,
				borderRadius: "4px",
				border: "1px solid",
				borderColor: "action.selected",
				backgroundColor: "background.level1",
			}}
		>
			{STEMS.map((stem) => (
				<StemControl key={stem} trackId={trackId} stemType={stem as Stem} />
			))}
		</Box>
	);
};

export { StemPanel as default };
