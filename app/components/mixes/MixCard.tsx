import { Box, Card, Typography } from '@mui/joy'
import { SxProps } from '@mui/material'
import { useEffect } from 'react'
import {
	AppState,
	audioState,
	getAudioState,
	setAppState
} from '~/api/appState'
import { audioEvents } from '~/api/audioEvents'
import { Track, getTrackName, useLiveQuery } from '~/api/db/dbHandlers'
import StemPanel from '~/components/mixes/StemPanel'
import TrackPanel from '~/components/mixes/TrackPanel'
import {
	BpmControl,
	EjectControl,
	TrackNavControl
} from '~/components/tracks/Controls'
import Dropzone from '~/components/tracks/Dropzone'
import Loader from '~/components/tracks/TrackLoader'

const MixCard = ({
	trackId,
	trackSlot,
	sx
}: { trackId: Track['id']; trackSlot: 0 | 1; sx?: SxProps }) => {
	const [analyzingTracks] = AppState.analyzing()
	const analyzing = analyzingTracks.includes(trackId)

	const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

	const [stems] = getAudioState[trackId].stems()

	useEffect(() => {
		// Create audioContext used by all tracks
		if (!trackId) return
		setAppState.audioContext(new AudioContext())
	})

	const mixCardHeader = (
		<Box
			sx={{
				display: 'flex',
				gap: 1,
				mb: 1,
				alignItems: 'center'
			}}
		>
			<EjectControl trackId={trackId} />
			<Typography
				sx={{
					fontSize: 'sm',
					fontWeight: 'md',
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis'
				}}
			>
				{trackName}
			</Typography>

			<BpmControl trackId={trackId} styles={{ marginLeft: 'auto' }} />
		</Box>
	)

	const mixCardFooter = (
		<Box
			sx={{
				mx: 'auto',
				mt: 1
			}}
		>
			<TrackNavControl trackId={trackId} />
		</Box>
	)

	const loaderSx = {
		p: 0,
		border: '1px solid',
		borderColor: 'action.focus',
		borderRadius: '4px',
		borderBottom: 'none',
		backgroundColor: 'background.body',
		overflow: 'hidden',
		zIndex: 1
	}

	return (
		<Card
			sx={{
				p: 1,
				borderRadius: '4px',
				border: '1px solid',
				borderColor: 'action.selected',
				backgroundColor: 'background.surface',
				...sx
			}}
		>
			{!trackId ? (
				<Dropzone sx={{ height: '100%' }} trackSlot={trackSlot} />
			) : (
				<>
					{mixCardHeader}

					{/* loader cover */}
					{!analyzing ? null : (
						<Card
							sx={{
								...loaderSx,
								zIndex: 2,
								position: 'absolute',
								inset: '40px 8px calc(100% - 67px)'
							}}
						>
							<Loader style={{ margin: 'auto' }} />
						</Card>
					)}

					{/* overview */}
					<Card
						id={`overview-container_${trackId}`}
						sx={{
							...loaderSx,
							pt: '1px',
							height: '25px'
						}}
						onClick={(e) => {
							const parents = e.currentTarget.firstElementChild as HTMLElement
							const parent = parents.children[1] as HTMLElement
							audioEvents.clickToSeek(trackId, e, parent)
						}}
					/>

					{Object.keys(stems || {}).length ? (
						<Box sx={{ mt: 1 }}>
							<StemPanel trackId={trackId} />
						</Box>
					) : (
						<Box
							sx={{
								p: 1,
								mt: 1,
								borderRadius: '4px',
								border: '1px solid',
								borderColor: 'action.selected',
								backgroundColor: 'background.level1'
							}}
						>
							<TrackPanel trackId={trackId} />
						</Box>
					)}

					{mixCardFooter}
				</>
			)}
		</Card>
	)
}

export { MixCard as default }
