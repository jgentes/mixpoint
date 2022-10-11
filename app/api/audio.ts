import { superstate } from '@superstate/core'
import { guess } from 'web-audio-beat-detector'
import { getState, putState, putTracks, Track, TrackState } from '~/api/db'
import { getPermission } from '~/api/fileHandlers'

import { confirmModalState } from '~/components/ConfirmModal'
import { pageState } from '~/routes/__boundary/tracks'
import { errorHandler } from '~/utils/notifications'

const analyzingState = superstate<Track[]>([])
const processingState = superstate<boolean>(false)

// This is the main track processing workflow when files are added to the app
const processTracks = async (
  handles: (FileSystemFileHandle | FileSystemDirectoryHandle)[]
) => {
  const trackArray = await getTracksRecursively(handles)
  await analyzeTracks(trackArray)
}

// The function iterates through file handles and collects the
// information needed to add them to the database, then hands off
// the array of track id's returned from the db for analysis.
async function getTracksRecursively(
  handles: (FileSystemFileHandle | FileSystemDirectoryHandle)[]
): Promise<Partial<Track>[]> {
  const trackArray: Partial<Track>[] = []

  // Show indicator inside empty table
  processingState.set(true)

  // Change sort order to lastModified so new tracks are visible at the top
  await putState('app', { sortColumn: 'lastModified', sortDirection: 'desc' })

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
    processingState.set(false)
    return updatedTracks
  }

  // Warn user if large number of tracks are added, this is due to memory leak in web audio api
  if (trackArray.length > 100) {
    confirmModalState.set({
      openState: true,
      headerText: 'More than 100 tracks added',
      bodyText:
        'Analyzing audio is memory intensive. If your browser runs out of memory, just refresh the page to release memory and resume analyzing tracks.',
      confirmText: 'Continue',
      confirmColor: 'success',
      onConfirm: async () => {
        confirmModalState.set({ openState: false })
        const updatedTracks = await addTracksToDb()
        await analyzeTracks(updatedTracks)
      },
      onCancel: () => {
        confirmModalState.set({ openState: false })
        processingState.set(false)
      },
    })
    return []
  } else return addTracksToDb()
}

const analyzeTracks = async (tracks: Track[]): Promise<void> => {
  // Set analyzing state now to avoid tracks appearing with 'analyze' button
  analyzingState.set(prev => [...prev, ...tracks])

  let sorted
  for (const track of tracks) {
    if (!sorted) {
      // Change sort order to lastModified so new tracks are visible at the top
      await putState('app', {
        sortColumn: 'lastModified',
        sortDirection: 'desc',
      })
      pageState.set(0)
      sorted = true
    }

    const { name, size, type, offset, bpm, duration, sampleRate } =
      await getAudioDetails(track)

    // adjust for miscalc tempo > 160bpm
    const adjustedBpm = bpm > 160 ? bpm / 2 : bpm

    const updatedTrack = {
      name,
      size,
      type,
      duration,
      bpm: adjustedBpm,
      offset,
      sampleRate,
    }

    await putTracks([updatedTrack])
    analyzingState.set(prev => prev.filter(t => t.id !== track.id))
  }
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
    analyzingState.set([])
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

const createMix = async (trackStateArray: TrackState[]) => {
  // this is slow, also look at https://github.com/jackedgson/crunker and https://github.com/audiojs/audio-buffer-utils

  const [wave0, wave1] = [...trackStateArray].map(track =>
    track.waveformData?.toJSON()
  )

  const track0Duration =
    (wave0 && (wave0.length / wave0.sample_rate) * wave0.samples_per_pixel) || 0
  const track1Duration =
    (wave1 &&
      (wave1.length / wave1.sample_rate) * wave1.samples_per_pixel -
        (trackStateArray[0]?.mixPoint || 0) -
        (trackStateArray[1]?.mixPoint || 0)) ||
    0

  const totalDuration = track0Duration + track1Duration

  const arrayOfAudioBuffers = []
  for (let t of trackStateArray)
    arrayOfAudioBuffers.push(await getAudioBuffer(t.file!))

  var audioCtx = new AudioContext()

  let finalMix = audioCtx.createBuffer(
    2,
    totalDuration * 48000,
    arrayOfAudioBuffers[0].sampleRate
  )

  for (let i = 0; i < arrayOfAudioBuffers.length; i++) {
    // second loop for each channel ie. left and right
    for (let channel = 0; channel < 2; channel++) {
      //here we get a reference to the final mix buffer data
      let buffer = finalMix.getChannelData(channel)

      //last is loop for updating/summing the track buffer with the final mix buffer
      for (let j = 0; j < arrayOfAudioBuffers[i].length; j++) {
        buffer[j] += arrayOfAudioBuffers[i].getChannelData(channel)[j]
      }
    }
  }

  return finalMix
}

export {
  processTracks,
  getAudioDetails,
  getPeaks,
  createMix,
  analyzeTracks,
  analyzingState,
  processingState,
}
