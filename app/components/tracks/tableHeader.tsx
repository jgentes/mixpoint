import { Add, Delete, SearchRounded } from '@mui/icons-material'
import {
  Button,
  Card,
  Checkbox,
  IconButton,
  Link,
  TextField,
  Typography,
} from '@mui/joy'
import {
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Toolbar,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { visuallyHidden } from '@mui/utils'
import { superstate } from '@superstate/core'
import { useSuperState } from '@superstate/react'
import { ChangeEvent, MouseEvent, useMemo, useState } from 'react'
import { analyzeTracks } from '~/api/audio'
import {
  AppState,
  db,
  getDirtyTracks,
  removeTracks,
  Track,
  useLiveQuery,
} from '~/api/db'
import { browseFile } from '~/api/fileHandlers'
import { selectedState } from '~/routes/__boundary/tracks'
import ConfirmModal from '../ConfirmModal'
import { createColumnDefinitions } from './tableColumns'

// Broadcast search query
const searchState = superstate<string | number>('')

// Toolbar is on top of the table, includes search, info, and button bar
const EnhancedTableToolbar = (props: { numSelected: number }) => {
  useSuperState(searchState)

  const [openRemoveModal, setOpenRemoveModal] = useState(false)
  const [openAnalyzeModal, setOpenAnalyzeModal] = useState(false)

  const { numSelected } = props

  const trackCount = useLiveQuery(() => db.tracks.count())
  const dirtyTracks = useLiveQuery(() => getDirtyTracks()) ?? []

  const RemoveTracksModal = () => (
    <ConfirmModal
      openState={openRemoveModal}
      setOpenState={setOpenRemoveModal}
      headerText={'Are you sure?'}
      bodyText={`Removing tracks here will not delete them from your computer.`}
      confirmColor="danger"
      confirmText={`Remove ${numSelected} track${numSelected > 1 ? 's' : ''}`}
      clickHandler={async () => {
        setOpenRemoveModal(false)
        await removeTracks(selectedState.now())
        selectedState.set([])
      }}
    />
  )

  const AnalyzeDirtyModal = () => (
    <ConfirmModal
      openState={openAnalyzeModal}
      setOpenState={setOpenAnalyzeModal}
      headerText={'Are you sure?'}
      bodyText={`This will analyze ${dirtyTracks.length} track${
        dirtyTracks.length > 1 ? 's' : ''
      }.`}
      confirmColor="success"
      confirmText={`Analyze track${dirtyTracks.length > 1 ? 's' : ''}`}
      clickHandler={() => {
        setOpenAnalyzeModal(false)
        analyzeTracks(dirtyTracks)
      }}
    />
  )

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 2 },
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gridColumn: '1 / -1',
        borderBottom: '1px solid',
        borderColor: 'divider',
        position: 'sticky',
        ...(numSelected > 0 && {
          bgcolor: theme =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity
            ),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography component="div">{numSelected} selected</Typography>
      ) : (
        <Typography id="tableTitle" component="div">
          {trackCount} Track{trackCount == 1 ? '' : 's'}
          {!dirtyTracks.length ? null : (
            <Link
              onClick={() => setOpenAnalyzeModal(true)}
              variant="plain"
              level="body3"
              underline="none"
              sx={{ p: '2px 6px', ml: 1 }}
            >
              {dirtyTracks.length} to analyze
            </Link>
          )}
        </Typography>
      )}
      <TextField
        size="sm"
        variant="soft"
        placeholder="Search..."
        startDecorator={<SearchRounded color="primary" />}
        onChange={e => searchState.set(e.target.value)}
        value={searchState.now()}
        endDecorator={
          <IconButton variant="outlined" size="sm" color="neutral">
            <Typography fontWeight="lg" fontSize="sm" textColor="text.tertiary">
              /
            </Typography>
          </IconButton>
        }
        sx={{
          fontWeight: 'thin',
          flexBasis: '500px',
          mx: 2,
          display: {
            xs: 'none',
            sm: 'flex',
          },
        }}
      />
      {numSelected == 0 ? (
        <div style={{ alignSelf: 'center' }}>
          <Button size="sm" variant="soft" onClick={browseFile}>
            <Add />
            Add Track
          </Button>
        </div>
      ) : (
        <>
          <IconButton
            variant="plain"
            title="Remove tracks"
            size="sm"
            color="neutral"
            onClick={() => setOpenRemoveModal(true)}
          >
            <Delete />
          </IconButton>
          <RemoveTracksModal />
        </>
      )}

      <AnalyzeDirtyModal />
    </Toolbar>
  )
}

// Table header includes column headers, select all, and sort buttons
const EnhancedTableHead = (props: {
  numSelected: number
  onRequestSort: (event: MouseEvent<unknown>, property: keyof Track) => void
  onSelectAllClick: (event: ChangeEvent<HTMLInputElement>) => void
  sortDirection: AppState['sortDirection']
  sortColumn: AppState['sortColumn']
  rowCount: number
}) => {
  const {
    onSelectAllClick,
    sortDirection,
    sortColumn,
    numSelected,
    rowCount,
    onRequestSort,
  } = props

  // Build table columns (once)
  const columnDefs = useMemo(() => createColumnDefinitions(), [])

  const createSort =
    (property: keyof Track) => (event: MouseEvent<unknown>) => {
      onRequestSort(event, property)
    }

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="none" sx={{ padding: '7px 12px 0 16px' }}>
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            title="Select all"
          />
        </TableCell>
        {columnDefs.map((column, i) => (
          <TableCell
            key={i}
            align={column.align}
            padding={column.padding}
            width={column.width}
            sx={{
              ...column.sx,
              padding: column.align == 'center' ? '6px 0 0 28px' : '',
            }}
            sortDirection={sortColumn === column.dbKey ? sortDirection : false}
          >
            <TableSortLabel
              active={sortColumn === column.dbKey}
              direction={sortColumn === column.dbKey ? sortDirection : 'asc'}
              onClick={createSort(column.dbKey)}
            >
              {column.label}
              {sortColumn === column.dbKey ? (
                <Card component="span" sx={visuallyHidden}>
                  {sortDirection === 'desc'
                    ? 'sorted descending'
                    : 'sorted ascending'}
                </Card>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

export { searchState, EnhancedTableToolbar, EnhancedTableHead }
