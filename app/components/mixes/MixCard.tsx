import { useSnapshot } from 'valtio'
import { getTrackName, useLiveQuery } from '~/api/handlers/dbHandlers'
import { mixState } from '~/api/models/appState.client'
import StemPanel from '~/components/mixes/StemPanel'
import TrackPanel from '~/components/mixes/TrackPanel'
import {
  BpmControl,
  EjectControl,
  TrackNavControl
} from '~/components/tracks/Controls'
import Dropzone from '~/components/tracks/Dropzone'

const MixCard = ({ trackSlot }: { trackSlot: 0 | 1 }) => {
  const trackId = useSnapshot(mixState).tracks[trackSlot]

  const MixCardHeader = () => {
    const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

    return (
      <div className="flex mb-3 gap-2 justify-between">
        <EjectControl trackId={trackId} />
        <div className="text-md font-medium whitespace-nowrap overflow-hidden overflow-ellipsis flex-grow">
          {trackName}
        </div>
        <BpmControl trackId={trackId} className="w-28" />
      </div>
    )
  }

  const MixCardFooter = () => (
    <div className="text-center mt-2">
      <TrackNavControl trackId={trackId} />
    </div>
  )

  return (
    <div className="p-3 w-5/12 rounded border-1 border-divider bg-primary-50">
      {!trackId ? (
        <Dropzone className="h-full" trackSlot={trackSlot} />
      ) : (
        <>
          <MixCardHeader />

          <div className="mt-2">
            <StemPanel trackId={trackId} />
          </div>

          <div className="p-2 mt-2 rounded border-1 border-divider bg-background">
            <TrackPanel trackId={trackId} />
          </div>

          <MixCardFooter />
        </>
      )}
    </div>
  )
}

export { MixCard as default }
