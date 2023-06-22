import type RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import { guess as detectBPM } from 'web-audio-beat-detector'
import { getAudioState, setAppState, setModalState } from '~/api/appState'
import {
	Track,
	db,
	getTrackPrefs,
	putTracks,
	setPrefs
} from '~/api/db/dbHandlers'
import { getPermission } from '~/api/fileHandlers'
import { errorHandler } from '~/utils/notifications'

// This is the main track processing workflow when files are added to the app
const processTracks = async (
	handles: (FileSystemFileHandle | FileSystemDirectoryHandle)[]
) => {
	const trackArray = await getTracksRecursively(handles)
	return await analyzeTracks(trackArray)
}

type partialTrack = Pick<
	Track,
	'name' | 'size' | 'type' | 'fileHandle' | 'dirHandle'
>

// The function iterates through file handles and collects the
// information needed to add them to the database, then hands off
// the array of track id's returned from the db for analysis.
async function getTracksRecursively(
	handles: (FileSystemFileHandle | FileSystemDirectoryHandle)[]
): Promise<Track[]> {
	const trackArray: partialTrack[] = []

	// Change sort order to lastModified so new tracks are visible at the top
	await setPrefs('user', { sortColumn: 'lastModified', sortDirection: 'desc' })

	const filesToTracks = async (
		fileOrDirectoryHandle: FileSystemFileHandle | FileSystemDirectoryHandle,
		dirHandle?: FileSystemDirectoryHandle
	) => {
		if (fileOrDirectoryHandle.kind === 'file') {
			const { name, size, type } = await fileOrDirectoryHandle.getFile()

			if (!type || !type.startsWith('audio'))
				return errorHandler(`${name} is not an audio file.`)

			if (name)
				trackArray.push({
					name,
					size,
					type,
					fileHandle: fileOrDirectoryHandle,
					dirHandle
				})
		} else if (fileOrDirectoryHandle.kind === 'directory') {
			for await (const handle of fileOrDirectoryHandle.values()) {
				await filesToTracks(handle, fileOrDirectoryHandle)
			}
		}
	}

	for (const fileOrDirectoryHandle of handles) {
		await filesToTracks(fileOrDirectoryHandle)
	}

	const addTracksToDb = async () => {
		// Ensure we have id's for our tracks, add them to the DB with updated lastModified dates
		const updatedTracks = await putTracks(trackArray)
		setAppState.processing(false)
		return updatedTracks
	}

	// Warn user if large number of tracks are added, this is due to memory leak in web audio api
	if (trackArray.length > 100) {
		// Show indicator inside empty table
		setAppState.processing(true)

		setModalState({
			openState: true,
			headerText: 'More than 100 tracks added',
			bodyText:
				'Analyzing audio is memory intensive. If your browser runs out of memory, just refresh the page to release memory and continue analyzing tracks.',
			confirmText: 'Continue',
			confirmColor: 'success',
			onConfirm: async () => {
				setModalState.openState(false)
				const updatedTracks = await addTracksToDb()
				await analyzeTracks(updatedTracks)
			},
			onCancel: () => {
				setModalState.openState(false)
				setAppState.processing(false)
			}
		})
		return []
	} else return addTracksToDb()
}

const analyzeTracks = async (tracks: Track[]): Promise<Track[]> => {
	// Set analyzing state now to avoid tracks appearing with 'analyze' button
	setAppState.analyzing((analyzing) => [
		...analyzing,
		...tracks.map((track) => track.id)
	])

	// Return array of updated tracks
	const updatedTracks: Track[] = []

	let sorted
	for (const track of tracks) {
		if (!sorted) {
			// Change sort order to lastModified so new tracks are visible at the top
			await setPrefs('user', {
				sortColumn: 'lastModified',
				sortDirection: 'desc'
			})
			setAppState.page(0)
			sorted = true
		}

		const { name, size, type, offset, bpm, duration, sampleRate, ...rest } =
			await getAudioDetails(track)

		// adjust for miscalc tempo > 160bpm
		const normalizedBpm = bpm > 160 ? bpm / 2 : bpm

		const updatedTrack = {
			name,
			size,
			type,
			duration,
			bpm: normalizedBpm,
			offset,
			sampleRate,
			...rest
		}

		const [trackWithId] = await putTracks([updatedTrack])
		updatedTracks.push(trackWithId)

		// Remove from analyzing state
		setAppState.analyzing((analyzing) =>
			analyzing.filter((id) => id !== track.id)
		)
	}
	return updatedTracks
}

