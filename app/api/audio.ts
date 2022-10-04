import { Track, TrackState, putTrack } from '~/api/db'
import {
  getPermission,
  processingState,
  analyzingState,
} from '~/api/fileHandlers'
import { guess } from 'web-audio-beat-detector'
import { useSuperState } from '@superstate/react'
import WaveformData from 'waveform-data'
import { dirtyTracks } from '~/routes/__boundary/tracks'
import { initPeaks } from '~/api/initPeaks'

const getAudioBuffer = async (file: File): Promise<AudioBuffer> => {
  const arrayBuffer = await file.arrayBuffer()
  const audioCtx = new window.AudioContext()
  return await audioCtx.decodeAudioData(arrayBuffer)
}

const getBpm = async (
  buffer: AudioBuffer
): Promise<{ offset: number; bpm: number }> => await guess(buffer)

// Queue files for processing after they are added to the DB
// this provides a more responsive UI experience.
// The function iterates through file handles and collects the
// information needed to add them to the database, then hands off
// the array of track id's returned from the db for analysis.
const processTracks = async (
  handles: (FileSystemFileHandle | FileSystemDirectoryHandle)[]
) => {
  let trackArray: Track[] = []
  useSuperState(dirtyTracks)

  const initTrack = async (
    fileHandle: FileSystemFileHandle,
    dirHandle?: FileSystemDirectoryHandle
  ) => {
    const { name, size, type } = await fileHandle.getFile()
    const track: Partial<Track> = { name, size, type, fileHandle, dirHandle }

    return track
  }

  // show indicator if no tracks exist
  processingState.set(true)

  for await (const fileOrDirectoryHandle of handles) {
    if (!fileOrDirectoryHandle) continue

    if (fileOrDirectoryHandle?.kind === 'directory') {
      const directoryHandle = fileOrDirectoryHandle

      for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file') {
          trackArray.push(await initTrack(entry, directoryHandle))
        }
      }
    } else {
      trackArray.push(await initTrack(fileOrDirectoryHandle))
    }
  }

  const trackIds = []
  for (const track of trackArray) trackIds.push(await putTrack(track))
  processingState.set(false)
  analyzingState.set(trackIds)

  for (const track of trackIds) await processAudio(track)
}

const analyzeTrack = async (track: Track) => {
  useSuperState(analyzingState)

  const ok = await getPermission(track)

  if (ok) {
    // if the user approves access to a folder, we can process all files in that folder :)
    const siblingTracks = track.dirHandle
      ? dirtyTracks
          .now()
          .filter(t => t.dirHandle?.name == track.dirHandle?.name)
      : [track]

    analyzingState.set(siblingTracks)
    for (const sibling of siblingTracks) {
      await processAudio(sibling)
      analyzingState.set(siblingTracks.filter(s => s.id !== sibling.id))
    }
  }
}

const processAudio = async (track: Track): Promise<Track | undefined> => {
  if (!track.fileHandle) throw Error('Please try adding the Track again')

  const file = await getPermission(track)
  if (!file) return // this would be due to denial of permission

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

  return updatedTrack
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

export const addTrackToMix = (track: Track, trackKey: number) => {
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
  processAudio,
  processTracks,
  getBpm,
  createMix,
  analyzeTrack,
}
