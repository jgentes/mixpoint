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
  files
}: { trackId: Track['id']; files: Partial<Record<Stem, File>> }) => {
  if (!trackId) throw errorHandler('No track ID provided to StemPanel')
  const stemRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!stemRef.current) return

    const stemTracks = STEMS.map(stemType => ({
      id: stemType,
      draggable: false,
      startPosition: 0, // start time relative to the entire multitrack
      url: files[stemType]
        ? URL.createObjectURL(files[stemType] as Blob)
        : undefined,
      intro: {
        endTime: 0,
        label: stemType[0].toUpperCase() + stemType.slice(1).toLowerCase(),
        color: '#FFE56E'
      },
      options: {
        height: 80,
        barGap: 1,
        barHeight: 0.9,
        barWidth: 2,
        cursorColor: '#555',
        progressColor: 'rgba(200, 165, 49, 0.5)',
        waveColor: [
          'rgb(200, 165, 49)',
          'rgb(211, 194, 138)',
          'rgb(189, 60, 0)',
          'rgb(189, 60, 0)',
          'rgb(189, 60, 0)'
        ]
      }
    }))

    const multitrack = MultiTrack.create(stemTracks, {
      container: stemRef.current,
      minPxPerSec: 1, // zoom level
      cursorWidth: 2,
      cursorColor: '#D72F21',
      trackBorderColor: '#ffffff26',
      dragBounds: true,
      envelopeOptions: {
        lineColor: 'rgba(255, 0, 0, 0.7)',
        dragPointSize: window.innerWidth < 600 ? 20 : 10,
        dragPointFill: 'rgba(255, 255, 255, 0.8)',
        dragPointStroke: 'rgba(255, 255, 255, 0.3)'
      }
    })

    return () => multitrack?.destroy()
  }, [files])

  if (!audioState[trackId]) return null

  // add to analyzing state
  uiState.stemsAnalyzing.add(trackId)

  validateTrackStemAccess(trackId)

  const { stemState } = useSnapshot(audioState[trackId])

  return stemState && stemState === 'ready' ? (
    <div className="flex flex-col gap-1 mb-3 h-128 rounded border-1 border-divider bg-background">
      <div ref={stemRef} />
    </div>
  ) : (
    <StemAccessButton trackId={trackId} />
  )
}

export { StemTracks as default }