const getAudioDetails = async (
	track: Track
): Promise<{
	name: string
	size: number
	type: string
	offset: number
	bpm: number
	duration: number
	sampleRate: number
}> => {
	const file = await getPermission(track)
	if (!file) {
		setAppState.analyzing([])
		throw errorHandler('Permission to the file or folder was denied.')
	}

	const { name, size, type } = file
	const arrayBuffer = await file.arrayBuffer()

	const audioCtx = new AudioContext()
	const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
	const { duration, sampleRate } = audioBuffer

	let offset = 0
	let bpm = 1

	try {
		// rome-ignore lint/complexity/noExtraSemicolon: contradicts formatting rule
		;({ offset, bpm } = await detectBPM(audioBuffer))
	} catch (e) {
		errorHandler(`Unable to determine BPM for ${name}`)
	}

	audioCtx.close()

	// Reduce offset to 2 decimal places
	offset = Math.round(offset * 1e2) / 1e2

	return {
		name,
		size,
		type,
		offset,
		bpm,
		duration,
		sampleRate
	}
}

// CalcMarkers can be called independently for changes in beat offset or beat resolution
const calcMarkers = async (trackId: Track['id']): Promise<void> => {
	if (!trackId) return

	const [waveform] = getAudioState[trackId].waveform()
	if (!waveform) return

	const regionsPlugin = waveform.getActivePlugins()[0] as RegionsPlugin

	if (!regionsPlugin) return
	regionsPlugin.clearRegions()

	const track = await db.tracks.get(trackId)
	if (!track) return
	let { name, duration, offset, adjustedOffset, bpm } = track || {}

	// isNaN check here to allow for zero values
	const valsMissing =
		!duration || Number.isNaN(Number(bpm)) || Number.isNaN(Number(offset))

	if (valsMissing) {
		const analyzedTracks = await analyzeTracks([track])
		;({ bpm, offset } = analyzedTracks[0])
	}

	if (!duration) return errorHandler(`Please try adding ${name} again.`)

	const { beatResolution = 1 } = await getTrackPrefs(trackId)

	const beatInterval = 60 / (bpm || 1)
	const skipLength = beatInterval * (1 / beatResolution)

	let startPoint = adjustedOffset || offset || 0

	// Work backward from initialPeak to start of track (zerotime) based on bpm
	while (startPoint - beatInterval > 0) startPoint -= beatInterval

	// Now that we have zerotime, move forward with markers based on the bpm
	for (let time = startPoint; time < duration; time += skipLength) {
		regionsPlugin.addRegion({
			start: time,
			end: time,
			color: 'rgba(4, 146, 247, 0.757)',
			drag: false
		})
	}
}

// const createMix = async (TrackPrefsArray: TrackPrefs[]) => {
//   // this is slow, also look at https://github.com/jackedgson/crunker and https://github.com/audiojs/audio-buffer-utils

//   const [wave0, wave1] = [...TrackPrefsArray].map(track =>
//     track.waveformData?.toJSON()
//   )

//   const track0Duration =
//     (wave0 && (wave0.length / wave0.sample_rate) * wave0.samples_per_pixel) || 0
//   const track1Duration =
//     (wave1 &&
//       (wave1.length / wave1.sample_rate) * wave1.samples_per_pixel -
//         (TrackPrefsArray[0]?.mixPoint || 0) -
//         (TrackPrefsArray[1]?.mixPoint || 0)) ||
//     0

//   const totalDuration = track0Duration + track1Duration

//   const arrayOfAudioBuffers = []
//   for (let t of TrackPrefsArray)
//     arrayOfAudioBuffers.push(await getAudioBuffer(t.file!))

//   var audioCtx = new AudioContext()

//   let finalMix = audioCtx.createBuffer(
//     2,
//     totalDuration * 48000,
//     arrayOfAudioBuffers[0].sampleRate
//   )

//   for (let i = 0; i < arrayOfAudioBuffers.length; i++) {
//     // second loop for each channel ie. left and right
//     for (let channel = 0; channel < 2; channel++) {
//       //here we get a reference to the final mix buffer data
//       let buffer = finalMix.getChannelData(channel)

//       //last is loop for updating/summing the track buffer with the final mix buffer
//       for (let j = 0; j < arrayOfAudioBuffers[i].length; j++) {
//         buffer[j] += arrayOfAudioBuffers[i].getChannelData(channel)[j]
//       }
//     }
//   }

//   return finalMix
// }

export { analyzeTracks, calcMarkers, getAudioDetails, processTracks }
