import WaveSurfer, { type WaveSurferOptions } from 'wavesurfer.js'
import { setAudioState } from '~/api/appState'
import { audioEvents } from '~/api/audioEvents'
import { Stem, Track } from '~/api/db/dbHandlers'
import { errorHandler } from '~/utils/notifications'

// This function accepts either a full track (with no stem) or an individual stem ('bass', etc)
const initWaveform = async ({
	trackId,
	file,
	stem,
	waveformConfig
}: {
	trackId: Track['id']
	file: File
	stem?: Stem
	waveformConfig: WaveSurferOptions
}): Promise<void> => {
	if (!trackId) throw errorHandler('No track ID provided to initWaveform')

	// an Audio object is required for Wavesurfer to use Web Audio
	const media = new Audio()
	media.src = URL.createObjectURL(file)

	const config: WaveSurferOptions = {
		media,
		pixelRatio: 1,
		cursorColor: 'secondary.mainChannel',
		interact: false,
		waveColor: [
			'rgb(200, 165, 49)',
			'rgb(211, 194, 138)',
			'rgb(189, 60, 0)',
			'rgb(189, 60, 0)',
			'rgb(189, 60, 0)',
			'rgb(189, 60, 0)'
		],
		progressColor: 'rgba(0, 0, 0, 0.45)',
		...waveformConfig
	}

	const waveform = WaveSurfer.create(config)

	// Create Web Audio context
	const audioContext = new AudioContext()

	// gainNode is used to control volume of all stems at once
	const gainNode = audioContext.createGain()
	gainNode.connect(audioContext.destination)

	// Connect the audio to the equalizer
	media.addEventListener(
		'canplay',
		() => {
			// Create a MediaElementSourceNode from the audio element
			const mediaNode = audioContext.createMediaElementSource(media)
			mediaNode.connect(gainNode)
		},
		{ once: true }
	)

	// Save waveform in audioState to track user interactions with the waveform and show progress
	if (stem) {
		setAudioState[trackId].stems[stem as Stem]({
			gainNode,
			volume: 1,
			mute: false,
			waveform
		})
	} else {
		setAudioState[trackId].waveform(waveform)
		setAudioState[trackId].gainNode(gainNode)
	}

	waveform.once('ready', () => audioEvents.onReady(trackId, stem))
	// no due to click event seek? waveform.on('seeking', (time: number) => audioEvents.seek(trackId, time))
	// not for every stem! waveform.on('timeupdate', (time: number) => { });
}

export { initWaveform }
