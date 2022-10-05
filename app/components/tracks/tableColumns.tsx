import { Button } from '@mui/joy'
import { TableCellProps } from '@mui/material'
import { SxProps } from '@mui/material/styles'
import moment from 'moment'
import { ReactNode } from 'react'
import {
  addTrackToMix,
  analyzeTrack,
  analyzingState,
  dirtyTrackState,
} from '~/api/audio'
import { Track } from '~/api/db'
import TrackLoader from '~/components/TrackLoader'

export const createColumnDefinitions = (): {
  dbKey: keyof Track
  label: string
  padding: TableCellProps['padding']
  align: TableCellProps['align']
  sx?: SxProps
  formatter: (t: Track) => string | ReactNode
}[] => {
  const formatMinutes = (mins: number) => {
    return moment().startOf('day').add(mins, 'minutes').format('m:ss')
  }

  const getBpmButton = (t: Track) => {
    return (
      <Button
        size="sm"
        onClick={e => {
          e.preventDefault()
          analyzeTrack(t)
        }}
      >
        Get BPM
      </Button>
    )
  }

  const AddToMixButton = ({ track }: { track: Track }) => (
    <Button
      variant="outlined"
      size="sm"
      onClick={() => addTrackToMix(track, trackKey)}
    >
      Add to Mix
    </Button>
  )

  return [
    {
      dbKey: 'name',
      label: 'Track name',
      align: 'left',
      padding: 'none',
      // remove suffix (ie. .mp3)
      formatter: t =>
        t.name?.replace(/\.[^/.]+$/, '') || 'Track name not found',
    },
    {
      dbKey: 'bpm',
      label: 'BPM',
      align: 'left',
      padding: 'normal',
      formatter: t => t.bpm?.toFixed(0) || null,
    },
    {
      dbKey: 'duration',
      align: 'left',
      padding: 'normal',
      label: 'Duration',
      formatter: t =>
        t.duration ? (
          formatMinutes(t.duration! / 60)
        ) : dirtyTrackState.now().some(dt => dt.id == t.id) &&
          !analyzingState.now().some(a => a.id == t.id) ? (
          getBpmButton(t)
        ) : (
          <TrackLoader style={{ margin: 0, height: '15px' }} />
        ),
    },
    {
      dbKey: 'mixpoints',
      align: 'left',
      padding: 'normal',
      label: 'Mixes',
      formatter: t => '',
    },
    {
      dbKey: 'sets',
      align: 'left',
      padding: 'normal',
      label: 'Sets',
      formatter: t => '',
    },
    {
      dbKey: 'lastModified',
      align: 'right',
      padding: 'normal',
      label: 'Updated',
      sx: { whiteSpace: 'nowrap' },
      formatter: t => moment(t.lastModified).fromNow(),
    },
  ]
}
