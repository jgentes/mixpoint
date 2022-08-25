import { Track, TrackState, putTrack } from './db'
import { failure } from './utils'
import { getPermission } from './fileHandlers'
import { guess } from 'web-audio-beat-detector'

const initTrack = async (
  fileHandle: FileSystemFileHandle,
  dirHandle?: FileSystemDirectoryHandle
) => {
  const { name, size, type } = await fileHandle.getFile()
  const track = { name, size, type, fileHandle, dirHandle }

  return track
}

const getAudioBuffer = async (file: File): Promise<AudioBuffer> => {
  const arrayBuffer = await file.arrayBuffer()
  const audioCtx = new window.AudioContext()
  return await audioCtx.decodeAudioData(arrayBuffer)
}

const createMix = async (trackStateArray: TrackState[]) => {
  // this is slow, also look at https://github.com/jackedgson/crunker and https://github.com/audiojs/audio-buffer-utils

  const [track0, track1] = trackStateArray
  const track0Duration =
    (track0.waveformData!.length / track0.waveformData!.sample_rate) *
    track0.waveformData!.samples_per_pixel
  const track1Duration =
    (track1.waveformData!.length / track1.waveformData!.sample_rate) *
      track1.waveformData!.samples_per_pixel -
    track0.mixPoint! -
    track1.mixPoint!
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

const getBpm = async (
  buffer: AudioBuffer
): Promise<{ offset: number; bpm: number }> => await guess(buffer)

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
    failure(undefined, `Unable to determine BPM for ${name}`)
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
    sampleRate
  }

  await putTrack(updatedTrack)

  return updatedTrack
}

export { getAudioBuffer, processAudio, getBpm, initTrack, createMix }
