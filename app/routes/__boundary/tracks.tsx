import { Sheet } from '@mui/joy'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
} from '@mui/material'
import { superstate } from '@superstate/core'
import { useSuperState } from '@superstate/react'
import { processingState } from '~/api/audio'
import { db, getState, Track, useLiveQuery } from '~/api/db'
import TrackLoader from '~/components/TrackLoader'
import {
  EnhancedTableHead,
  EnhancedTableToolbar,
  searchState,
} from '~/components/tracks/tableHeader'
import TableRows from '~/components/tracks/tableRows'
import { tableOps } from '~/utils/tableOps'

export const pageState = superstate(0)
export const rowsPerPageState = superstate(10)
export const selectedState = superstate<number[]>([])

export default function TrackTable() {
  // Re-render when table selection or search changes
  useSuperState(pageState)
  useSuperState(rowsPerPageState)
  useSuperState(selectedState)

  // Re-render when search query changes
  useSuperState(searchState)

  // Show loader while processing tracks
  useSuperState(processingState)

  // Monitor db for track updates
  let tracks: Track[] | null = useLiveQuery(() => db.tracks.toArray()) ?? null

  // Recover sort state from database
  const sortDirection =
    useLiveQuery(() => getState('app', 'sortDirection')) || 'desc'
  const sortColumn =
    useLiveQuery(() => getState('app', 'sortColumn')) || 'lastModified'

  // Avoid a layout jump when reaching the last page with empty rows
  const emptyRows =
    pageState.now() > 0
      ? Math.max(
          0,
          (1 + pageState.now()) * rowsPerPageState.now() - (tracks?.length || 0)
        )
      : 0

  // Apply search
  if (searchState.now() && tracks?.length) tracks = tableOps.search(tracks)

  return (
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
      <EnhancedTableToolbar numSelected={selectedState.now().length} />
      <TableContainer>
        <Table aria-labelledby="tableTitle" size="small" padding="checkbox">
          <EnhancedTableHead
            numSelected={selectedState.now().length}
            sortDirection={sortDirection}
            sortColumn={sortColumn}
            onSelectAllClick={tableOps.selectAll}
            onRequestSort={tableOps.sort}
            rowCount={tracks?.length || 0}
          />
          <TableBody>
            {tracks &&
              [...tracks]
                .sort(
                  // @ts-ignore can't figure this one out
                  tableOps.getComparator(sortDirection, sortColumn)
                )
                .slice(
                  pageState.now() * rowsPerPageState.now(),
                  pageState.now() * rowsPerPageState.now() +
                    rowsPerPageState.now()
                )
                .map((row, index) => {
                  // row.id is the track/mix/set id
                  const isItemSelected = tableOps.isSelected(row.id)

                  return (
                    <TableRows
                      key={index}
                      row={row}
                      isItemSelected={isItemSelected}
                    />
                  )
                })}
            {emptyRows > 0 && (
              <TableRow
                style={{
                  height: 37 * emptyRows,
                }}
              >
                <TableCell colSpan={7} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {!tracks?.length && processingState.now() && (
        <TrackLoader style={{ margin: '50px auto' }} />
      )}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={tracks?.length || 0}
        rowsPerPage={rowsPerPageState.now()}
        page={pageState.now()}
        onPageChange={tableOps.changePage}
        onRowsPerPageChange={tableOps.changeRows}
      />
    </Sheet>
  )
}
