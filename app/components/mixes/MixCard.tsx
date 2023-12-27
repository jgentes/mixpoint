import { audioEvents } from '~/api/audioEvents'
import { appState } from '~/api/db/appState'
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
		'p-0 border border-solid border-divider rounded bg-background overflow-hidden z-1'

	return (
		<div className="p-2 w-5/12 rounded border-1 border-divider bg-primary-50">
			{!trackId ? (
				<Dropzone className="h-full" trackSlot={trackSlot} />
			) : (
				<>
					{mixCardHeader}

					{/* loader cover */}
					{!analyzing ? null : (
						<div
							className={`${loaderClassNames} z-10 absolute inset-y-40 inset-x-8 bottom-8`}
						>
							<Loader style={{ margin: 'auto' }} />
						</div>
					)}

					{/* overview */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
					<div
						id={`overview-container_${trackId}`}
						className={`${loaderClassNames} py-1 mb-3 h-fit`}
						onClick={e => {
							const parents = e.currentTarget.firstElementChild as HTMLElement
							const parent = parents.children[1] as HTMLElement
							audioEvents.clickToSeek(trackId, e, parent)
						}}
					/>

					<div className="mt-2">
						<StemPanel trackId={trackId} />
					</div>

					<div className="p-2 mt-2 rounded-md border border-action-selected bg-background-level1">
						<TrackPanel trackId={trackId} />
					</div>

					{mixCardFooter}
				</>
			)}
		</div>
	)
}

export { MixCard as default }
