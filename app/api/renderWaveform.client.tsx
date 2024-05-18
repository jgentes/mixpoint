import WavesurferPlayer from '@wavesurfer/react'
import { useEffect, useState } from 'react'
import type WaveSurfer from 'wavesurfer.js'
import Minimap from 'wavesurfer.js/dist/plugins/minimap.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import { audioEvents } from '~/api/handlers/audioEvents.client'
import type { Stem, Track } from '~/api/handlers/dbHandlers'
import { getPermission } from '~/api/handlers/fileHandlers'
import { mixState } from '~/api/models/appState.client'

const Waveform = ({
  trackId,
  stem,
  overviewRef
}: {
  trackId: Track['id']
  stem?: Stem
  overviewRef?: React.RefObject<HTMLDivElement>
}) => {
  // an Audio object is required for Wavesurfer to use Web Audio
  const [file, setFile] = useState<File | undefined>()

  const { stemZoom } = mixState.trackState[trackId]

  useEffect(() => {
    const getFile = async () =>
      setFile(await getPermission(trackId, stem || stemZoom))

    getFile()
  }, [trackId, stem, stemZoom])

  return (
    <WavesurferPlayer
      autoScroll={true}
      autoCenter={true}
      barGap={1}
      barHeight={0.9}
      interact={false}
      cursorColor={'#555'}
      progressColor={'rgba(200, 165, 49, 0.5)'}
      waveColor={[
        'rgb(200, 165, 49)',
        'rgb(211, 194, 138)',
        'rgb(189, 60, 0)',
        'rgb(189, 60, 0)',
        'rgb(189, 60, 0)',
        'rgb(189, 60, 0)'
      ]}
      media={file ? new Audio(URL.createObjectURL(file)) : undefined}
      onReady={(waveform: WaveSurfer) =>
        audioEvents.onReady(waveform, trackId, stem)
      }
      fillParent={!!stem}
      hideScrollbar={!!stem}
      normalize={!!stem}
      height={stem ? 17 : 60}
      barWidth={stem ? 1 : 2}
      plugins={
        stem
          ? []
          : [
              // Do not change the order of plugins! They are referenced by index :(
              RegionsPlugin.create(),
              Minimap.create({
                container: overviewRef?.current || undefined,
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
    />
  )
}

export { Waveform }
