import { Add, Check, GraphicEq } from '@mui/icons-material'
import { Box, Chip } from '@mui/joy'
import { TableCellProps } from '@mui/material'
import { SxProps } from '@mui/material/styles'
import { useSuperState } from '@superstate/react'
import moment from 'moment'
import { analyzeTracks, analyzingState } from '~/api/audio'
import {
  addToMix,
  getState,
  removeFromMix,
  Track,
  useLiveQuery,
} from '~/api/db'
import TrackLoader from '~/components/tracks/TrackLoader'
import { tableOps } from '~/utils/tableOps'
import { openDrawerState } from '../layout/TrackDrawer'

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
      onClick={t => analyzeTracks([t])}
    >
      Analyze
    </Chip>
  )

  const AddToMixButton = ({ track }: { track: Track }) => {
    const { from, to } = useLiveQuery(() => getState('mix')) || {}

    const isInMix = from?.id === track.id || to?.id === track.id
    return (
      <Chip
        variant="outlined"
        className={isInMix ? 'visible' : 'visibleOnHover'}
        startDecorator={isInMix ? <Check /> : <Add />}
        color={isInMix ? 'success' : 'primary'}
        size="sm"
        sx={{
          maxHeight: '30px',
          alignSelf: 'center',
        }}
        onClick={() => {
          !isInMix ? addToMix(track) : removeFromMix(track.id)
        }}
      >
        {`Add${isInMix ? 'ed' : ' to Mix'}`}
      </Chip>
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
          }}
        >
          <div onClick={event => tableOps.rowClick(event, t.id)}>
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
      formatter: t =>
        t.bpm?.toFixed(0) ||
        (!analyzingState
          .now()
          .some(a => a.name == t.name && a.size == t.size) ? (
          analyzeButton(t)
        ) : (
          <TrackLoader style={{ margin: 'auto', height: '15px' }} />
        )),
    },
    {
      dbKey: 'duration',
      label: 'Duration',
      align: 'center',
      padding: 'normal',
      width: '10%',
      formatter: t => t.duration && tableOps.formatMinutes(t.duration! / 60),
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
