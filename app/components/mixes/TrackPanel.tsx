import { Box, Card, Typography } from '@mui/joy'
import { appState, audioState } from '~/api/db/appState'
import { Track, db, useLiveQuery } from '~/api/db/dbHandlers'
import { Waveform } from '~/api/renderWaveform'
import VolumeMeter from '~/components/mixes/VolumeMeter'
import {
	BeatResolutionControl,
	MixpointControl,
	OffsetControl,
	TrackTime,
	ZoomSelectControl
} from '~/components/tracks/Controls'
import Loader from '~/components/tracks/TrackLoader'
import { timeFormat } from '~/utils/tableOps'

const TrackPanel = ({ trackId }: { trackId: Track['id'] }) => {
	const [analyzingTracks] = appState.analyzing()
	const analyzing = analyzingTracks.has(trackId)

	const { duration = 0 } =
		useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

	const [stemState] = audioState[trackId].stemState()

	const trackHeader = (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'space-between',
				mb: 1,
				alignItems: 'center'
			}}
		>
			<div style={{ display: 'flex', minWidth: '130px' }}>
				<Typography
					sx={{
						fontSize: 'xs',
						fontWeight: 'md',
						px: '3px',
						color: 'text.secondary'
					}}
				>
					Time:
				</Typography>
				<TrackTime sx={{ px: '3px', flexBasis: '42px' }} trackId={trackId} />
				<Typography
					sx={{ fontSize: 'xs', color: 'text.secondary', whiteSpace: 'nowrap' }}
				>
					/ {timeFormat(duration)}
				</Typography>
			</div>

			{stemState !== 'ready' ? null : <ZoomSelectControl trackId={trackId} />}

			<BeatResolutionControl trackId={trackId} />
		</Box>
	)

	const trackFooter = (
		<Box
			sx={{
				display: 'flex',
				gap: 1,
				mt: 1,
				alignItems: 'center'
			}}
		>
			<MixpointControl trackId={trackId} />
			<OffsetControl trackId={trackId} styles={{ marginLeft: 'auto' }} />
		</Box>
	)

	const LOADER_SX = {
		p: 0,
		border: '1px solid',
		borderColor: 'action.focus',
		borderRadius: '4px',
		borderBottom: 'none',
		backgroundColor: 'background.body',
		overflow: 'hidden',
		zIndex: 1
	}

	const loaderCover = (
		<Card
			sx={{
				...LOADER_SX,
				zIndex: 2,
				position: 'absolute',
				inset: '261px 16px calc(100% - 339px)'
			}}
		>
			<Loader style={{ margin: 'auto' }} />
		</Card>
	)

	return (
		<>
			{trackHeader}

			{analyzing ? loaderCover : null}

			<Waveform trackId={trackId} sx={{ ...LOADER_SX, height: '78px' }} />

			<VolumeMeter trackId={trackId} />

			{trackFooter}
		</>
	)
}

export { TrackPanel as default }
