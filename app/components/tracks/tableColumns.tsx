import { Icon } from '@iconify-icon/react'
import { Box, Chip } from '@mui/joy'
import { TableCellProps } from '@mui/material'
import { SxProps } from '@mui/material/styles'
import moment from 'moment'
import { audioEvents } from '~/api/audioEvents'
import { analyzeTracks } from '~/api/audioHandlers'
import { appState, setAppState } from '~/api/db/appState'
import { Track, addToMix, getPrefs, useLiveQuery } from '~/api/db/dbHandlers'
import TrackLoader from '~/components/tracks/TrackLoader'
import { formatMinutes, rowClick } from '~/utils/tableOps'

const createColumnDefinitions = (): {
	dbKey: keyof Track
	label: string
	padding: TableCellProps['padding']
	align: TableCellProps['align']
	width: TableCellProps['width']
	sx?: SxProps
	onClick?: (t: Track) => void
	formatter: (t: Track) => string | React.ReactNode
}[] => {
	const analyzeButton = (t: Track) => (
		<Chip
			variant="outlined"
			startDecorator={<Icon icon="material-symbols:graphic-eq" height="16px" />}
			size="sm"
			onClick={() => analyzeTracks([t])}
		>
			Analyze
		</Chip>
	)

	const addToMixHandler = async (t: Track) => {
		const { tracks = [] } = await getPrefs('mix')

		await addToMix(t)

		// if this is the first track in the mix, leave the drawer open
		if (!tracks.length) setAppState.openDrawer(true)
	}

	const AddToMixButton = ({ track }: { track: Track }) => {
		const [analyzingTracks] = appState.analyzing()

		const { tracks = [] } = useLiveQuery(() => getPrefs('mix')) || {}

		const isInMix = tracks.includes(track.id)

		// Prevent user from adding a new track before previous added track finishes analyzing
		const isBeingAnalyzed = tracks.some(id => analyzingTracks.includes(id))

		return (
			<Chip
				variant="outlined"
				className={isInMix ? 'visible' : 'visibleOnHover'}
				startDecorator={
					isInMix ? (
						<Icon icon="material-symbols:check" height="16px" />
					) : (
						<Icon icon="material-symbols:add" height="16px" />
					)
				}
				color={isInMix ? 'success' : 'primary'}
				size="sm"
				disabled={isBeingAnalyzed}
				sx={{
					maxHeight: '30px',
					alignSelf: 'center'
				}}
				onClick={() => {
					!isInMix ? addToMixHandler(track) : audioEvents.ejectTrack(track.id)
				}}
			>
				{`Add${isInMix ? 'ed' : ' to Mix'}`}
			</Chip>
		)
	}

	const BpmFormatter = (t: Track) => {
		const [analyzingTracks] = appState.analyzing()

		return (
			t.bpm?.toFixed(0) ||
			(!analyzingTracks.some(id => id === t.id) ? (
				analyzeButton(t)
			) : (
				<TrackLoader style={{ margin: 'auto', height: '15px' }} />
			))
		)
	}

	return [
		{
			dbKey: 'name',
			label: 'Track name',
			align: 'left',
			padding: 'none',
			width: '60%',
			formatter: t => (
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						fontSize: '.85rem'
					}}
				>
					<div
						onClick={event => rowClick(event, t.id)}
						onKeyUp={event => rowClick(event, t.id)}
					>
						{t.name?.replace(/\.[^/.]+$/, '') || 'Track name not found'}
					</div>
					<AddToMixButton track={t} />
				</Box>
			)
		},
		{
			dbKey: 'bpm',
			label: 'BPM',
			align: 'center',
			padding: 'normal',
			width: '10%',
			formatter: BpmFormatter
		},
		{
			dbKey: 'duration',
			label: 'Duration',
			align: 'center',
			padding: 'normal',
			width: '10%',
			formatter: t => t.duration && formatMinutes(t.duration / 60)
		},
		{
			dbKey: 'mixpoints',
			label: 'Mixes',
			align: 'center',
			padding: 'normal',
			width: '5%',
			formatter: t => ''
		},
		{
			dbKey: 'sets',
			label: 'Sets',
			align: 'center',
			padding: 'normal',
			width: '5%',
			formatter: t => ''
		},
		{
			dbKey: 'lastModified',
			label: 'Updated',
			align: 'right',
			padding: 'normal',
			width: '10%',
			sx: { whiteSpace: 'nowrap' },
			formatter: t => moment(t.lastModified).fromNow()
		}
	]
}

export { createColumnDefinitions }
