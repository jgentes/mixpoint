import WavesurferPlayer, { type WavesurferProps } from '@wavesurfer/react'
import { useEffect, useState } from 'react'
import type WaveSurfer from 'wavesurfer.js'
import Minimap from 'wavesurfer.js/dist/plugins/minimap.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import { audioEvents } from '~/api/handlers/audioEvents.client'
import type { Stem, Track } from '~/api/handlers/dbHandlers'
import { getPermission } from '~/api/handlers/fileHandlers'

const Waveform = ({
  trackId,
  stem
}: {
  trackId: Track['id']
  stem?: Stem
}) => {
  // an Audio object is required for Wavesurfer to use Web Audio
  const [file, setFile] = useState<File | undefined>()

  useEffect(() => {
    const getFile = async () => {
      const file = await getPermission(trackId, stem)
      setFile(file)
    }

    getFile()
  }, [trackId, stem])

  let waveformProps: WavesurferProps = {
    media: file ? new Audio(URL.createObjectURL(file)) : undefined,
    onReady: (waveform: WaveSurfer) =>
      audioEvents.onReady(waveform, trackId, stem),
    height: 60,
    autoScroll: true,
    autoCenter: true,
    hideScrollbar: false,
    barWidth: 2,
    barHeight: 0.9,
    barGap: 1,
    cursorColor: '#555',
    interact: false,
    waveColor: [
      'rgb(200, 165, 49)',
      'rgb(211, 194, 138)',
      'rgb(189, 60, 0)',
      'rgb(189, 60, 0)',
      'rgb(189, 60, 0)',
      'rgb(189, 60, 0)'
    ],
    progressColor: 'rgba(200, 165, 49, 0.5)'
  }

  // apply props for stems vs. track
  waveformProps = stem
    ? {
        ...waveformProps,
        height: 17,
        fillParent: true,
        hideScrollbar: true,
        barWidth: 1,
        normalize: true
      }
    : {
        ...waveformProps,
        plugins: [
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
        ]
      }

  return <WavesurferPlayer {...waveformProps} />
}

export { Waveform }
