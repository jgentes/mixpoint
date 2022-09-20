import { useEffect, useRef, useState } from 'react'
import { ButtonGroup, Dialog } from '@mui/material'
import { AccessTime, Eject, Pause, PlayArrow, Undo } from '@mui/icons-material'
import { Button, Card, TextField } from '@mui/joy'
import Loader from '../../layout/loader'
import Slider, { SliderProps } from 'rc-slider'
import { initPeaks } from './initPeaks'
import { PeaksInstance } from 'peaks.js'
import Tracks from '../tracks/Tracks'
import WaveformData from 'waveform-data'
import { Track, db, TrackState, useLiveQuery } from '../../db'
import { Events } from '../../Events'

const TrackForm = ({ trackKey }: { trackKey: number }) => {
  interface SliderControlProps extends SliderProps {
    width: number
  }

  const [sliderControl, setSliderControl] = useState<SliderControlProps>()
  const [playing, setPlaying] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [waveform, setWaveform] = useState<PeaksInstance>()
  const [audioSrc, setAudioSrc] = useState('')
  const [tableState, openTable] = useState(false)
  const [track, setTrack] = useState<Track>()
  const [bpmTimer, setBpmTimer] = useState<number>()

  const audioElement = useRef<HTMLAudioElement>(null)

  const track1 = trackKey == 0
  const zoomView = waveform?.views.getView('zoomview')
  const trackState: TrackState =
    useLiveQuery(() => db.trackState.get({ trackKey })) || {}
  const { trackId, mixPoint } = trackState

  const audioEffect = (detail: { tracks: number[]; effect: string }) => {
    if (!detail.tracks.includes(trackState.trackId!)) return

    setPlaying(detail.effect == 'play')

    switch (detail.effect) {
      case 'play':
        zoomView?.enableAutoScroll(true)
        audioElement.current?.play()
        break
      case 'pause':
        audioElement.current?.pause()
        zoomView?.enableAutoScroll(true)
        break
      case 'stop':
        audioElement.current?.pause()
        waveform?.player.seek(mixPoint || 0)
        zoomView?.enableAutoScroll(true)
    }
  }

  useEffect(() => {
    let getTrack
    const getTrackData = async () => {
      if (!trackState.trackId) return

      if (trackState.trackId !== track?.id) {
        getTrack = await db.tracks.get(trackState.trackId!)
        setTrack(getTrack)

        if (getTrack && trackState.waveformData && !waveform)
          getPeaks(getTrack, trackKey, trackState.file, trackState.waveformData)
      }

      // add event listeners
      Events.on('audio', audioEffect)

      // listener cleanup
      return function cleanup() {
        Events.remove('audio', audioEffect)
      }
    }

    getTrackData()
  }, [trackState])

  const updatePlaybackRate = (bpm: number) => {
    // update play speed to new bpm
    const playbackRate = bpm / (track?.bpm || bpm)
    if (audioElement.current) audioElement.current.playbackRate = playbackRate
  }

  const adjustBpm = async (bpm?: number) => {
    // get bpm from the user input field or mixState or current track
    bpm = bpm ?? Number(track?.bpm)

    updatePlaybackRate(bpm)

    // store custom bpm value in trackstate
    await db.trackState.update(
      { trackKey },
      {
        adjustedBpm: Number(bpm.toFixed(1)),
      }
    )
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

  const selectTime = async (time: number) => {
    await db.trackState.update(
      { trackKey },
      {
        mixPoint: time,
      }
    )

    waveform?.player.seek(time)
    zoomView?.enableAutoScroll(false)

    Events.dispatch('audio', {
      effect: 'play',
      tracks: [trackId],
    })

    /*
    waveform?.segments.add({
      startTime: time,
      endTime: sliderPoints[31],
      color: 'rgba(191, 191, 63, 0.5)',
      editable: true
    })
    */
  }

  const setMixPoint = async () => {
    //const id = await addMix(mixState.tracks.map(t => t.id))
    //await updateMixState({ ...mixState, mix: { id } })
  }

  const timeFormat = (secs: number) =>
    new Date(secs * 1000).toISOString().substr(15, 6)

  const adjustedBpm =
    trackState.adjustedBpm && Number(trackState.adjustedBpm).toFixed(1)

  const bpmDiff = adjustedBpm && adjustedBpm !== track?.bpm?.toFixed(1)

  const bpmControl = (
    <div
      style={{
        display: 'inline-flex',
        flexBasis: bpmDiff ? '136px' : '100px',
        flexShrink: 0,
      }}
    >
      <TextField
        disabled={!track?.bpm}
        onChange={val => {
          console.log('changeval:', val)
          if (val) {
            if (bpmTimer) window.clearTimeout(bpmTimer)
            const debounce = window.setTimeout(() => adjustBpm(val), 1000)
            setBpmTimer(debounce)
          }
        }}
        value={adjustedBpm || track?.bpm?.toFixed(1) || 0}
        id={`bpmInput_${trackKey}`}
        variant="solid"
      />
      <Button
        color="primary"
        disabled={!bpmDiff}
        onClick={() => adjustBpm(track?.bpm || 1)}
        id={`bpmButton_${trackKey}`}
      >
        {bpmDiff ? 'Reset ' : ''}BPM
      </Button>
    </div>
  )

  const playerControl = !track?.name ? null : (
    <>
      <ButtonGroup
        variant="contained"
        style={{
          visibility: analyzing ? 'hidden' : 'visible',
        }}
      >
        <Button
          onClick={() => {
            Events.dispatch('audio', { effect: 'stop', tracks: [trackId] })
          }}
          id={`stopButton_${trackKey}`}
        >
          Stop
          <Undo />
        </Button>

        <Button
          onClick={() => {
            Events.dispatch('audio', {
              effect: playing ? 'pause' : 'play',
              tracks: [trackId],
            })
          }}
          id={`playButton_${trackKey}`}
        >
          {playing ? 'Pause' : 'Play'}
          {playing ? <Pause /> : <PlayArrow />}
        </Button>
      </ButtonGroup>
      <TextField size="lg" value={timeFormat(mixPoint || 0)}>
        <AccessTime />
      </TextField>
    </>
  )

  const trackHeader = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: track1 ? '5px' : 0,
        marginTop: track1 ? 0 : '10px',
      }}
    >
      <div
        style={{
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <Button
          size="sm"
          onClick={() => openTable(true)}
          id={`loadButton_${trackKey}`}
          style={{ marginRight: '8px' }}
        >
          <Eject titleAccess="Load Track" />
        </Button>

        <Typeography
          variant="h5"
          style={{
            display: 'inline',
            verticalAlign: track1 ? 'text-bottom' : 'middle',
          }}
        >
          {analyzing
            ? 'Loading..'
            : track?.name?.replace(/\.[^/.]+$/, '') || 'No Track Loaded..'}
        </Typeography>
      </div>
      {bpmControl}
    </div>
  )

  const slider = (
    <div
      style={{
        overflow: 'scroll',
        overflowX: 'hidden',
        overflowY: 'hidden',
        visibility: analyzing ? 'hidden' : 'visible',
      }}
      id={`slider_${trackKey}`}
    >
      <div
        style={{
          width: `${sliderControl?.width}px`,
          paddingTop: track1 ? '10px' : '20px',
          paddingBottom: track1 ? '20px' : '10px',
        }}
      >
        {!sliderControl?.max ? null : (
          <Slider
            min={sliderControl.min || 0}
            max={sliderControl.max}
            marks={sliderControl.marks || {}}
            step={null}
            included={false}
            onAfterChange={time => selectTime(time)}
            dotStyle={{ borderColor: '#1e8bc3' }}
            handleStyle={{ borderColor: '#cc1d1d' }}
          />
        )}
      </div>
    </div>
  )

  const zoomview = (
    <div
      id={`zoomview-container_${trackKey}`}
      style={{
        height: '150px',
        visibility: analyzing ? 'hidden' : 'visible',
      }}
    />
  )

  const loader = analyzing ? <Loader style={{ margin: '15px 0' }} /> : null

  const TracksDialog = () => (
    <Dialog
      open={tableState}
      onClose={() => openTable(false)}
      style={{ width: '80%' }}
    >
      <Tracks
        trackKey={trackKey}
        hideDropzone={true}
        openTable={openTable}
        getPeaks={getPeaks}
      />
    </Dialog>
  )

  return (
    <>
      <div style={{ display: 'flex', margin: '15px 0' }}>
        <Card style={{ flex: '0 0 250px' }}>{playerControl}</Card>
        <Card
          style={{
            flex: 'auto',
            marginLeft: '15px',
            overflow: 'hidden',
          }}
        >
          <div>
            {track1 && trackHeader}
            <>{!track1 && track?.name && slider}</>

            <div id={`peaks-container_${trackKey}`}>
              {track1 ? (
                <>
                  {loader}
                  {zoomview}
                </>
              ) : (
                <>
                  {zoomview}
                  {loader}
                </>
              )}
            </div>

            <>{track1 && track?.name && slider}</>
            {!track1 && trackHeader}

            <audio id={`audio_${trackKey}`} src={audioSrc} ref={audioElement} />
          </div>
        </Card>
      </div>
      <TracksDialog />
    </>
  )
}

export default TrackForm
