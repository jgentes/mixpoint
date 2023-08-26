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
		<Box sx={{ p: 2 }}>
			<MixCard trackId={tracks[0]} trackSlot={0} />
			<Box sx={{ display: 'flex', flexDirection: 'column' }}>
				<CrossfaderControl />
				<MixControl tracks={tracks} />
				<StemsCrossfaders />
			</Box>
			<MixCard trackId={tracks[1]} trackSlot={1} />
		</Box>
	)
}

export { MixView as default }
