import { Add, Clear, Delete, SearchRounded } from '@mui/icons-material'
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
import { ChangeEvent, MouseEvent, useMemo, useState } from 'react'
import { analyzeTracks } from '~/api/audioHandlers'
import {
  AppState,
  db,
  getDirtyTracks,
  removeTracks,
  Track,
  useLiveQuery,
} from '~/api/dbHandlers'
import { browseFile } from '~/api/fileHandlers'
import { tableState, setModalState } from '~/api/appState'
import { createColumnDefinitions } from '~/components/tracks/tableColumns'

// Toolbar is on top of the table, includes search, info, and button bar
const EnhancedTableToolbar = (props: { numSelected: number }) => {
  const [search, setSearch] = tableState.search()
  const [selected, setSelected] = tableState.selected()

  const { numSelected } = props

  const trackCount = useLiveQuery(() => db.tracks.count())
  const dirtyTracks = useLiveQuery(() => getDirtyTracks(), [], [])

  const showRemoveTracksModal = () =>
    setModalState({
      openState: true,
      headerText: 'Are you sure?',
      bodyText: `Removing tracks here will not delete them from your computer.`,
      confirmColor: 'danger',
      confirmText: `Remove ${numSelected} track${numSelected > 1 ? 's' : ''}`,
      onConfirm: async () => {
        setModalState.openState(false)
        await removeTracks(selected as number[])
        setSelected([])
      },
      onCancel: async () => {
        setModalState.openState(false)
      },
    })

  const showAnalyzeDirtyModal = () =>
    setModalState({
      openState: true,
      headerText: 'Are you sure?',
      bodyText: `This will analyze ${dirtyTracks.length} track${
        dirtyTracks.length > 1 ? 's' : ''
      }.`,
      confirmColor: 'success',
      confirmText: `Analyze track${dirtyTracks.length > 1 ? 's' : ''}`,
      onConfirm: async () => {
        setModalState.openState(false)
        analyzeTracks(dirtyTracks)
      },
      onCancel: async () => {
        setModalState.openState(false)
      },
    })

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
        <Typography id="tableTitle" component="div" sx={{ flexBasis: '200px' }}>
          {trackCount} Track{trackCount == 1 ? '' : 's'}
          {!dirtyTracks.length ? null : (
            <Link
              onClick={() => showAnalyzeDirtyModal()}
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
        onChange={e => setSearch(e.target.value)}
        value={search}
        endDecorator={
          !search ? null : (
            <IconButton
              variant="outlined"
              size="sm"
              color="neutral"
              onClick={() => setSearch('')}
            >
              <Clear />
            </IconButton>
          )
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
        <Button
          size="sm"
          variant="soft"
          onClick={browseFile}
          sx={{ whiteSpace: 'nowrap' }}
        >
          <Add fontSize="small" />
          Add Track
        </Button>
      ) : (
        <IconButton
          variant="plain"
          title="Remove tracks"
          size="sm"
          color="neutral"
          onClick={() => showRemoveTracksModal()}
        >
          <Delete />
        </IconButton>
      )}
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

export { EnhancedTableToolbar, EnhancedTableHead }
