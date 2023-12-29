import { audioEvents } from '~/api/audioEvents'
import { appState } from '~/api/db/appState'
import { Track, getTrackName, useLiveQuery } from '~/api/db/dbHandlers'
import { ProgressBar } from '~/components/Loader'
import StemPanel from '~/components/mixes/StemPanel'
import TrackPanel from '~/components/mixes/TrackPanel'
import {
	BpmControl,
	EjectControl,
	TrackNavControl
} from '~/components/tracks/Controls'
import Dropzone from '~/components/tracks/Dropzone'

const MixCard = ({
	trackId,
	trackSlot
}: { trackId: Track['id']; trackSlot: 0 | 1 }) => {
	const [analyzingTracks] = appState.analyzing()
	const analyzing = analyzingTracks.has(trackId)

	const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

	const mixCardHeader = (
		<div className="flex mb-3 justify-between">
			<div className="flex gap-2">
				<EjectControl trackId={trackId} />
				<div className="text-md font-medium whitespace-nowrap overflow-hidden overflow-ellipsis">
					{trackName}
				</div>
			</div>

			<BpmControl trackId={trackId} className="w-28" />
		</div>
	)

	const mixCardFooter = (
		<div className="mx-auto mt-2">
			<TrackNavControl trackId={trackId} />
		</div>
	)

	const loaderClassNames =
		'p-0 border-1 border-divider rounded bg-background overflow-hidden'

	return (
		<div className="p-2 w-5/12 rounded border-1 border-divider bg-primary">
			{!trackId ? (
				<Dropzone className="h-full" trackSlot={trackSlot} />
			) : (
				<>
					{mixCardHeader}

					{/* overview */}
					<div
						id={`overview-container_${trackId}`}
						className={`${loaderClassNames} relative z-1 py-1 mb-3 h-fit`}
						onClick={e => {
							const parents = e.currentTarget.firstElementChild as HTMLElement
							const parent = parents.children[1] as HTMLElement
							audioEvents.clickToSeek(trackId, e, parent)
						}}
					>
						{!analyzing ? null : (
							<div
								className={`${loaderClassNames} absolute z-10 w-full h-8 top-0`}
							>
								<div className="relative w-1/2 top-1/2 -mt-0.5 m-auto">
									<ProgressBar />
								</div>
							</div>
						)}
					</div>

					<div className="mt-2">
						<StemPanel trackId={trackId} />
					</div>

					<div className="p-2 mt-2 rounded border-1 border-divider bg-background">
						<TrackPanel trackId={trackId} />
					</div>

					{mixCardFooter}
				</>
			)}
		</div>
	)
}

export { MixCard as default }
