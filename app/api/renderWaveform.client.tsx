import { useEffect } from 'react'
import WaveSurfer, { type WaveSurferOptions } from 'wavesurfer.js'
import Minimap from 'wavesurfer.js/dist/plugins/minimap.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import { audioEvents } from '~/api/audioEvents.client'
import {
  appState,
  getAppState,
  getAudioState,
  setAppState,
  setAudioState
} from '~/api/db/appState.client'
import { Stem, Track, db } from '~/api/db/dbHandlers'
import { getPermission } from '~/api/fileHandlers'
import { validateTrackStemAccess } from '~/api/fileHandlers'
import { ProgressBar } from '~/components/Loader'
import { errorHandler } from '~/utils/notifications'

const PRIMARY_WAVEFORM_CONFIG = (trackId: Track['id']): WaveSurferOptions => ({
  container: `#zoomview-container_${trackId}`,
  height: 60,
  autoScroll: true,
  autoCenter: true,
  hideScrollbar: false,
  barWidth: 2,
  barHeight: 0.9,
  barGap: 1,
  plugins: [
    // Do not change the order of plugins! They are referenced by index :(
    RegionsPlugin.create(),
    Minimap.create({
      container: `#overview-container_${trackId}`,
      height: 22,
      waveColor: [
        'rgba(117, 116, 116, 0.5)',
        'rgba(145, 145, 145, 0.8)',
        'rgba(145, 145, 145, 0.8)',
        'rgba(145, 145, 145, 0.8)'
      ],
      progressColor: 'rgba(0, 0, 0, 0.25)',
      hideScrollbar: true
    })

    // Playhead.create({
    // 	moveOnSeek: true,
    // 	returnOnPause: false,
    // 	draw: true,
    // }),
    // CursorPlugin.create({
    // 	showTime: true,
    // 	opacity: "1",
    // 	customShowTimeStyle: {
    // 		color: "#eee",
    // 		padding: "0 4px",
    // 		"font-size": "10px",
    // 		backgroundColor: "rgba(0, 0, 0, 0.3)",
    // 	},
    // }),
  ]
})

// This function accepts either a full track (with no stem) or an individual stem ('bass', etc)
const initWaveform = async ({
  trackId,
  file,
  stem,
  waveformConfig = PRIMARY_WAVEFORM_CONFIG(trackId)
}: {
  trackId: Track['id']
  file: File
  stem?: Stem
  waveformConfig?: WaveSurferOptions
}): Promise<void> => {
  if (!trackId) throw errorHandler('No track ID provided to initWaveform')

  // an Audio object is required for Wavesurfer to use Web Audio
  const media = new Audio(URL.createObjectURL(file))

  const config: WaveSurferOptions = {
    media,
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
    progressColor: 'rgba(200, 165, 49, 0.5)',
    ...waveformConfig
  }

  const waveform = WaveSurfer.create(config)

  // Save waveform in audioState to track user interactions with the waveform and show progress
  if (stem) {
    await setAudioState[trackId].stems[stem as Stem]({
      waveform,
      volume: 1,
      volumeMeter: 0,
      mute: false
    })
  } else {
    await setAudioState[trackId].waveform(waveform)
  }

  waveform.once('ready', () => audioEvents.onReady(trackId, stem))
}

const initAudioContext = ({
  trackId,
  stem,
  media
}: { trackId: Track['id']; stem?: Stem; media: HTMLAudioElement }) => {
  // audioContext cannot be initialized without user intervention, so this function is called when the audio is played for the first time per track or stem

  // Ensure this function is not called twice for the same track or stem
  const [gainExists] = stem
    ? getAudioState[trackId].stems[stem].gainNode()
    : getAudioState[trackId].gainNode()

  if (gainExists) return

  let [audioContext] = getAppState.audioContext()
  if (!audioContext) {
    audioContext = new AudioContext()
    setAppState.audioContext(audioContext)
  }

  // gainNode is used to control volume of all stems at once
  const gainNode = audioContext.createGain()
  gainNode.connect(audioContext.destination)

  const analyserNode = audioContext.createAnalyser()

  // Connect the audio to the analyzer
  media.addEventListener(
    'play',
    async () => {
      // Create a MediaElementSourceNode from the audio element
      const mediaNode = audioContext?.createMediaElementSource(media)

      mediaNode?.connect(gainNode)
      mediaNode?.connect(analyserNode)
    },
    { once: true }
  )

  // Save waveform in audioState to track user interactions with the waveform and show progress
  if (stem) {
    setAudioState[trackId].stems[stem as Stem].gainNode(gainNode)
    setAudioState[trackId].stems[stem as Stem].analyserNode(analyserNode)
  } else {
    setAudioState[trackId].analyserNode(analyserNode)
    setAudioState[trackId].gainNode(gainNode)
  }
}

const TrackView = ({ trackId }: { trackId: Track['id'] }) => {
  const [analyzingTracks] = appState.analyzing()
  const analyzing = analyzingTracks.has(trackId)

  const containerClass =
    'p-0 border-1 border-divider rounded bg-default-50 overflow-hidden'

  return (
    <div
      id={`zoomview-container_${trackId}`}
      className={`${containerClass} relative h-20 z-1`}
      onClick={e => {
        const parent = e.currentTarget.firstElementChild as HTMLElement
        audioEvents.clickToSeek(trackId, e, parent)
      }}
      onWheel={e =>
        audioEvents.seek(trackId, 0, e.deltaY > 0 ? 'next' : 'previous')
      }
    >
      {!analyzing ? null : (
        <div className={`${containerClass} absolute z-10 w-full h-20 top-0`}>
          <div className="relative w-1/2 top-1/2 -mt-0.5 m-auto">
            <ProgressBar />
          </div>
        </div>
      )}
    </div>
  )
}

const Waveform = ({
  trackId
}: {
  trackId: Track['id']
}): JSX.Element | null => {
  if (!trackId) throw errorHandler('No track to initialize.')

  useEffect(() => {
    // Retrieve track, file and region data, then store waveform in audioState
    const init = async () => {
      const track = await db.tracks.get(trackId)
      if (!track) throw errorHandler('Could not retrieve track from database.')

      const file = await getPermission(track)
      if (!file) throw errorHandler(`Please try adding ${track.name} again.`)

      initWaveform({ trackId, file })
    }

    // prevent duplication on re-render while loading
    const [analyzingTracks] = getAppState.analyzing()
    const analyzing = analyzingTracks.has(trackId)

    if (!analyzing) init()

    // add track to analyzing state
    setAppState.analyzing(prev => prev.add(trackId))

    validateTrackStemAccess(trackId)

    return () => {
      audioEvents.destroy(trackId)
      audioEvents.destroyStems(trackId)
    }
  }, [trackId])

  return <TrackView trackId={trackId} />
}

export { PRIMARY_WAVEFORM_CONFIG, Waveform, initAudioContext, initWaveform }
