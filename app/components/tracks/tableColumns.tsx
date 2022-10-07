import { GraphicEq } from '@mui/icons-material'
import { Chip } from '@mui/joy'
import { TableCellProps } from '@mui/material'
import { SxProps } from '@mui/material/styles'
import moment from 'moment'
import { ReactNode } from 'react'
import { addTrackToMix, analyzeTracks, analyzingState } from '~/api/audio'
import { Track } from '~/api/db'
import TrackLoader from '~/components/TrackLoader'

export const createColumnDefinitions = (): {
  dbKey: keyof Track
  label: string
  padding: TableCellProps['padding']
  align: TableCellProps['align']
  width: TableCellProps['width']
  sx?: SxProps
  onClick?: (t: Track) => void
  formatter: (t: Track) => string | ReactNode
}[] => {
  const formatMinutes = (mins: number) => {
    return moment().startOf('day').add(mins, 'minutes').format('m:ss')
  }

  const analyzeButton = (t: Track) => (
    <Chip variant="outlined" startDecorator={<GraphicEq />} size="sm">
      Analyze
    </Chip>
  )

  const AddToMixButton = ({ track }: { track: Track }) => (
    <Chip
      variant="outlined"
      startDecorator={<GraphicEq />}
      size="sm"
      onClick={() => addTrackToMix(track, trackKey)}
    >
      Add to Mix
    </Chip>
  )

  return [
    {
      dbKey: 'name',
      label: 'Track name',
      align: 'left',
      padding: 'none',
      width: '60%',
      // remove suffix (ie. .mp3)
      formatter: t =>
        t.name?.replace(/\.[^/.]+$/, '') || 'Track name not found',
    },
    {
      dbKey: 'bpm',
      label: 'BPM',
      align: 'center',
      padding: 'normal',
      width: '10%',
      onClick: t => analyzeTracks([t]),
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
