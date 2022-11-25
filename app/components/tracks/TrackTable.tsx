import { Box, Sheet } from '@mui/joy'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
} from '@mui/material'
import { useState } from 'react'
import { audioState, tableState } from '~/api/appState'
import { db, getState, useLiveQuery } from '~/api/dbHandlers'
import Dropzone, { itemsDropped } from '~/components/tracks/Dropzone'
import LeftNav from '~/components/tracks/LeftNav'
import {
  EnhancedTableHead,
  EnhancedTableToolbar,
} from '~/components/tracks/tableHeader'
import TableRows from '~/components/tracks/tableRows'
import TrackLoader from '~/components/tracks/TrackLoader'
import {
  changePage,
  changeRows,
  formatMinutes,
  getComparator,
  isSelected,
  selectAll,
  sort,
} from '~/utils/tableOps'

const TrackTable = () => {
  // Re-render when page or selection changes
  const [page] = tableState.page()
  const [rowsPerPage] = tableState.rowsPerPage()
  const [selected] = tableState.selected()

  // Re-render when search query changes
  const [search] = tableState.search()

  // Show loader while processing tracks
  const [processing] = audioState.processing()

  // Allow drag & drop files / folders into the table
  const [dragOver, setDragOver] = useState(false)

  // Monitor db for track updates (and filter using searchquery if present)
  const tracks = useLiveQuery(
    () =>
      db.tracks
        .filter(
          t =>
            t.name?.toLowerCase().includes(`${search}`.toLowerCase()) ||
            t.bpm?.toString().includes(`${search}`) ||
            formatMinutes(t.duration! / 60)
              .toString()
              .includes(`${search}`)
        )
        .toArray(),
    [search],
    null
  )

  // Retrieve sort state from database
  const { sortDirection = 'desc', sortColumn = 'lastModified' } =
    useLiveQuery(() => getState('app')) || {}

  // Avoid a layout jump when reaching the last page with empty rows
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (tracks?.length || 0)) : 0

  return (
    tracks && (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(64px, 200px) minmax(450px, 1fr)',
          height: '100%',
        }}
      >
        <LeftNav />

        <Box component="main" sx={{ p: 2 }}>
          <Sheet
            variant="outlined"
            id="track-table"
            sx={{
              borderRadius: 'sm',
              bgcolor: 'background.body',
              overflow: 'auto',

              borderColor: dragOver ? '#30b2e9' : undefined,
              backgroundColor: dragOver ? 'rgba(48, 178, 233, 0.1)' : undefined,
            }}
            onDrop={e => {
              e.preventDefault()
              itemsDropped(e.dataTransfer.items)
              setDragOver(false)
            }}
            onDragOver={e => {
              e.stopPropagation()
              e.preventDefault()
              setDragOver(true)
            }}
            onDragEnter={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
          >
            <EnhancedTableToolbar numSelected={selected.length} />
            <TableContainer>
              <Table
                aria-labelledby="tableTitle"
                size="small"
                padding="checkbox"
              >
                <EnhancedTableHead
                  numSelected={selected.length}
                  sortDirection={sortDirection}
                  sortColumn={sortColumn}
                  onSelectAllClick={selectAll}
                  onRequestSort={sort}
                  rowCount={tracks?.length || 0}
                />
                <TableBody>
                  {[...tracks]
                    .sort(
                      // @ts-ignore can't figure this one out
                      getComparator(sortDirection, sortColumn)
                    )
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => {
                      // row.id is the track/mix/set id
                      const isItemSelected = isSelected(row.id)

                      return (
                        <TableRows
                          key={index}
                          row={row}
                          isItemSelected={isItemSelected}
                        />
                      )
                    })}
                  {emptyRows == 0 ? null : (
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
            {tracks.length ? null : processing ? (
              <TrackLoader style={{ margin: '50px auto' }} />
            ) : (
              <div style={{ margin: 'auto', padding: '10px 20px 0' }}>
                <Dropzone />
              </div>
            )}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={tracks.length || 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={changePage}
              onRowsPerPageChange={changeRows}
            />
          </Sheet>
        </Box>
      </Box>
    )
  )
}

export { TrackTable as default }
