import MixCard from '~/components/mixes/MixCard'
import TrackPanel from '~/components/mixes/TrackPanel'
import { TrackNavControl } from '~/components/tracks/Controls'
const MixCardFooter = () => (
  <div className="text-center mt-2">
    <TrackNavControl trackId={trackId} />
  </div>
)
const MixView = () => (
  <>
    <div className="flex gap-4 m-4">
      <MixCard trackSlot={0} />
      <MixCard trackSlot={1} />
    </div>
    <div className="flex gap-4 m-4">
      <div className="p-2 mt-2 rounded border-1 border-divider bg-background">
        <TrackPanel trackId={trackId} />
      </div>

      <MixCardFooter />
    </div>
  </>
)

export { MixView as default }
