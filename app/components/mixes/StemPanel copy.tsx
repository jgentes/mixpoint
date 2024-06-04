import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import MultiTrack from 'wavesurfer-multitrack'
import { STEMS, type Stem, type Track } from '~/api/handlers/dbHandlers'
import {
  getPermission,
  validateTrackStemAccess
} from '~/api/handlers/fileHandlers'
import { audioState, uiState } from '~/api/models/appState.client'
import StemAccessButton from '~/components/mixes/StemAccessButton.client'
import { StemControl } from '~/components/tracks/Controls'
import { errorHandler } from '~/utils/notifications'

const StemTracks = ({
  trackId,
  file
}: { trackId: Track['id']; file: File | undefined }) => {
  if (!trackId) throw errorHandler('No track ID provided to StemPanel')
  if (!audioState[trackId]) return null

  // add to analyzing state
  uiState.stemsAnalyzing.add(trackId)

  validateTrackStemAccess(trackId)

  const { stemState } = useSnapshot(audioState[trackId])
  const stemRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!stemRef.current) return

    const multitrack = MultiTrack.create(
      [
        {
          id: 'bass',
          draggable: false,
          startPosition: 0, // start time relative to the entire multitrack
          url: file ? URL.createObjectURL(file) : undefined
        }
      ],
      {
        container: stemRef.current,
        minPxPerSec: 10, // zoom level
        rightButtonDrag: false, // set to true to drag with right mouse button
        cursorWidth: 2,
        cursorColor: '#D72F21',
        trackBackground: '#2D2D2D',
        trackBorderColor: '#7C7C7C',
        dragBounds: true,
        envelopeOptions: {
          lineColor: 'rgba(255, 0, 0, 0.7)',
          dragPointSize: window.innerWidth < 600 ? 20 : 10,
          dragPointFill: 'rgba(255, 255, 255, 0.8)',
          dragPointStroke: 'rgba(255, 255, 255, 0.3)'
        }
      }
    )

    return () => multitrack?.destroy()
  }, [file])

  return stemState && stemState === 'ready' ? (
    <div className="flex flex-col gap-1 mb-3 h-32 rounded border-1 border-divider bg-background">
      <div ref={stemRef} />
    </div>
  ) : (
    <StemAccessButton trackId={trackId} />
  )
}

export { StemTracks as default }
