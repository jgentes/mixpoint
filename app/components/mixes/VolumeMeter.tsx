import { Box } from '@mui/joy'
import { audioState } from '~/api/db/appState'
import { Stem, Track } from '~/api/db/dbHandlers'

const VolumeMeter = ({
	trackId,
	stemType
}: {
	trackId: Track['id']
	stemType?: Stem
}) => {
	if (!trackId) return null

	const [volumeMeter = 0] = stemType
		? audioState[trackId].stems[stemType].volumeMeter()
		: audioState[trackId].volumeMeter()

	return (
		<div
			id={`volume-container_${trackId}${stemType || ''}`}
			style={{ position: 'relative', height: '2px', margin: '1px' }}
		>
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					zIndex: 1,
					background:
						'linear-gradient(to right, rgba(30, 150, 0, .75) 30%, rgba(255, 242, 0, .75) 80%, rgba(255, 0, 0, .75) 99%)'
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					top: 0,
					right: 0,
					width: `${100 - volumeMeter * 100}%`,
					height: '100%',
					zIndex: 2,
					backgroundColor: 'background.level1'
				}}
			/>
		</div>
	)
}

export { VolumeMeter as default }
