import { superstate } from '@superstate/core'
import WaveformData from 'waveform-data'
import { guess } from 'web-audio-beat-detector'
import { putState, putTrack, Track, TrackState } from '~/api/db'
import { getPermission } from '~/api/fileHandlers'

// Dirty tracks are tracks that have not been analyzed
const dirtyTrackState = superstate<Track[]>([])
const analyzingState = superstate<Track[]>([])
const processingState = superstate<boolean>(false)

// Only load initPeaks in the browser
let initPeaks: typeof import('~/api/initPeaks').initPeaks
if (typeof document !== 'undefined')
  import('~/api/initPeaks').then(m => (initPeaks = m.initPeaks))

// This is the main track processing workflow when files are added to the app
const processTracks = async (
  handles: (FileSystemFileHandle | FileSystemDirectoryHandle)[]
) => {
  const trackArray = await getTracksRecursively(handles)
  const tracks = await addTracksToDb(trackArray)
  return await getAudioDetails(tracks)
}

const getAudioBuffer = async (file: File): Promise<AudioBuffer> => {
  const arrayBuffer = await file.arrayBuffer()
  const audioCtx = new window.AudioContext()
  return await audioCtx.decodeAudioData(arrayBuffer)
}

const getBpm = async (
  buffer: AudioBuffer
): Promise<{ offset: number; bpm: number }> => await guess(buffer)

async function getTracksRecursively(
  handles: (FileSystemFileHandle | FileSystemDirectoryHandle)[]
): Promise<Partial<Track>[]> {
  const trackArray: Partial<Track>[] = []

  // Show indicator inside empty table
  processingState.set(true)

  // Change sort order to lastModified so new tracks are visible at the top
  await putState('app', { sortOrderBy: 'lastModified', sortDirection: 'desc' })

  // Queue files for processing after they are added to the DB
  // this provides a more responsive UI experience.
  // The function iterates through file handles and collects the
  // information needed to add them to the database, then hands off
  // the array of track id's returned from the db for analysis.
  const filesToTracks = async (
    fileOrDirectoryHandle: FileSystemFileHandle | FileSystemDirectoryHandle,
    dirHandle?: FileSystemDirectoryHandle
  ) => {
    if (fileOrDirectoryHandle.kind === 'file') {
      const { name, size, type } = await fileOrDirectoryHandle.getFile()
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

  processingState.set(false)
  return trackArray
}

const addTracksToDb = async (
  trackArray: Partial<Track>[]
): Promise<Track[]> => {
  const tracksWithIds = []

  for (const track of trackArray) tracksWithIds.push(await putTrack(track))
  return tracksWithIds
}

const analyzeTrack = async (track: Track) => {
  const ok = await getPermission(track)

  if (ok) {
    // if the user approves access to a folder, we can process all files in that folder :)
    const siblingTracks = track.dirHandle
      ? dirtyTrackState
          .now()
          .filter(t => t.dirHandle?.name == track.dirHandle?.name)
      : [track]

    analyzingState.set(siblingTracks)
    for (const sibling of siblingTracks) {
      await getAudioDetails([sibling])
      analyzingState.set(siblingTracks.filter(s => s.id !== sibling.id))
    }
  }
}

const getAudioDetails = async (tracks: Track[]): Promise<Track[]> => {
  const updatedTracks: Track[] = []

  analyzingState.set(tracks)

  for (const track of tracks) {
    if (!track.fileHandle) throw Error(`Please try adding ${track.name} again.`)

    const file = await getPermission(track)
    if (!file) return updatedTracks // this would be due to denial of permission (ie. clicked cancel)

    const { name, size, type } = file

    const audioBuffer = await getAudioBuffer(file)

    const { duration, sampleRate } = audioBuffer

    let offset = 0,
      bpm = 1

    try {
      ;({ offset, bpm } = await getBpm(audioBuffer))
    } catch (e) {
      throw `Unable to determine BPM for ${name}`
    }

    // adjust for miscalc tempo > 160bpm
    const adjustedBpm = bpm > 160 ? bpm / 2 : bpm

    const updatedTrack = {
      ...track,
      name,
      size,
      type,
      duration,
      bpm: adjustedBpm,
      offset,
      sampleRate,
    }

    await putTrack(updatedTrack)
    updatedTracks.push(updatedTrack)
    analyzingState.set(tracks.filter(t => t.id !== updatedTrack.id))
  }

  return updatedTracks
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

const addTrackToMix = (track: Track, trackKey: number) => {
  getPeaks(track, trackKey)
  openTable(false)
}

const getPeaks = async (
  track: Track,
  trackKey: number,
  file?: File,
  waveformData?: WaveformData
) => {
  return await initPeaks({
    trackKey,
    track,
    file,
    waveformData,
    setSliderControl,
    setAudioSrc,
    setWaveform,
    setAnalyzing,
  })
}

export {
  getAudioBuffer,
  processTracks,
  getBpm,
  createMix,
  analyzeTrack,
  addTrackToMix,
  dirtyTrackState,
  analyzingState,
  processingState,
}
