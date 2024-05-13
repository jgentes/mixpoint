import { useSnapshot } from 'valtio'
import { mixState } from '~/api/models/appState.client'
import MixCard from '~/components/mixes/MixCard'
import {
  CrossfaderControl,
  MixControl,
  StemsCrossfaders
} from '~/components/tracks/Controls'

const MixView = () => {
  const { tracks } = useSnapshot(mixState)

  return !tracks?.length ? null : (
    <div className="flex justify-between m-4">
      <MixCard trackId={tracks[0]} trackSlot={0} />
      <div className="flex flex-col mt-2">
        <CrossfaderControl />
        <MixControl tracks={tracks} />
        <StemsCrossfaders />
      </div>
      <MixCard trackId={tracks[1]} trackSlot={1} />
    </div>
  )
}

export { MixView as default }
