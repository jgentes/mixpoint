import WaveSurfer from 'wavesurfer.js/src/wavesurfer'
import { setAudioState, setVolumeState } from '~/api/appState'
import { audioEvent } from '~/api/audioEvents'
import { analyzeTracks } from '~/api/audioHandlers'
import { db, getTrackState, Track, TrackState } from '~/api/dbHandlers'
import { errorHandler } from '~/utils/notifications'
import { convertToSecs } from '~/utils/tableOps'

// WaveformEvents are emitted by interaction with the Waveform, such as seek, region interactions, etc, as opposed to external button events handled by AudioEvents

// CalcMarkers can be called independently for changes in beat offset or beat resolution
const calcMarkers = async (
  track: Track,
  waveform: WaveSurfer
): Promise<{
  adjustedBpm: TrackState['adjustedBpm']
  beatResolution: TrackState['beatResolution']
  mixpoint: TrackState['mixpoint']
}> => {
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
    mixpoint,
  } = await getTrackState(track.id)

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
    mixpoint,
  }
}

const loadWaveformEvents = async ({
  trackId,
  waveform,
}: {
  trackId: Track['id']
  waveform: WaveSurfer
}): Promise<void> => {
  if (!trackId) return
  const track = await db.tracks.get(trackId)
  if (!track)
    throw errorHandler('Track not found while setting up waveform events.')

  const { adjustedBpm, beatResolution, mixpoint } = await calcMarkers(
    track,
    waveform
  )

  // Adjust zoom based on previous mixState
  waveform.zoom(beatResolution == 1 ? 80 : beatResolution == 0.5 ? 40 : 20)

  // Adjust bpm if set in mixState
  if (adjustedBpm)
    waveform.setPlaybackRate(adjustedBpm / (track?.bpm || adjustedBpm))

  // Configure wavesurfer event listeners
  waveform.on('ready', () => {
    setAudioState.analyzing(prev => prev.filter(id => id !== trackId))

    // Set playhead to mixpoint if it exists
    const currentPlayhead = mixpoint
      ? convertToSecs(mixpoint)
      : waveform.markers.markers?.[0].time || 0

    if (currentPlayhead) {
      waveform.playhead.setPlayheadTime(currentPlayhead)
      waveform.seekAndCenter(1 / (waveform.getDuration() / currentPlayhead))
    }
  })

  waveform.on('seek', () => audioEvent.emit(trackId, 'seek', {}))

  waveform.on('region-click', region => {
    if (waveform.isPlaying()) return waveform.pause()

    // Time gets inconsistent at 14 digits so need to round here
    const time = waveform.getCurrentTime().toFixed(3)
    const clickInsideOfPlayheadRegion =
      waveform.playhead.playheadTime.toFixed(3) == region.start.toFixed(3)
    const cursorIsAtPlayhead = time == waveform.playhead.playheadTime.toFixed(3)

    if (cursorIsAtPlayhead && clickInsideOfPlayheadRegion) {
      waveform.play()
    } else if (clickInsideOfPlayheadRegion) {
      // Take the user back to playhead
      waveform.seekAndCenter(
        1 / (waveform.getDuration() / waveform.playhead.playheadTime)
      )
    } else {
      // Move playhead to new region (seek is somewhat disorienting)
      waveform.playhead.setPlayheadTime(region.start)
    }
  })

  let volumeMeterInterval: ReturnType<typeof setInterval> | number // placeholder for setInterval

  const createVolumeMeter = () => {
    // @ts-ignore
    const analyzer = waveform.backend.analyser
    const bufferLength = analyzer.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const caclculateVolume = () => {
      analyzer.getByteFrequencyData(dataArray)

      let sum = 0
      for (const amplitude of dataArray) {
        sum += amplitude * amplitude
      }

      const volume = Math.sqrt(sum / (dataArray.length + 1000))

      setVolumeState({ [trackId]: { volume } })
    }

    waveform.on('play', () => {
      // Slow down sampling to 10ms
      if (volumeMeterInterval > -1) clearInterval(volumeMeterInterval)
      volumeMeterInterval = setInterval(() => caclculateVolume(), 15)

      //todo change play button to pause button
    })

    waveform.on('pause', () => {
      clearInterval(volumeMeterInterval)
      // Set to zero on pause
      setVolumeState({ [trackId]: { volume: 0 } })
    })
  }

  createVolumeMeter()
}

export { loadWaveformEvents, calcMarkers }
