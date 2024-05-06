import WavesurferPlayer, { useWavesurfer } from '@wavesurfer/react'
import {
  type MutableRefObject,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import WaveSurfer, { type WaveSurferOptions } from 'wavesurfer.js'
import Minimap from 'wavesurfer.js/dist/plugins/minimap.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import { audioEvents } from '~/api/handlers/audioEvents.client'
import {
  type Stem,
  type Track,
  db,
  useLiveQuery
} from '~/api/handlers/dbHandlers'
import { getPermission } from '~/api/handlers/fileHandlers'
import { validateTrackStemAccess } from '~/api/handlers/fileHandlers'
import { appState, audioState } from '~/api/models/appState.client'
import { ProgressBar } from '~/components/layout/Loader'
import { errorHandler } from '~/utils/notifications'

const Waveform = ({
  trackId,
  stem
}: {
  trackId: Track['id']
  stem?: Stem
}) => {
  // an Audio object is required for Wavesurfer to use Web Audio
  const { file } =
    useLiveQuery(() => db.trackCache.get(trackId), [trackId]) || {}

  if (!file) getPermission(trackId)

  //validateTrackStemAccess(trackId)

  if (!trackId || !file) return null

  const analyzing = appState.analyzing.has(trackId)

  const containerClass =
    'p-0 border-1 border-divider rounded bg-default-50 overflow-hidden'

  return analyzing ? (
    <div className={`${containerClass} absolute z-10 w-full h-20 top-0`}>
      <div className="relative w-1/2 top-1/2 -mt-0.5 m-auto">
        <ProgressBar />
      </div>
    </div>
  ) : (
    <div
      className={`${containerClass} relative h-20 z-1`}
      onClick={e => {
        const parent = e.currentTarget.firstElementChild as HTMLElement
        audioEvents.clickToSeek(trackId, e, parent)
      }}
      onWheel={e =>
        audioEvents.seek(trackId, 0, e.deltaY > 0 ? 'next' : 'previous')
      }
    >
      <WavesurferPlayer
        media={file ? new Audio(URL.createObjectURL(file)) : undefined}
        onReady={waveform => audioEvents.onReady(waveform, trackId, stem)}
        height={60}
        autoScroll={true}
        autoCenter={true}
        hideScrollbar={false}
        barWidth={2}
        barHeight={0.9}
        barGap={1}
        cursorColor="#555"
        interact={false}
        waveColor={[
          'rgb(200, 165, 49)',
          'rgb(211, 194, 138)',
          'rgb(189, 60, 0)',
          'rgb(189, 60, 0)',
          'rgb(189, 60, 0)',
          'rgb(189, 60, 0)'
        ]}
        progressColor="rgba(200, 165, 49, 0.5)"
        plugins={[
          // Do not change the order of plugins! They are referenced by index :(
          RegionsPlugin.create(),
          Minimap.create({
            //@ts-ignore wavesurfer typing issue
            container: `#overview-container_${trackId}${
              stem ? `_${stem}` : ''
            }`,
            height: 22,
            waveColor: [
              'rgba(117, 116, 116, 0.5)',
              'rgba(145, 145, 145, 0.8)',
              'rgba(145, 145, 145, 0.8)',
              'rgba(145, 145, 145, 0.8)'
            ],
            progressColor: 'rgba(125, 125, 125, 0.25)',
            hideScrollbar: true
          })
        ]}
      />
    </div>
  )
}

export { Waveform }
