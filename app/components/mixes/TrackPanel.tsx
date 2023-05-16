import { Box, Card, Typography } from "@mui/joy";
import { tableState } from "~/api/appState";
import { Track, db, useLiveQuery } from "~/api/db/dbHandlers";
import Waveform from "~/api/renderWaveform";
import VolumeMeter from "~/components/mixes/VolumeMeter";
import {
	BeatResolutionControl,
	MixpointControl,
	OffsetControl,
	TrackTime,
} from "~/components/tracks/Controls";
import Loader from "~/components/tracks/TrackLoader";
import { timeFormat } from "~/utils/tableOps";

const TrackPanel = ({ trackId }: { trackId: Track[ "id" ] }) => {
	const [ analyzingTracks ] = tableState.analyzing();
	const analyzing = analyzingTracks.includes(trackId);

	const { duration = 0 } =
		useLiveQuery(() => db.tracks.get(trackId), [ trackId ]) || {};

	const trackHeader = (
		<Box
			sx={{
				display: "flex",
				gap: 1,
				mb: 1,
				alignItems: "center",
			}}
		>
			<Typography
				sx={{
					fontSize: "xs",
					fontWeight: "md",
					pl: "3px",
					color: "text.secondary",
				}}
			>
				Time:
			</Typography>
			<TrackTime sx={{ mr: "-4px" }} trackId={trackId} />
			<Typography sx={{ fontSize: "xs", color: "text.secondary" }}>
				/ {timeFormat(duration).slice(0, -3)}
			</Typography>
			<BeatResolutionControl trackId={trackId} sx={{ marginLeft: "auto" }} />
		</Box>
	);

	const trackFooter = (
		<Box
			sx={{
				display: "flex",
				gap: 1,
				mt: 1,
				alignItems: "center",
			}}
		>
			<MixpointControl trackId={trackId} />
			<OffsetControl trackId={trackId} styles={{ marginLeft: "auto" }} />
		</Box>
	);

	const loaderSx = {
		p: 0,
		border: "1px solid",
		borderColor: "action.focus",
		borderRadius: "4px",
		borderBottom: "none",
		backgroundColor: "background.body",
		overflow: "hidden",
		zIndex: 1,
	};

	return (
		<>
			{trackHeader}

			{/* loader cover */}
			{!analyzing ? null : (
				<Card
					sx={{
						...loaderSx,
						zIndex: 2,
						position: "absolute",
						inset: "262px 16px calc(100% - 343px)",
					}}
				>
					<Loader style={{ margin: "auto" }} />
				</Card>
			)}

			<Waveform trackId={trackId} sx={{ ...loaderSx, height: "80px" }} />

			<VolumeMeter trackId={trackId} />

			{trackFooter}
		</>
	);
};

export { TrackPanel as default };
