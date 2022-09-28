import Peaks, { PeaksOptions } from 'peaks.js'
import { Track, db } from '~/api/db'
import { getPermission } from '~/api/fileHandlers'
import WaveformData from 'waveform-data'

export const initPeaks = async ({
  trackKey,
  track,
  file,
  waveformData,
  setSliderControl,
  setAudioSrc,
  setWaveform,
  setAnalyzing,
}: {
  trackKey: number
  track: Track
  file: File | undefined
  waveformData: WaveformData | undefined
  setSliderControl: Function
  setAudioSrc: Function
  setWaveform: Function
  setAnalyzing: Function
}) => {
  if (!track) throw Error('No track to initialize')
  setAnalyzing(true)

  const track1 = trackKey % 2

  file = file || (await getPermission(track))
  if (!file) throw Error('Problem reaching file')

  // update the <audio> ref, this allows play/pause controls
  // note this must come before the mediaElement is queried in peakOptions
  const url = window.URL.createObjectURL(file)
  setAudioSrc(url)

  const peakOptions: PeaksOptions = {
    containers: {
      overview: document.getElementById(`overview-container_${trackKey}`),
      zoomview: document.getElementById(`zoomview-container_${trackKey}`),
    },
    mediaElement: document.getElementById(`audio_${trackKey}`)!,
    pointMarkerColor: '#1e8bc3',
    overviewHighlightColor: '#1e8bc3',
    overviewHighlightOffset: 5,
    zoomWaveformColor: {
      linearGradientStart: 45,
      linearGradientEnd: 58,
      linearGradientColorStops: ['#D8B945', '#DD9045'],
    },
    overviewWaveformColor: {
      linearGradientStart: 45,
      linearGradientEnd: 58,
      linearGradientColorStops: ['#E2E2E2', '#CCCCCC'],
    },
    zoomLevels: [64, 128, 256, 512],
    emitCueEvents: true, // for mouse drag listener
  }

  // use waveformData to init the waveform (fast) otherwise analyze using the file handle (slow)

  if (!waveformData) {
    const arrayBuffer = await file.arrayBuffer()
    const audioCtx = new window.AudioContext()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

    await new Promise<void>(resolve =>
      WaveformData.createFromAudio(
        {
          audio_context: audioCtx,
          audio_buffer: audioBuffer,
          scale: 64,
        },
        (err, wave: WaveformData) => {
          if (err) throw err
          // @ts-ignore
          waveformData = wave.toJSON()

          db.trackState.put({
            trackId: track.id,
            file,
            waveformData,
          })
          resolve()
        }
      )
    )
  }

  if (!waveformData) throw Error('Waveform data is missing')

  // @ts-ignore
  peakOptions.waveformData = { json: waveformData }

  Peaks.init(peakOptions, async (err, waveform) => {
    if (err) throw Error(err.message)
    if (!waveform)
      throw Error('Unable to display waveform data for some reason..')

    setWaveform(waveform)

    const zoomView = waveform.views.getView('zoomview')

    // destroy the overview so that it doesn't receive the beat markers
    waveform.views.destroyOverview()
    waveform.zoom.setZoom(3) // 512
    zoomView?.showPlayheadTime(true)

    // adjust zoom view when mouse wheel is used
    if (peakOptions.containers.zoomview) {
      peakOptions.containers.zoomview.onwheel = e => {
        e.preventDefault()
        e.deltaY === 100 ? waveform.zoom.zoomOut() : waveform.zoom.zoomIn()
        setSlider()
      }
    } else
      console.error(
        'Zoomview container not found, could not set wheel zoom feature'
      )

    let { duration = 1, bpm = 1, offset = 1 } = track

    const beatInterval = 60 / bpm
    let startPoint = offset

    // work backward from initialPeak to peak out start of track (zerotime) based on bpm
    while (startPoint - beatInterval > 0) startPoint -= beatInterval

    // now that we have zerotime, move forward with peaks based on the bpm (hope the bpm is accurate!)
    const pointArray: number[] = []
    for (let time = startPoint; time < duration; time += beatInterval) {
      pointArray.push(time)
    }

    // add last point at the end to accurately size slider
    pointArray.push(duration)

    waveform.points.add(
      pointArray.map(time => ({
        time,
      }))
    )

    if (!peakOptions.containers.overview)
      throw Error('Overview container not found')

    waveform.views.createOverview(peakOptions.containers.overview)

    const timeFormat = (secs: number) =>
      new Date(secs * 1000).toISOString().substr(15, 6)
    const markFormatter = (point: number) =>
      track1 ? (
        <div style={{ marginTop: '-35px' }}>{timeFormat(point)}</div>
      ) : (
        timeFormat(point)
      )

    const slider = document.querySelector(`#slider_${trackKey}`)

    const updateScroll = (start: number) => {
      // @ts-ignore
      const scroll = (start * track.sampleRate) / zoomView?._scale
      if (slider) slider.scrollLeft = scroll
    }

    let lastMove = Date.now()
    const move = (start: number, end: number) => {
      if (Date.now() - lastMove < 100) return
      updateScroll(start)
      lastMove = Date.now()
    }

    // update slider controls on display change
    // @ts-ignore
    waveform.on('zoomview.displaying', move)

    // create initial slider control
    const setSlider = () =>
      setSliderControl({
        min: 0,
        max: pointArray[pointArray.length - 1],
        // @ts-ignore
        width: zoomView?._pixelLength,
        marks: pointArray.reduce(
          (o: any, p: number) => ({ ...o, [p]: markFormatter(p) }),
          {}
        ),
      })

    setSlider()

    // create initial segment
    /*      
  waveform.segments.add({
    startTime: sliderPoints[0],
    endTime: sliderPoints[31],
    color: 'rgba(191, 191, 63, 0.5)',
    editable: true
  })
*/

    setAnalyzing(false)
  })
}
