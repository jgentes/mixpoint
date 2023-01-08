import { guess } from 'web-audio-beat-detector'
import {
  db,
  getTrackName,
  getTrackPrefs,
  putStore,
  putTracks,
  Stem,
  storeTrack,
  Track,
  TrackCache,
  TrackPrefs,
} from '~/api/db/dbHandlers'
import { getPermission, getStemsDirHandle } from '~/api/fileHandlers'

import { setAudioState, setModalState, setTableState } from '~/api/uiState'
import { errorHandler } from '~/utils/notifications'

// This is the main track processing workflow when files are added to the app
const processTracks = async (
  handles: (FileSystemFileHandle | FileSystemDirectoryHandle)[]
) => {
  const trackArray = await getTracksRecursively(handles)
  return await analyzeTracks(trackArray)
}

// The function iterates through file handles and collects the
// information needed to add them to the database, then hands off
// the array of track id's returned from the db for analysis.
async function getTracksRecursively(
  handles: (FileSystemFileHandle | FileSystemDirectoryHandle)[]
): Promise<Partial<Track>[]> {
  const trackArray: Partial<Track>[] = []

  // Change sort order to lastModified so new tracks are visible at the top
  await putStore('user', { sortColumn: 'lastModified', sortDirection: 'desc' })

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
          dirHandle,
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
    setTableState.processing(false)
    return updatedTracks
  }

  // Warn user if large number of tracks are added, this is due to memory leak in web audio api
  if (trackArray.length > 100) {
    // Show indicator inside empty table
    setTableState.processing(true)

    setModalState({
      openState: true,
      headerText: 'More than 100 tracks added',
      bodyText:
        'Analyzing audio is memory intensive. If your browser runs out of memory, just refresh the page to release memory and resume analyzing tracks.',
      confirmText: 'Continue',
      confirmColor: 'success',
      onConfirm: async () => {
        setModalState.openState(false)
        const updatedTracks = await addTracksToDb()
        await analyzeTracks(updatedTracks)
      },
      onCancel: () => {
        setModalState.openState(false)
        setTableState.processing(false)
      },
    })
    return []
  } else return addTracksToDb()
}

const analyzeTracks = async (tracks: Track[]): Promise<Track[]> => {
  // Set analyzing state now to avoid tracks appearing with 'analyze' button
  setTableState.analyzing(analyzing => [
    ...analyzing,
    ...tracks.map(track => track.id),
  ])

  // Return array of updated tracks
  const updatedTracks: Track[] = []

  let sorted
  for (const track of tracks) {
    if (!sorted) {
      // Change sort order to lastModified so new tracks are visible at the top
      await putStore('user', {
        sortColumn: 'lastModified',
        sortDirection: 'desc',
      })
      setTableState.page(0)
      sorted = true
    }

    const { name, size, type, offset, bpm, duration, sampleRate } =
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
    }

    const [trackWithId] = await putTracks([updatedTrack])
    updatedTracks.push(trackWithId)

    // Give Dexie a few ms to update the UI before removing analyzing state. This is to avoid the 'analyze' button appearing briefly.
    setTimeout(
      () =>
      setTableState.analyzing(analyzing =>
          analyzing.filter(id => id !== track.id)
        ),
      250
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
    setTableState.analyzing([])
    throw errorHandler('Permission to the file or folder was denied.') // this would be due to denial of permission (ie. clicked cancel)
  }

  const audioCtx = new AudioContext()
  const arrayBuffer = await file.arrayBuffer()
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

  const { name, size, type } = file
  const { duration, sampleRate } = audioBuffer
  let offset = 0,
    bpm = 1

  try {
    ;({ offset, bpm } = await guess(audioBuffer))
  } catch (e) {
    errorHandler(`Unable to determine BPM for ${name}`)
  }

  // Reduce offset to 2 decimal places
  offset = Math.round(offset * 1e2) / 1e2

  return {
    name,
    size,
    type,
    offset,
    bpm,
    duration,
    sampleRate,
  }
}

