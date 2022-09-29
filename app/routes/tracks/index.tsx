import {
  useEffect,
  useState,
  MouseEvent,
  ChangeEvent,
  ReactNode,
  ChangeEventHandler,
} from 'react'
import { getComparator } from '~/utils/tableTools'
import { db, Track, putTrack, removeTrack, useLiveQuery } from '~/api/db'
import { initTrack, processAudio } from '~/api/audio'
import { alpha, SxProps } from '@mui/material/styles'
import {
  Box,
  Card,
  Sheet,
  Button,
  TextField,
  styled,
  Checkbox,
  Typography,
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
  IconButton,
  Tooltip,
  TableCellProps,
} from '@mui/material'
import moment from 'moment'
import Loader from '~/styles/loader'
import {
  Close,
  Add,
  Height,
  Search,
  CloudUpload,
  PriorityHigh,
  Delete,
  FilterList,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material'
import { visuallyHidden } from '@mui/utils'

export default function TrackTable({
  hideDropzone,
  trackKey,
  openTable,
  getPeaks,
}: {
  hideDropzone?: boolean
  trackKey?: number
  openTable: Function
  getPeaks: Function
}) {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [orderBy, setOrderBy] = useState<keyof Track>('bpm')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [selected, setSelected] = useState<readonly number[]>([])

  const [isOver, setIsOver] = useState(false) // for dropzone
  const [processing, setProcessing] = useState(false) // show progress if no table
  const [analyzingTracks, setAnalyzing] = useState<Track[]>([])
  const [dirtyTracks, setDirty] = useState<Track[]>([])
  const [searchVal, setSearch] = useState('')

  // monitor db for track updates
  let tracks: Track[] | null = useLiveQuery(() => db.tracks.toArray()) ?? null
  let trackSort = useLiveQuery(() => db.appState.get('trackSort')) || 'name'

  // if we see any tracks that haven't been processed, process them, or
  // if we haven't had user activation, show button to resume processing
  // https://html.spec.whatwg.org/multipage/interaction.html#tracking-user-activation
  useEffect(() => setDirty(tracks?.filter(t => !t.bpm) || []), [tracks])

  // queue files for processing after they are added to the DB
  // this provides a more responsive UI experience
  const processTracks = async (
    handles: (FileSystemFileHandle | FileSystemDirectoryHandle)[]
  ) => {
    let trackArray = []

    // show indicator if no tracks exist
    setProcessing(true)

    for await (const fileOrDirectoryHandle of handles) {
      if (!fileOrDirectoryHandle) continue

      if (fileOrDirectoryHandle?.kind === 'directory') {
        const directoryHandle = fileOrDirectoryHandle
        for await (const entry of directoryHandle.values()) {
          if (entry.kind === 'file') {
            trackArray.push(await initTrack(entry, directoryHandle))
          }
        }
      } else {
        trackArray.push(await initTrack(fileOrDirectoryHandle))
      }
    }

    const idTracks = []
    for (const track of trackArray) idTracks.push(await putTrack(track))
    setProcessing(false)
    setAnalyzing(idTracks)

    for (const track of idTracks) await processAudio(track)
  }

  // careful wtih DataTransferItemList: https://stackoverflow.com/questions/55658851/javascript-datatransfer-items-not-persisting-through-async-calls
  const filesDropped = async (files: DataTransferItemList) => {
    const handleArray = []

    for (const file of files) {
      if (file.kind === 'file') {
        const handle = await file.getAsFileSystemHandle()
        if (handle) handleArray.push(handle)
      }
    }

    setIsOver(false)
    processTracks(handleArray)
  }

  const browseFile = async () => {
    const files = await window
      .showOpenFilePicker({ multiple: true })
      .catch(e => {
        if (e?.message?.includes('user aborted a request')) return []
        throw e
      })

    processTracks(files)
  }

  const analyzeTrack = async (track: Track) => {
    const ok = await getPermission(track)
    if (ok) {
      // if the user approves access to a folder, we can process all files in that folder :)
      const siblingTracks = track.dirHandle
        ? dirtyTracks.filter(t => t.dirHandle?.name == track.dirHandle!.name)
        : [track]

      setAnalyzing(siblingTracks)
      for (const sibling of siblingTracks) {
        await processAudio(sibling)
        setAnalyzing(siblingTracks.filter(s => s.id !== sibling.id))
      }
    }
  }

  const addTrackToMix = (track: Track, trackKey: number) => {
    getPeaks(track, trackKey)
    openTable(false)
  }

  const createColumnDefinitions = (): {
    key: keyof Track
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
        key: 'name',
        label: 'Track Name',
        align: 'left',
        padding: 'none',
        sx: { minWidth: '300px', width: '50%' },
        // remove suffix (ie. .mp3)
        formatter: t =>
          t.name?.replace(/\.[^/.]+$/, '') || 'Track name not found',
      },
      {
        key: 'bpm',
        label: 'BPM',
        align: 'right',
        padding: 'normal',
        sx: { width: '80px' },
        formatter: t =>
          t.bpm?.toFixed(0) ||
          (dirtyTracks.some(dt => dt.id == t.id) &&
          !analyzingTracks.some(a => a.id == t.id) ? (
            getBpmButton(t)
          ) : (
            <Loader style={{ margin: 0, height: '20px' }} />
          )),
      },
      {
        key: 'duration',
        align: 'right',
        padding: 'normal',
        label: 'Duration',
        sx: { width: '105px' },
        formatter: t => (t.duration ? formatMinutes(t.duration! / 60) : null),
      },
      {
        key: 'mixpoints',
        align: 'right',
        padding: 'normal',
        label: 'Mixes',
        sx: { width: '85px' },
        formatter: t => '',
      },
      {
        key: 'sets',
        align: 'right',
        padding: 'normal',
        label: 'Sets',
        sx: { width: '85px' },
        formatter: t => '',
      },
      {
        key: 'lastModified',
        align: 'right',
        padding: 'normal',
        label: 'Updated',
        formatter: t => moment(t.lastModified).fromNow(),
      },
    ]
  }

  const columnDefs = createColumnDefinitions()

  const EnhancedTableHead = (props: {
    numSelected: number
    onRequestSort: (event: MouseEvent<unknown>, property: string) => void
    onSelectAllClick: (event: ChangeEvent<HTMLInputElement>) => void
    order: 'asc' | 'desc'
    orderBy: string
    rowCount: number
  }) => {
    const {
      onSelectAllClick,
      order,
      orderBy,
      numSelected,
      rowCount,
      onRequestSort,
    } = props

    const createSortHandler =
      (property: string) => (event: MouseEvent<unknown>) => {
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
          {columnDefs.map(column => (
            <TableCell
              {...column}
              sortDirection={orderBy === column.key ? order : false}
            >
              <TableSortLabel
                active={orderBy === column.key}
                direction={orderBy === column.key ? order : 'asc'}
                onClick={createSortHandler(column.key)}
              >
                {column.label}
                {orderBy === column.key ? (
                  <Card component="span" sx={visuallyHidden}>
                    {order === 'desc'
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
          pr: { xs: 1, sm: 1 },
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
          <Typography sx={{ flex: '1 1 100%' }} component="div">
            {numSelected} selected
          </Typography>
        ) : (
          <Typography sx={{ flex: '1 1 100%' }} id="tableTitle" component="div">
            Tracks
          </Typography>
        )}
        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton>
              <Delete />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Filter list">
            <IconButton>
              <FilterList />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
    )
  }

  // const tableHeaders = columnDefs.map(c => (
  //   <th
  //     key={c.key}
  //     style={{
  //       textAlign: c.key == 'actions' ? 'center' : 'left',
  //       minWidth: c.minWidth || c.width,
  //       width: c.width,
  //     }}
  //   >
  //     {c.name}
  //     {c.key == 'actions' ? null : (
  //       <IconButton
  //         id={`${c.key}-sort`}
  //         size="small"
  //         color="primary"
  //         onClick={e => {
  //           const rev = /reverse/.test(trackSort)
  //           const key = trackSort.split('-')[0]
  //           const sortKey =
  //             trackSort.split('-')[0] == c.key
  //               ? rev
  //                 ? key
  //                 : `${key}-reverse`
  //               : c.key

  //           db.appState.put(sortKey, 'trackSort')
  //           e.stopPropagation()
  //         }}
  //       >
  //         <Height titleAccess="Sort" fontSize="small" />
  //       </IconButton>
  //     )}
  //   </th>
  // ))

  const sortColumns = (sortKey: string) => {
    const rev = /reverse/.test(sortKey)
    const key = sortKey.split('-')[0]

    // ugly function that handles various sorts for strings vs numbers
    const sortFunc = (a, b) => {
      return key == 'name'
        ? rev
          ? b[key].localeCompare(a[key])
          : a[key].localeCompare(b[key])
        : rev
        ? b[key] - a[key]
        : a[key] - b[key]
    }

    tracks?.sort(sortFunc)
  }

  //sortColumns(trackSort)
  if (searchVal && tracks)
    tracks = tracks.filter(t =>
      t.name?.toLowerCase().includes(searchVal.toLowerCase())
    )

  const tableOps = {
    sort: (event: MouseEvent<unknown>, property: keyof Track) => {
      const isAsc = orderBy === property && order === 'asc'
      setOrder(isAsc ? 'desc' : 'asc')
      setOrderBy(property)
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
    row: Track
    isItemSelected: boolean
    labelId: string
  }> = ({ row, isItemSelected, labelId }) => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <TableRow
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
              title={labelId}
            />
          </TableCell>
          {/* <TableCell
            component="th"
            id={labelId}
            scope="row"
            padding="none"
            sx={{ cursor: 'default' }}
          >
            {row.name}
          </TableCell> */}
          <TableCell align="right">{row.bpm}</TableCell>
          <TableCell align="right">{row.duration}</TableCell>
          <TableCell align="right">
            {row.mixes}
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
          <TableCell align="right">{row.sets}</TableCell>
          <TableCell align="right">{row.lastModified}</TableCell>
        </TableRow>
        <TableRow
          hover
          selected={isItemSelected}
          onClick={() => setOpen(!open)}
        >
          <TableCell sx={{ pb: 0, pt: 0, border: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Card sx={{ margin: 1 }}>
                <Table size="small" aria-label="purchases">
                  {/* <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Total price ($)</TableCell>
                    </TableRow>
                  </TableHead> */}
                  <TableBody>
                    {row.history?.map(historyRow => (
                      <TableRow key={historyRow.date}>
                        {/* <TableCell component="th" scope="row">
                          {historyRow.date}
                        </TableCell> */}
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

  const DropzoneDiv = styled('div')`
    border: 2px dashed #777;
    padding: 20px;
    text-align: center;
    cursor: pointer;

    &:hover,
    &--active {
      border-color: #30b2e9;
      background-color: rgba(#30b2e9, 0.1);
    }
  `

  return (
    <></>
    // <Box sx={{ width: '100%' }}>
    //   <Sheet
    //     variant="outlined"
    //     sx={{
    //       width: '100%',
    //       mb: 2,
    //       borderRadius: 'sm',
    //       bgcolor: 'background.body',
    //       overflow: 'auto',
    //     }}
    //   >
    //     <EnhancedTableToolbar numSelected={selected.length} />
    //     <TableContainer>
    //       <Table aria-labelledby="tableTitle" size="small" padding="checkbox">
    //         <EnhancedTableHead
    //           numSelected={selected.length}
    //           order={order}
    //           orderBy={orderBy}
    //           onSelectAllClick={tableOps.selectAll}
    //           onRequestSort={tableOps.sort}
    //           rowCount={tracks?.length || 0}
    //         />
    //         <TableBody>
    //           <>
    //             {tracks &&
    //               [...tracks]
    //                 // @ts-ignore: TS complains about the type of orderBy due to history being an array
    //                 .sort(getComparator(order, orderBy))
    //                 .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    //                 .map((row, index) => {
    //                   const isItemSelected = tableOps.isSelected(row.id)
    //                   const labelId = `enhanced-table-checkbox-${index}`

    //                   return (
    //                     <RowState
    //                       key={index}
    //                       row={row}
    //                       isItemSelected={isItemSelected}
    //                       labelId={labelId}
    //                     />
    //                   )
    //                 })}
    //             {emptyRows > 0 && (
    //               <TableRow
    //                 style={{
    //                   height: 33 * emptyRows,
    //                 }}
    //               >
    //                 <TableCell colSpan={6} />
    //               </TableRow>
    //             )}
    //           </>
    //         </TableBody>
    //       </Table>
    //     </TableContainer>
    //     <TablePagination
    //       rowsPerPageOptions={[5, 10, 25]}
    //       component="div"
    //       count={tracks?.length || 0}
    //       rowsPerPage={rowsPerPage}
    //       page={page}
    //       onPageChange={tableOps.changePage}
    //       onRowsPerPageChange={tableOps.changeRows}
    //     />
    //   </Sheet>
    //   <>
    //     {/* DropZone */}
    //     {hideDropzone ? null : (
    //       <Sheet style={{ margin: '10px 0' }} variant="soft">
    //         <DropzoneDiv
    //           onClick={browseFile}
    //           onDrop={e => {
    //             e.preventDefault()
    //             filesDropped(e.dataTransfer.items)
    //           }}
    //           onDragOver={e => e.preventDefault()}
    //           onDragEnter={() => setIsOver(true)}
    //           onDragLeave={() => setIsOver(false)}
    //         >
    //           <CloudUpload
    //             sx={{ fontSize: 48 }}
    //             className="drop"
    //             style={{ marginBottom: '10px' }}
    //           />
    //           <Typography level="h4" className="drop">
    //             Add Tracks
    //           </Typography>
    //           <div className="drop">
    //             Drag a file or <strong>folder</strong> here or{' '}
    //             <span className="text-primary">browse</span> for a file to add.
    //             Folders are preferred.
    //           </div>
    //         </DropzoneDiv>
    //       </Sheet>
    //     )}
    //     {!tracks || processing ? (
    //       <Loader style={{ margin: '50px auto' }} />
    //     ) : (
    //       <>
    //         {/* Table search and info bar */}
    //         <Sheet
    //           sx={{
    //             display: 'flex',
    //             justifyContent: 'space-between',
    //             padding: '10px',
    //           }}
    //         >
    //           <TextField
    //             onChange={e => setSearch(e.target.value)}
    //             placeholder="Search"
    //             value={searchVal}
    //           >
    //             <Search />
    //           </TextField>
    //           {!dirtyTracks.length ? null : (
    //             <div style={{ alignSelf: 'center' }}>
    //               <PriorityHigh style={{ marginRight: '5px' }} />
    //               {`BPM needed for ${dirtyTracks.length} Track${
    //                 tracks?.length === 1 ? '' : 's'
    //               }`}
    //             </div>
    //           )}
    //           <div style={{ alignSelf: 'center' }}>
    //             <Button size="sm" onClick={browseFile}>
    //               <Add />
    //               Add Track
    //             </Button>
    //           </div>
    //         </Sheet>
    //         {!tracks?.length ? null : (
    //           <div id="trackTable">
    //             {/* Track Table */}
    //             <Table style={{ width: '100%', tableLayout: 'fixed' }}>
    //               <thead>{/* <tr>{tableHeaders}</tr> */}</thead>
    //               <tbody>
    //                 {tracks.map((t, i) => (
    //                   <tr key={i}>
    //                     {columnDefs.map(c => (
    //                       <td key={c.key}>{c.formatter(t)}</td>
    //                     ))}
    //                   </tr>
    //                 ))}
    //               </tbody>
    //             </Table>
    //           </div>
    //         )}
    //       </>
    //     )}
    //   </>
    // </Box>
  )
}
