import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import {
  type Stem,
  getTrackName,
  useLiveQuery
} from '~/api/handlers/dbHandlers'
import { getPermission, getStemFiles } from '~/api/handlers/fileHandlers'
import { mixState } from '~/api/models/appState.client'
import StemPanel from '~/components/mixes/StemPanel'
import StemTracks from '~/components/mixes/StemPanel copy'
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

  const StemMultiTrack = () => {
    const [files, setFiles] = useState<Partial<Record<Stem, File>>>()

    useEffect(() => {
      const getFile = async () => setFiles(await getStemFiles(trackId))
      getFile()
    }, [])

    return files ? <StemTracks trackId={trackId} files={files} /> : null
  }

  return (
    <div
      style={{ width: 'calc(50% - .5rem)' }} // tailwind doesn't handle calc well
      className="p-3 rounded border-1 border-divider bg-primary-50"
    >
      {!trackId ? (
        <Dropzone className="h-full" trackSlot={trackSlot} />
      ) : (
        <>
          <MixCardHeader />

          <div className="mt-2">
            <StemMultiTrack />
          </div>

          {/* <div className="p-2 mt-2 rounded border-1 border-divider bg-background">
            <TrackPanel trackId={trackId} />
          </div> */}

          <MixCardFooter />
        </>
      )}
    </div>
  )
}

export { MixCard as default }
