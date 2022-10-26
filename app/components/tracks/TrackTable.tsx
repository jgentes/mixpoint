import { Box, Sheet } from '@mui/joy'
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
import { useState } from 'react'
import { processingState } from '~/api/audioHandlers'
import { db, getState, useLiveQuery } from '~/api/dbHandlers'
import Dropzone, { itemsDropped } from '~/components/Dropzone'
import LeftNav from '~/components/layout/LeftNav'
import { DrawerButton, openDrawerState } from '~/components/layout/TrackDrawer'
import {
  EnhancedTableHead,
  EnhancedTableToolbar,
  searchState,
} from '~/components/tracks/tableHeader'
import TableRows from '~/components/tracks/tableRows'
import TrackLoader from '~/components/tracks/TrackLoader'
import { tableOps } from '~/utils/tableOps'

const pageState = superstate(0)
const rowsPerPageState = superstate(10)
const selectedState = superstate<number[]>([])

const TrackTable = ({ hideDrawerButton }: { hideDrawerButton?: boolean }) => {
  // Re-render when page or selection changes
  useSuperState(pageState)
  useSuperState(rowsPerPageState)
  useSuperState(selectedState)

  // Re-render when search query changes
  useSuperState(searchState)

  // Show loader while processing tracks
  useSuperState(processingState)

  // Close drawer button
  useSuperState(openDrawerState)

  // Allow drag & drop files / folders into the table
  const [dragOver, setDragOver] = useState(false)

  // Monitor db for track updates (and filter using searchquery if present)
  const tracks = useLiveQuery(
    () =>
      db.tracks
        .filter(
          t =>
            t.name
              ?.toLowerCase()
              .includes(`${searchState.now()}`.toLowerCase()) ||
            t.bpm?.toString().includes(`${searchState.now()}`) ||
            tableOps
              .formatMinutes(t.duration! / 60)
              .toString()
              .includes(`${searchState.now()}`)
        )
        .toArray(),
    [searchState.now()],
    null
  )

  // Retrieve sort state from database
  const { sortDirection = 'desc', sortColumn = 'lastModified' } =
    useLiveQuery(() => getState('app')) || {}

  // Avoid a layout jump when reaching the last page with empty rows
  const emptyRows =
    pageState.now() > 0
      ? Math.max(
          0,
          (1 + pageState.now()) * rowsPerPageState.now() - (tracks?.length || 0)
        )
      : 0

  return tracks == null ? null : (
    <Box
      sx={{
        display: 'grid',
        height: '90vh',
        gridTemplateColumns: 'minmax(64px, 200px) minmax(450px, 1fr)',
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
                {[...tracks]
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
          {tracks.length ? null : processingState.now() ? (
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
            rowsPerPage={rowsPerPageState.now()}
            page={pageState.now()}
            onPageChange={tableOps.changePage}
            onRowsPerPageChange={tableOps.changeRows}
          />
        </Sheet>
      </Box>
      {hideDrawerButton ? null : <DrawerButton direction="down" />}
    </Box>
  )
}

export { TrackTable as default, pageState, rowsPerPageState, selectedState }
