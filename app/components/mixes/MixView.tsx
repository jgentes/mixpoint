import { Box } from '@mui/joy'
import { MixPrefs } from '~/api/db/dbHandlers'
import MixCard from '~/components/mixes/MixCard'
import {
	CrossfaderControl,
	MixControl,
	StemsCrossfaders
} from '~/components/tracks/Controls'

const MixView = ({ tracks }: { tracks: MixPrefs['tracks'] }) => {
	if (!tracks?.length) return null

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'space-between'
			}}
		>
			<MixCard trackId={tracks[0]} trackSlot={0} />
			<Box sx={{ display: 'flex', flexDirection: 'column', mt: 3 }}>
				<CrossfaderControl />
				<MixControl tracks={tracks} />
				<StemsCrossfaders />
			</Box>
			<MixCard trackId={tracks[1]} trackSlot={1} />
		</Box>
	)
}

export { MixView as default }
