import { Card, Typography } from '@mui/joy'
import { Box } from '@mui/material'
import { useEffect, useState } from 'react'
import { ClientOnly } from 'remix-utils'
import { audioEvent, loadAudioEvents } from '~/api/audioEvents'
import { MixTrack, Track } from '~/api/dbHandlers'
import { Waveform } from '~/api/renderWaveform'
import {
  BeatResolutionControl,
  EjectControl,
  OffsetControl,
  TrackNavControl,
} from '~/components/tracks/Controls'
import Loader from '~/components/tracks/TrackLoader'
import TrackName from '~/components/tracks/TrackName'
import { errorHandler } from '~/utils/notifications'

const TrackView = ({
  trackId,
  beatResolution = 0.25,
}: {
  trackId: Track['id']
  beatResolution: MixTrack['beatResolution']
}) => {
  if (!trackId) throw errorHandler('Please try uploading the track again.')

  const [analyzing, setAnalyzing] = useState(false)

  const trackFooter = (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        mt: 1,
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          '--width': '200px',
          maxWidth: 'calc(50% - ((var(--width) + 16px) / 2))', // center audio controls
        }}
      >
        <EjectControl trackId={trackId} />
        <Typography
          sx={{
            fontSize: 'sm',
            fontWeight: 'md',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {TrackName(trackId)}
        </Typography>
      </Box>

      <TrackNavControl trackId={trackId} />

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'end',
        }}
      >
        <OffsetControl trackId={trackId} />
        <BeatResolutionControl
          trackId={trackId}
          beatResolution={beatResolution}
        />
      </Box>
    </Box>
  )

  const loaderSx = {
    p: 0,
    border: '1px solid',
    borderColor: 'action.focus',
    borderRadius: 'sm',
    borderBottom: 'none',
    bgcolor: 'background.body',
    overflow: 'hidden',
    height: '80px',
  }

  return (
    <Card
      variant="soft"
      sx={{
        p: 1,
        borderRadius: 'sm',
        border: '1px solid',
        borderColor: 'action.selected',
      }}
    >
      <ClientOnly>
        {() => (
          <Waveform
            trackId={trackId}
            setAnalyzing={setAnalyzing}
            sx={loaderSx}
          />
        )}
      </ClientOnly>

      {trackFooter}

      {/* <audio id="eqAudio" />
      <div id="eqCanvas" /> */}

      {!analyzing ? null : (
        <Card
          sx={{
            ...loaderSx,
            zIndex: 2,
            position: 'absolute',
            inset: 8,
          }}
        >
          <Loader style={{ margin: 'auto' }} />
        </Card>
      )}
    </Card>
  )
}

export default TrackView
