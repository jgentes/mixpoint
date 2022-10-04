import { useEffect, useState, MouseEvent, ChangeEvent } from 'react'
import { getComparator } from '~/utils/tableTools'
import { db, Track, useLiveQuery, getState, AppState } from '~/api/db'
import { alpha } from '@mui/material/styles'
import {
  Box,
  Card,
  Sheet,
  Button,
  TextField,
  Checkbox,
  Typography,
  IconButton,
} from '@mui/joy'
import {
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Tooltip,
} from '@mui/material'
import Loader from '~/styles/loader'
import { Add, PriorityHigh, Delete, SearchRounded } from '@mui/icons-material'
import { visuallyHidden } from '@mui/utils'
import Dropzone from '~/components/Dropzone'
import { browseFile, processingState, analyzingState } from '~/api/fileHandlers'
import { superstate } from '@superstate/core'
import { useSuperState } from '@superstate/react'
import { createColumnDefinitions } from '~/components/tracks/columns'

// Dirty tracks are tracks that have not been analyzed
export const dirtyTracks = superstate<Track[]>([])

export default function TrackTable({
  hideDropzone,
  trackKey,
}: {
  hideDropzone?: boolean
  trackKey?: number
}) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [selected, setSelected] = useState<readonly number[]>([])
  const [searchVal, setSearch] = useState('')

  // show loader while processing tracks
  useSuperState(analyzingState)
  useSuperState(processingState)

  // monitor db for track updates
  let tracks: Track[] | null = useLiveQuery(() => db.tracks.toArray()) ?? null

  const sortOrder = useLiveQuery(() => getState('app')?.sortOrder || 'desc')
  const sortOrderBy = useLiveQuery(() => getState('app')?.sortOrderBy || 'name')

  // if we see any tracks that haven't been processed, process them, or
  // if we haven't had user activation, show button to resume processing
  // https://html.spec.whatwg.org/multipage/interaction.html#tracking-user-activation
  useEffect(() => {
    dirtyTracks.set(tracks?.filter(t => !t.bpm) || [])
  }, [tracks])

  const columnDefs = createColumnDefinitions()

  const EnhancedTableHead = (props: {
    numSelected: number
    onRequestSort: (event: MouseEvent<unknown>, property: keyof Track) => void
    onSelectAllClick: (event: ChangeEvent<HTMLInputElement>) => void
    sortOrder: AppState['sortOrder']
    sortOrderBy: AppState['sortOrderBy']
    rowCount: number
  }) => {
    const {
      onSelectAllClick,
      sortOrder,
      sortOrderBy,
      numSelected,
      rowCount,
      onRequestSort,
    } = props

    const createSortHandler =
      (property: keyof Track) => (event: MouseEvent<unknown>) => {
        onRequestSort(event, property)
      }

    return (
      <TableHead>
        <TableRow>
          <TableCell>
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
              sortDirection={sortOrderBy === column.dbKey ? sortOrder : false}
            >
              <TableSortLabel
                active={sortOrderBy === column.dbKey}
                direction={sortOrderBy === column.dbKey ? sortOrder : 'asc'}
                onClick={createSortHandler(column.dbKey)}
              >
                {column.label}
                {sortOrderBy === column.dbKey ? (
                  <Card component="span" sx={visuallyHidden}>
                    {sortOrder === 'desc'
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

  const EnhancedTableToolbar = (props: { numSelected: number }) => {
    const { numSelected } = props

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
            Tracks
          </Typography>
        )}
        <TextField
          size="sm"
          variant="soft"
          placeholder="Search..."
          startDecorator={<SearchRounded color="primary" />}
          onChange={e => setSearch(e.target.value)}
          value={searchVal}
          endDecorator={
            <IconButton variant="outlined" size="sm" color="neutral">
              <Typography
                fontWeight="lg"
                fontSize="sm"
                textColor="text.tertiary"
              >
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
          <>
            {!dirtyTracks.length ? null : (
              <div style={{ alignSelf: 'center' }}>
                <PriorityHigh style={{ marginRight: '5px' }} />
                {`BPM needed for ${dirtyTracks.length} Track${
                  tracks?.length === 1 ? '' : 's'
                }`}
              </div>
            )}
            <div style={{ alignSelf: 'center' }}>
              <Button size="sm" variant="soft" onClick={browseFile}>
                <Add />
                Add Track
              </Button>
            </div>
          </>
        ) : (
          <Tooltip title="Delete">
            <IconButton>
              <Delete />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
    )
  }

  if (searchVal && tracks)
    tracks = tracks.filter(t =>
      t.name?.toLowerCase().includes(searchVal.toLowerCase())
    )

  const tableOps = {
    sort: (event: MouseEvent<unknown>, property: keyof Track) => {
      const isAsc = sortOrderBy === property && sortOrder === 'asc'
      db.appState.put({ sortOrder: isAsc ? 'desc' : 'asc', sortOrderBy })
    },

    selectAll: (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.target.checked) return setSelected([])

      const newSelected = tracks?.map(n => n.id)
      if (newSelected) setSelected(newSelected)
    },

    rowClick: (event: MouseEvent<unknown>, id: Track['id']) => {
      const selectedIndex = selected.indexOf(id)
      let newSelected: readonly Track['id'][] = []

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, id)
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1))
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1))
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          selected.slice(0, selectedIndex),
          selected.slice(selectedIndex + 1)
        )
      }

      setSelected(newSelected)
    },

    changePage: (event: unknown, newPage: number) => {
      setPage(newPage)
    },

    changeRows: (event: ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10))
      setPage(0)
    },

    isSelected: (id: Track['id']) => selected.indexOf(id) !== -1,
  }

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (tracks?.length || 0)) : 0

  const RowState: React.FunctionComponent<{
    key: number
    row: Track
    isItemSelected: boolean
  }> = ({ key, row, isItemSelected }) => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <TableRow
          key={key}
          hover
          selected={isItemSelected}
          onClick={() => setOpen(!open)}
        >
          <TableCell
            padding="checkbox"
            onClick={event => tableOps.rowClick(event, row.id)}
            role="checkbox"
            aria-checked={isItemSelected}
            tabIndex={-1}
            sx={{ cursor: 'pointer' }}
          >
            <Checkbox
              color="primary"
              checked={isItemSelected}
              onClick={event => tableOps.rowClick(event, row.id)}
              title={row.name}
            />
          </TableCell>
          {columnDefs.map((column, i) => (
            <TableCell
              key={i}
              id={`${column.dbKey}-${row.id}`}
              sx={{ cursor: 'default' }}
              align={column.align}
              padding={column.padding}
            >
              {column.formatter(row)}
            </TableCell>
          ))}
        </TableRow>
        {/* <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton> */}
        <TableRow
          hover
          selected={isItemSelected}
          onClick={() => setOpen(!open)}
        >
          <TableCell sx={{ pb: 0, pt: 0, border: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Card sx={{ margin: 1 }}>
                <Table size="small" aria-label="purchases">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Total price ($)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.history?.map(historyRow => (
                      <TableRow key={historyRow.date}>
                        <TableCell component="th" scope="row">
                          {historyRow.date}
                        </TableCell>
                        <TableCell>{historyRow.customerId}</TableCell>
                        <TableCell align="right">{historyRow.amount}</TableCell>
                        <TableCell align="right">23532</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    )
  }

  return (
    <Box>
      {/* DropZone */}
      {hideDropzone ? null : <Dropzone onClick={browseFile} />}
      <Sheet
        variant="outlined"
        sx={{
          width: '100%',
          mb: 2,
          borderRadius: 'sm',
          bgcolor: 'background.body',
          overflow: 'auto',
        }}
      >
        <EnhancedTableToolbar numSelected={selected.length} />
        <TableContainer>
          <Table aria-labelledby="tableTitle" size="small" padding="checkbox">
            <EnhancedTableHead
              numSelected={selected.length}
              sortOrder={sortOrder}
              sortOrderBy={sortOrderBy}
              onSelectAllClick={tableOps.selectAll}
              onRequestSort={tableOps.sort}
              rowCount={tracks?.length || 0}
            />
            <TableBody>
              <>
                {!tracks || processingState ? (
                  <TableRow>
                    <TableCell>
                      <Loader style={{ margin: '50px auto' }} />
                    </TableCell>
                  </TableRow>
                ) : (
                  [...tracks]
                    // @ts-ignore: TS complains about the type of orderBy due to history being an array
                    .sort(getComparator(sortOrder, sortOrderBy))
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => {
                      // row.id is the track/mix/set id
                      const isItemSelected = tableOps.isSelected(row.id)

                      return (
                        <RowState
                          key={index}
                          row={row}
                          isItemSelected={isItemSelected}
                        />
                      )
                    })
                )}
                {emptyRows > 0 && (
                  <TableRow
                    style={{
                      height: 33 * emptyRows,
                    }}
                  >
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </>
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={tracks?.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={tableOps.changePage}
          onRowsPerPageChange={tableOps.changeRows}
        />
      </Sheet>
    </Box>
  )
}
