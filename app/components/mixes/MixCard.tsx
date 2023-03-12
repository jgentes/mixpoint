import { Box, Card, Typography } from '@mui/joy'
import { tableState } from '~/api/appState'
import { getTrackName, Track, useLiveQuery } from '~/api/db/dbHandlers'
import StemPanel from '~/components/mixes/StemPanel'
import TrackPanel from '~/components/mixes/TrackPanel'
import VolumeMeter from '~/components/mixes/VolumeMeter'
import {
  BpmControl,
  EjectControl,
  TrackNavControl,
} from '~/components/tracks/Controls'
import Dropzone from '~/components/tracks/Dropzone'
import Loader from '~/components/tracks/TrackLoader'

const MixCard = ({ trackId }: { trackId: Track['id'] }) => {
  const [analyzingTracks] = tableState.analyzing()
  const analyzing = analyzingTracks.includes(trackId)

  const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

  const trackHeader = (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        mb: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box
        id='track-title'
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
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
          {trackName}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          marginLeft: 'auto',
        }}
      >
        <BpmControl trackId={trackId} />
      </Box>
    </Box>
  )

  const trackFooter = (
    <Box
      sx={{
        mx: 'auto',
        mt: 1,
      }}
    >
      <TrackNavControl trackId={trackId} />
    </Box>
  )

  const loaderSx = {
    p: 0,
    border: '1px solid',
    borderColor: 'action.focus',
    borderRadius: '4px',
    borderBottom: 'none',
    bgcolor: 'background.body',
    overflow: 'hidden',
    zIndex: 1,
  }

  return (
    <Card
      sx={{
        p: 1,
        borderRadius: '4px',
        border: '1px solid',
        borderColor: 'action.selected',
        flexBasis: '45%',
      }}
    >
      {!trackId ? (
        <Dropzone sx={{ height: '100%' }} />
      ) : (
        <>
          {trackHeader}

          {/* loader cover */}
          {!analyzing ? null : (
            <Card
              sx={{
                ...loaderSx,
                zIndex: 2,
                position: 'absolute',
                inset: '40px 8px calc(100% - 67px)',
              }}
            >
              <Loader style={{ margin: 'auto' }} />
            </Card>
          )}

          {/* overview */}
          <Card
            id={`overview-container_${trackId}`}
            sx={{
              ...loaderSx,
              height: '25px',
            }}
          />

          <Box sx={{ mt: 1 }}>
            <StemPanel trackId={trackId} />
          </Box>

          <Box
            sx={{
              p: 1,
              mt: 1,
              borderRadius: '4px',
              border: '1px solid',
              borderColor: 'action.selected',
              backgroundColor: 'background.level1',
            }}
          >
            <TrackPanel trackId={trackId} />
          </Box>

          {trackFooter}
        </>
      )}
    </Card>
  )
}

export { MixCard as default }
