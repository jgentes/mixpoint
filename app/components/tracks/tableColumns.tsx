import { Icon } from '@iconify-icon/react'
import { Button, Chip, TableColumnProps } from '@nextui-org/react'
import { audioEvents } from '~/api/audioEvents'
import { analyzeTracks } from '~/api/audioHandlers'
import { appState, setAppState } from '~/api/db/appState'
import { Track, addToMix, getPrefs, useLiveQuery } from '~/api/db/dbHandlers'

const analyzeButton = (t: Track) => (
	<Chip
		variant="bordered"
		color="primary"
		startContent={<Icon icon="material-symbols:graphic-eq" height="16px" />}
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
	const isBeingAnalyzed = tracks.some(id => analyzingTracks.has(id))

	return (
		<Button
			size="sm"
			radius="sm"
			variant="light"
			isDisabled={isBeingAnalyzed}
			className={`max-h-30 self-center border-1  h-6 px-2 gap-1 ${
				isInMix
					? 'border-success-300 text-success-700'
					: 'border-primary-300 text-primary-700'
			}`}
			startContent={
				isInMix ? (
					<Icon icon="material-symbols:check" height="16px" />
				) : (
					<Icon icon="material-symbols:add" height="16px" />
				)
			}
			onClick={() => {
				!isInMix ? addToMixHandler(track) : audioEvents.ejectTrack(track.id)
			}}
		>
			{`Add${isInMix ? 'ed' : ' to Mix'}`}
		</Button>
	)
}

const createColumnDefinitions = (): {
	dbKey: keyof Track
	label: string
	align: TableColumnProps<string>['align']
	width: TableColumnProps<string>['width']
	onClick?: (t: Track) => void
}[] => [
	{
		dbKey: 'name',
		label: 'Track name',
		align: 'start',
		width: '60%'
	},
	{
		dbKey: 'bpm',
		label: 'BPM',
		align: 'center',
		width: '10%'
	},
	{
		dbKey: 'duration',
		label: 'Duration',
		align: 'center',
		width: '10%'
	},
	{
		dbKey: 'mixpoints',
		label: 'Mixes',
		align: 'center',
		width: '5%'
	},
	{
		dbKey: 'sets',
		label: 'Sets',
		align: 'center',
		width: '5%'
	},
	{
		dbKey: 'lastModified',
		label: 'Updated',
		align: 'end',
		width: '10%'
	}
]

export { createColumnDefinitions, analyzeButton, AddToMixButton }