// CalcMarkers can be called independently for changes in beat offset or beat resolution
const calcMarkers = async (
  trackId: Track['id'],
  waveform: WaveSurfer
): Promise<{
  adjustedBpm: TrackPrefs['adjustedBpm']
  beatResolution: TrackPrefs['beatResolution']
  mixpointTime: TrackPrefs['mixpointTime']
} | void> => {
  if (!trackId) return

  const track = (await db.tracks.get(trackId)) || {}
  let { duration, offset, adjustedOffset, bpm } = track

  // isNaN check here to allow for zero values
  const valsMissing = !duration || isNaN(Number(bpm)) || isNaN(Number(offset))

  if (valsMissing) {
    const analyzedTracks = await analyzeTracks([track])
    ;({ duration, bpm, offset } = analyzedTracks[0])
  }

  if (!duration) throw errorHandler(`Please try adding ${track.name} again.`)

  let {
    adjustedBpm,
    beatResolution = 0.25,
    mixpointTime,
  } = await getTrackPrefs(trackId)

  const beatInterval = 60 / (adjustedBpm || bpm || 1)
  const skipLength = beatInterval * (1 / beatResolution)

  // SkipLength is used while calculating nearest Marker during seek events
  waveform.skipLength = skipLength

  let startPoint = adjustedOffset || offset || 0

  // Work backward from initialPeak to start of track (zerotime) based on bpm
  while (startPoint - beatInterval > 0) startPoint -= beatInterval

  // Now that we have zerotime, move forward with markers based on the bpm
  waveform.markers.clear()
  for (let time = startPoint; time < duration; time += skipLength) {
    // regions.push({
    //   start: time,
    //   end: time + skipLength,
    //   color: 'rgba(255, 255, 255, 0)',
    //   drag: false,
    //   resize: false,
    //   showTooltip: false,
    // })
    waveform.markers.add({ time })
  }
  return {
    adjustedBpm,
    beatResolution,
    mixpointTime,
  }
}

const getStemBuffers = async (
  trackId: Track['id']
): Promise<
  | {
      stemBuffers: Partial<{ [key in Stem]: AudioBuffer }> | null
    }
  | undefined
> => {
  if (!trackId) return

  // Get files from cache or from file system
  let { stems } = (await db.trackCache.get(trackId)) || {}

  if (!stems) {
    const stemsDirHandle = await getStemsDirHandle()
    if (!stemsDirHandle)
      throw errorHandler(
        'There was a problem accessing the stems folder - please try setting it again.'
      )

    const trackName = await getTrackName(trackId)

    const directoryName = `${trackName} - stems`

    // Get a FileHandle for the MP3 file
    let trackDirHandle
    try {
      trackDirHandle = await stemsDirHandle.getDirectoryHandle(directoryName)
    } catch (e) {
      // directory doesn't exist
      return
    }

    const stemFiles: TrackCache['stems'] = {}
    for (const stem of ['bass', 'drums', 'vocals', 'other']) {
      // get a FileHandle for the MP3 file
      let fileHandle
      try {
        fileHandle = await trackDirHandle.getFileHandle(`${stem}.mp3`)
      } catch (e) {
        // file doesn't exist
        console.log('file not found:', `${stem}.mp3`)
        return
      }

      // Get a File object for the MP3 file
      const file = await fileHandle.getFile()

      stemFiles[stem as Stem] = file

      // store stem in cache
      storeTrack({ id: trackId, stems: { [stem]: file } })
    }

    stems = stemFiles
  }

  const stemContext = new AudioContext()
  const stemBuffers: Partial<{ [key in Stem]: AudioBuffer }> = {}

  for (const [stem, file] of Object.entries(stems)) {
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Decode the audio data
    const audioBuffer = await stemContext.decodeAudioData(arrayBuffer)

    stemBuffers[stem as Stem] = audioBuffer
  }

  stemContext.close()
  return { stemBuffers }
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

export {
  processTracks,
  getAudioDetails,
  //createMix,
  getStemBuffers,
  analyzeTracks,
  calcMarkers,
}
