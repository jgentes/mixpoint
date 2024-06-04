import MixCard from '~/components/mixes/MixCard'
import MixCardOverview from '~/components/mixes/MixOverview'
import TrackOverview from '~/components/mixes/TrackOverview'

const MixView = () => (
  <div className="flex flex-col m-2">
    <div className="flex m-2 gap-4">
      <MixCard trackSlot={0} />
      <MixCard trackSlot={1} />
    </div>
    <div className="p-3 m-2 rounded border-1 border-divider bg-primary-50 overflow-auto">
      <TrackOverview trackSlot={0} />
      <TrackOverview trackSlot={1} />
    </div>
  </div>
)

export { MixView as default }
