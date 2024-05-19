import MixCard from '~/components/mixes/MixCard'
import {
  CrossfaderControl,
  MixControl,
  StemsCrossfaders
} from '~/components/tracks/Controls'

const MixView = () => (
  <div className="flex justify-between m-4">
    <MixCard trackSlot={0} />
    <div className="flex flex-col mt-2">
      <CrossfaderControl />
      <MixControl />
      <StemsCrossfaders />
    </div>
    <MixCard trackSlot={1} />
  </div>
)

export { MixView as default }
