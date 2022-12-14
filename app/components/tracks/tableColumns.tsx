import { Add, Check, GraphicEq } from '@mui/icons-material'
import { Box, Chip } from '@mui/joy'
import { TableCellProps } from '@mui/material'
import { SxProps } from '@mui/material/styles'
import moment from 'moment'
import { audioState, setTableState } from '~/api/appState'
import { analyzeTracks } from '~/api/audioHandlers'
import {
  addToMix,
  getState,
  removeFromMix,
  Track,
  useLiveQuery,
} from '~/api/dbHandlers'
import TrackLoader from '~/components/tracks/TrackLoader'
import { formatMinutes, rowClick } from '~/utils/tableOps'

const createColumnDefinitions = (): {
  dbKey: keyof Track
  label: string
  padding: TableCellProps['padding']
  align: TableCellProps['align']
  width: TableCellProps['width']
  sx?: SxProps
  onClick?: (t: Track) => void
  formatter: (t: Track) => string | React.ReactNode
}[] => {
  const analyzeButton = (t: Track) => (
    <Chip
      variant="outlined"
      startDecorator={<GraphicEq />}
      size="sm"
      onClick={() => analyzeTracks([t])}
    >
      Analyze
    </Chip>
  )

  const addToMixHandler = async (t: Track) => {
    const { tracks = [] } = await getState('mix')

    await addToMix(t)

    // if this is the first track in the mix, leave the drawer open
    if (!tracks.length) setTableState.openDrawer(true)
  }

  const AddToMixButton = ({ track }: { track: Track }) => {
    const [analyzingTracks] = audioState.analyzing()

    const { tracks = [] } = useLiveQuery(() => getState('mix')) || {}

    const isInMix = tracks.includes(track.id)

    // Prevent user from adding a new track before previous added track finishes analyzing
    const isBeingAnalyzed = tracks.some(id => analyzingTracks.includes(id))

    return (
      <Chip
        variant="outlined"
        className={isInMix ? 'visible' : 'visibleOnHover'}
        startDecorator={isInMix ? <Check /> : <Add />}
        color={isInMix ? 'success' : 'primary'}
        size="sm"
        disabled={isBeingAnalyzed}
        sx={{
          maxHeight: '30px',
          alignSelf: 'center',
        }}
        onClick={() => {
          !isInMix ? addToMixHandler(track) : removeFromMix(track.id)
        }}
      >
        {`Add${isInMix ? 'ed' : ' to Mix'}`}
      </Chip>
    )
  }

  const BpmFormatter = (t: Track) => {
    const [analyzingTracks] = audioState.analyzing()

    return (
      t.bpm?.toFixed(0) ||
      (!analyzingTracks.some(id => id == t.id) ? (
        analyzeButton(t)
      ) : (
        <TrackLoader style={{ margin: 'auto', height: '15px' }} />
      ))
    )
  }

  return [
    {
      dbKey: 'name',
      label: 'Track name',
      align: 'left',
      padding: 'none',
      width: '60%',
      formatter: t => (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '.85rem',
          }}
        >
          <div onClick={event => rowClick(event, t.id)}>
            {t.name?.replace(/\.[^/.]+$/, '') || 'Track name not found'}
          </div>
          <AddToMixButton track={t} />
        </Box>
      ),
    },
    {
      dbKey: 'bpm',
      label: 'BPM',
      align: 'center',
      padding: 'normal',
      width: '10%',
      formatter: BpmFormatter,
    },
    {
      dbKey: 'duration',
      label: 'Duration',
      align: 'center',
      padding: 'normal',
      width: '10%',
      formatter: t => t.duration && formatMinutes(t.duration! / 60),
    },
    {
      dbKey: 'mixpoints',
      label: 'Mixes',
      align: 'center',
      padding: 'normal',
      width: '5%',
      formatter: t => '',
    },
    {
      dbKey: 'sets',
      label: 'Sets',
      align: 'center',
      padding: 'normal',
      width: '5%',
      formatter: t => '',
    },
    {
      dbKey: 'lastModified',
      label: 'Updated',
      align: 'right',
      padding: 'normal',
      width: '10%',
      sx: { whiteSpace: 'nowrap' },
      formatter: t => moment(t.lastModified).fromNow(),
    },
  ]
}

export { createColumnDefinitions }
