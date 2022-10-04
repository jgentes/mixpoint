import { Track } from '~/api/db'
import { TableCellProps } from '@mui/material'
import { ReactNode } from 'react'
import { SxProps } from '@mui/material/styles'
import { useSuperState } from '@superstate/react'
import { dirtyTracks } from '~/routes/__boundary/tracks'
import { Button } from '@mui/joy'
import moment from 'moment'
import { analyzeTrack, addTrackToMix } from '~/api/audio'

export const createColumnDefinitions = (): {
  dbKey: keyof Track
  label: string
  padding: TableCellProps['padding']
  align: TableCellProps['align']
  sx?: SxProps
  formatter: (t: Track) => string | ReactNode
}[] => {
  useSuperState(dirtyTracks)

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
      align: 'right',
      padding: 'normal',
      formatter: t =>
        t.bpm?.toFixed(0) ||
        (dirtyTracks.now().some(dt => dt.id == t.id) &&
        !analyzingState.now().some(a => a.id == t.id) ? (
          getBpmButton(t)
        ) : (
          <Loader style={{ margin: 0, height: '20px' }} />
        )),
    },
    {
      dbKey: 'duration',
      align: 'right',
      padding: 'normal',
      label: 'Duration',
      formatter: t => (t.duration ? formatMinutes(t.duration! / 60) : null),
    },
    {
      dbKey: 'mixpoints',
      align: 'right',
      padding: 'normal',
      label: 'Mixes',
      formatter: t => '',
    },
    {
      dbKey: 'sets',
      align: 'right',
      padding: 'normal',
      label: 'Sets',
      formatter: t => '',
    },
    {
      dbKey: 'lastModified',
      align: 'right',
      padding: 'normal',
      label: 'Updated',
      formatter: t => moment(t.lastModified).fromNow(),
    },
  ]
}
