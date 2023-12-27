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
		<div className="flex justify-between mb-1 items-center">
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
		<div className="flex gap-1 mt-1 items-center">
			<MixpointControl trackId={trackId} />
			<OffsetControl trackId={trackId} className="ml-auto" />
		</div>
	)

	const loaderClassNames =
		'p-0 border border-action-focus rounded-md border-b-0 bg-background-body overflow-hidden z-1'

	const loaderCover = (
		<div
			className={`${loaderClassNames} z-2 absolute inset-261px 16px calc(100% - 339px)`}
		>
			<Loader className="m-auto" />
		</div>
	)

	return (
		<>
			{trackHeader}

			{analyzing ? loaderCover : null}

			<Waveform trackId={trackId} className={`${loaderClassNames} h-20`} />

			<VolumeMeter trackId={trackId} />

			{trackFooter}
		</>
	)
}

export { TrackPanel as default }
