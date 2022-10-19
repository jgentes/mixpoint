import WaveSurfer from 'wavesurfer.js'
import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor'
import PlayheadPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.playhead'
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions'
import { putTrackState, Track, TrackState } from '~/api/db'
import { errorHandler } from '~/utils/notifications'

const initPeaks = async ({
  track,
  file,
  isFromTrack,
  setSliderControl,
  setAudioSrc,
  setWaveform,
  setAnalyzing,
}: {
  track: Track
  file: TrackState['file']
  isFromTrack: boolean
  setSliderControl: Function
  setAudioSrc: Function
  setWaveform: Function
  setAnalyzing: Function
}): Promise<void> => {
  if (!track?.id) throw errorHandler('No track to initialize.')
  if (!file) throw errorHandler(`Please try adding ${track.name} again.`)

  //setAnalyzing(true)

  // const overview = WaveSurfer.create({
  //   container: `#overview-container_${track.id}`,
  //   hideScrollbar: true,
  //   plugins: [
  //     // PlayheadPlugin.create({
  //     //   returnOnPause: true,
  //     //   moveOnSeek: true,
  //     //   draw: true,
  //     // }),
  //     RegionsPlugin.create({
  //       regionsMinLength: 2,
  //       regions: [
  //         {
  //           start: 100,
  //           end: 130,
  //           loop: false,
  //           color: 'hsla(400, 100%, 30%, 0.5)',
  //         },
  //         {
  //           start: 50,
  //           end: 70,
  //           loop: false,
  //           color: 'hsla(200, 50%, 70%, 0.4)',
  //           minLength: 10,
  //           maxLength: 50,
  //         },
  //       ],
  //       dragSelection: {
  //         slop: 5,
  //       },
  //     }),
  //   ],
  // })
  // overview.loadBlob(file)

  const zoomview = WaveSurfer.create({
    container: `#zoomview-container_${track.id}`,
    height: 150,
    //scrollParent: true,
    pixelRatio: 1,
    hideScrollbar: true,
    barWidth: 2,
    barHeight: 0.75,
    barGap: 1,
    cursorColor: 'red',
    interact: false,
    // @ts-ignore
    waveColor: [
      'rgb(216, 185, 69)',
      'rgb(216, 185, 69)',
      'rgb(216, 185, 69)',
      'rgb(221, 144, 69)',
      'rgb(221, 144, 69)',
    ],
    // @ts-ignore
    progressColor: ['rgba(226, 226, 226, 0.725)'],
    plugins: [
      PlayheadPlugin.create({
        returnOnPause: true,
        moveOnSeek: true,
        draw: false,
      }),
      CursorPlugin.create({
        showTime: true,
        opacity: 1,
        customShowTimeStyle: {
          color: '#000',
          padding: '4px',
          'font-size': '12px',
        },
      }),
      RegionsPlugin.create({
        regionsMinLength: 2,
        regions: [
          {
            start: 100,
            end: 130,
            loop: false,
            color: 'hsla(400, 100%, 30%, 0.5)',
          },
          {
            start: 50,
            end: 70,
            loop: false,
            color: 'hsla(200, 50%, 70%, 0.4)',
            minLength: 10,
            maxLength: 50,
          },
        ],
      }),
    ],
  })
  zoomview.loadBlob(file)

  zoomview.on('region-click', region => {
    zoomview.playhead.setPlayheadTime(region.start)
    zoomview.playPause()
    zoomview.zoom(32)
  })

  zoomview.on('zoom', minPxPerSec => console.log(minPxPerSec))

  // const peakOptions: PeaksOptions = {
  //   containers: {
  //     overview: document.getElementById(`overview-container_${track.id}`),
  //     zoomview: document.getElementById(`zoomview-container_${track.id}`),
  //   },
  //   mediaElement: document.getElementById(`audio_${track.id}`)!,
  //   pointMarkerColor: '#1e8bc3',
  //   overviewHighlightColor: '#1e8bc3',
  //   overviewHighlightOffset: 5,
  //   zoomWaveformColor: {
  //     linearGradientStart: 45,
  //     linearGradientEnd: 58,
  //     linearGradientColorStops: ['#D8B945', '#DD9045'],
  //   },
  //   overviewWaveformColor: {
  //     linearGradientStart: 45,
  //     linearGradientEnd: 58,
  //     linearGradientColorStops: ['#e2e2e2b9', '#cccccc97'],
  //   },
  //   zoomLevels: [64, 128, 256, 512],
  //   emitCueEvents: true, // for mouse drag listener
  // }

  //   return new Promise(resolve =>
  //     Peaks.init(peakOptions, async (err, waveform) => {
  //       if (err) errorHandler(err)
  //       if (!waveform)
  //         throw errorHandler('Unable to display waveform data for some reason..')

  //       setWaveform(waveform)

  //       const zoomView = waveform.views.getView('zoomview')

  //       // destroy the overview so that it doesn't receive the beat markers
  //       waveform.views.destroyOverview()
  //       waveform.zoom.setZoom(3) // 512
  //       zoomView?.showPlayheadTime(true)

  //       // adjust zoom view when mouse wheel is used
  //       if (peakOptions.containers.zoomview) {
  //         zoomView?.setWheelMode('scroll', { captureVerticalScroll: true })
  //         // peakOptions.containers.zoomview.onwheel = e => {
  //         //   e.preventDefault()
  //         //   e.deltaY === 100 ? waveform.zoom.zoomOut() : waveform.zoom.zoomIn()
  //         //   setSlider()
  //         // }
  //       } else
  //         console.error(
  //           'Zoomview container not found, could not set wheel zoom feature'
  //         )

  //       let { duration = 1, bpm = 1, offset = 1 } = track

  //       const beatInterval = 60 / bpm
  //       let startPoint = offset

  //       // work backward from initialPeak to peak out start of track (zerotime) based on bpm
  //       while (startPoint - beatInterval > 0) startPoint -= beatInterval

  //       // now that we have zerotime, move forward with peaks based on the bpm (hope the bpm is accurate!)
  //       const pointArray: number[] = []
  //       for (let time = startPoint; time < duration; time += beatInterval) {
  //         pointArray.push(time)
  //       }

  //       // add last point at the end to accurately size slider
  //       pointArray.push(duration)

  //       waveform.points.add(
  //         pointArray.map(time => ({
  //           time,
  //         }))
  //       )

  //       if (!peakOptions.containers.overview)
  //         throw errorHandler('Overview container not found.')

  //       waveform.views.createOverview(peakOptions.containers.overview)

  //       const overView = waveform.views.getView('overview')
  //       overView?.setAmplitudeScale(0.8)

  //       const timeFormat = (secs: number) =>
  //         new Date(secs * 1000).toISOString().substring(15, 19)

  //       const markFormatter = (point: number) =>
  //         !isFromTrack ? (
  //           <div style={{ marginTop: '-35px' }}>{timeFormat(point)}</div>
  //         ) : (
  //           timeFormat(point)
  //         )

  //       const slider = document.querySelector(`#slider_${track.id}`)

  //       const updateScroll = (start: number) => {
  //         // @ts-ignore
  //         const scroll = (start * track.sampleRate) / zoomView?._scale
  //         if (slider) slider.scrollLeft = scroll
  //       }

  //       let lastMove = Date.now()
  //       const move = (start: number, end: number) => {
  //         if (Date.now() - lastMove < 100) return
  //         updateScroll(start)
  //         lastMove = Date.now()
  //       }

  //       // update slider controls on display change
  //       // @ts-ignore
  //       waveform.on('zoomview.displaying', move)

  //       // create initial slider control
  //       const setSlider = () =>
  //         setSliderControl({
  //           min: 0,
  //           max: pointArray[pointArray.length - 1],
  //           // @ts-ignore
  //           width: zoomView?._pixelLength,
  //           marks: pointArray.reduce(
  //             (o: any, p: number) => ({ ...o, [p]: markFormatter(p) }),
  //             {}
  //           ),
  //         })

  //       setSlider()

  //       // create initial segment
  //       /*
  //   waveform.segments.add({
  //     startTime: sliderPoints[0],
  //     endTime: sliderPoints[31],
  //     color: 'rgba(191, 191, 63, 0.5)',
  //     editable: true
  //   })
  // */
  //       setAnalyzing(false)

  //       resolve(waveform)
  //     })
  //   )
}

export { initPeaks }
