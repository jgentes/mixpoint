import { audioState } from '~/api/db/appState.client'
import { Track, db, useLiveQuery } from '~/api/db/dbHandlers.client'
import { Waveform } from '~/api/renderWaveform.client'
import VolumeMeter from '~/components/mixes/VolumeMeter'
import {
	BeatResolutionControl,
	MixpointControl,
	OffsetControl,
	TrackTime,
	ZoomSelectControl
} from '~/components/tracks/Controls'
import { timeFormat } from '~/utils/tableOps'

const TrackPanel = ({ trackId }: { trackId: Track['id'] }) => {
	const { duration = 0 } =
		useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

	const [stemState] = audioState[trackId].stemState()

	const trackHeader = (
		<div className="flex justify-between mb-2 items-center">
			<div className="flex w-36">
				<div className="text-xs font-medium text-default-600">Time:</div>
				<TrackTime
					className="px-1 text-xs text-default-600"
					trackId={trackId}
				/>
				<div className="text-xs text-default-600 whitespace-nowrap">
					/ {timeFormat(duration)}
				</div>
			</div>

			{stemState !== 'ready' ? null : <ZoomSelectControl trackId={trackId} />}

			<BeatResolutionControl trackId={trackId} />
		</div>
	)

	const trackFooter = (
		<div className="flex gap-1 mt-1 items-center justify-between">
			<MixpointControl trackId={trackId} />
			<OffsetControl trackId={trackId} className="ml-auto w-36" />
		</div>
	)

	return (
		<>
			{trackHeader}

			<Waveform trackId={trackId} />

			<VolumeMeter trackId={trackId} />

			{trackFooter}
		</>
	)
}

export { TrackPanel as default }
