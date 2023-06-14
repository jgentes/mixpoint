import { Box, Card, Typography } from '@mui/joy'
import { SxProps } from '@mui/joy/styles/types'
import { useEffect, useRef } from 'react'
import { type WaveSurferOptions } from 'wavesurfer.js'
import Minimap from 'wavesurfer.js/dist/plugins/minimap.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import { AppState, getAppState, setAppState } from '~/api/appState'
import { audioEvents } from '~/api/audioEvents'
import { Track, db, useLiveQuery } from '~/api/db/dbHandlers'
import { getPermission } from '~/api/fileHandlers'
import { initWaveform } from '~/api/renderWaveform'
import VolumeMeter from '~/components/mixes/VolumeMeter'
import {
	BeatResolutionControl,
	MixpointControl,
	OffsetControl,
	TrackTime
} from '~/components/tracks/Controls'
import Loader from '~/components/tracks/TrackLoader'
import { errorHandler } from '~/utils/notifications'
import { timeFormat } from '~/utils/tableOps'

const Waveform = ({
	trackId,
	sx
}: {
	trackId: Track['id']
	sx: SxProps
}): JSX.Element | null => {
	if (!trackId) throw errorHandler('No track to initialize.')

	const zoomviewRef = useRef(null)

	useEffect(() => {
		// Retrieve track, file and region data, then store waveform in audioState
		const init = async () => {
			const track = await db.tracks.get(trackId)
			if (!track) throw errorHandler('Could not retrieve track from database.')

			const file = await getPermission(track)
			if (!file) throw errorHandler(`Please try adding ${track.name} again.`)

			const waveformConfig: WaveSurferOptions = {
				container: zoomviewRef.current || '',
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
						height: 22,
						waveColor: [
							'rgba(117, 116, 116, 0.5)',
							'rgba(145, 145, 145, 0.8)',
							'rgba(145, 145, 145, 0.8)',
							'rgba(145, 145, 145, 0.8)'
						],
						progressColor: 'rgba(0, 0, 0, 0.25)',
						scrollParent: false,
						hideScrollbar: true,
						pixelRatio: 1
					})
				]
			}

			initWaveform({ trackId, file, waveformConfig })
		}

		// prevent duplication on re-render while loading
		const [analyzingTracks] = getAppState.analyzing()
		const analyzing = analyzingTracks.includes(trackId)

		if (!analyzing) init()

		// add track to analyzing state
		setAppState.analyzing((prev) =>
			prev.includes(trackId) ? prev : [...prev, trackId]
		)

		return () => audioEvents.destroy(trackId)
	}, [trackId])

	return (
		<Card
			ref={zoomviewRef}
			className='zoomview-container'
			sx={{
				...sx,
				zIndex: 1
			}}
			onClick={(e) => audioEvents.clickToSeek(trackId, e)}
			onWheel={(e) =>
				audioEvents.seek(trackId, undefined, e.deltaY > 0 ? 'next' : 'previous')
			}
		/>
	)
}

const TrackPanel = ({ trackId }: { trackId: Track['id'] }) => {
	const [analyzingTracks] = AppState.analyzing()
	const analyzing = analyzingTracks.includes(trackId)

	const { duration = 0 } =
		useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

	const trackHeader = (
		<Box
			sx={{
				display: 'flex',
				gap: 1,
				mb: 1,
				alignItems: 'center'
			}}
		>
			<Typography
				sx={{
					fontSize: 'xs',
					fontWeight: 'md',
					pl: '3px',
					color: 'text.secondary'
				}}
			>
				Time:
			</Typography>
			<TrackTime sx={{ mr: '-4px' }} trackId={trackId} />
			<Typography sx={{ fontSize: 'xs', color: 'text.secondary' }}>
				/ {timeFormat(duration).slice(0, -3)}
			</Typography>
			<BeatResolutionControl trackId={trackId} sx={{ marginLeft: 'auto' }} />
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
		<>
			{trackHeader}

			{/* loader cover */}
			{!analyzing ? null : (
				<Card
					sx={{
						...loaderSx,
						zIndex: 2,
						position: 'absolute',
						inset: '262px 16px calc(100% - 343px)'
					}}
				>
					<Loader style={{ margin: 'auto' }} />
				</Card>
			)}

			<Waveform trackId={trackId} sx={{ ...loaderSx, height: '80px' }} />

			<VolumeMeter trackId={trackId} />

			{trackFooter}
		</>
	)
}

export { TrackPanel as default }
