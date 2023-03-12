import moment from 'moment'
import { ChangeEvent, MouseEvent } from 'react'
import { getTableState, setTableState, tableState } from '~/api/appState'
import { db, getPrefs, setPrefs, Track } from '~/api/db/dbHandlers'
import { errorHandler } from '~/utils/notifications'

const sort = async (event: MouseEvent<unknown>, property: keyof Track) => {
  const { sortDirection } = (await getPrefs('user', 'sortDirection')) || {
    sortDirection: 'desc',
  }
  const { sortColumn } = (await getPrefs('user', 'sortColumn')) || {
    sortColumn: 'lastModified',
  }

  const isAsc = sortColumn === property && sortDirection === 'asc'

  setPrefs('user', {
    sortDirection: isAsc ? 'desc' : 'asc',
    sortColumn: property,
  })
}

const selectAll = async (event: ChangeEvent<HTMLInputElement>) => {
  if (!event.target.checked) return setTableState.selected([])
  const tracks = await db.tracks.toArray()

  const newSelected = tracks?.map(n => n.id)
  setTableState.selected(newSelected.filter(n => n) as number[])
}

const rowClick = (event: MouseEvent<unknown>, id: Track['id']) => {
  if (!id) return errorHandler('There was a problem selecting the row')

  const [selected] = getTableState.selected()

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

  setTableState.selected(newSelected.filter(n => n) as number[])
}

const changePage = (event: unknown, newPage: number) => {
  setTableState.page(newPage)
}

const changeRows = (event: ChangeEvent<HTMLInputElement>) => {
  setTableState.rowsPerPage(parseInt(event.target.value, 10))
  setTableState.page(0)
}

const isSelected = (id: Track['id']) => {
  const [selected] = getTableState.selected()
  return typeof id === 'number' && selected.indexOf(id) !== -1
}

const descendingComparator = <T,>(a: T, b: T, orderBy: keyof T) => {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }
  return 0
}

const getComparator = <Key extends keyof any>(
  order: 'asc' | 'desc',
  orderBy: Key
): ((
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string }
) => number) => {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

const formatMinutes = (mins: number) => {
  return moment().startOf('day').add(mins, 'minutes').format('m:ss')
}

// Convert seconds to mm:ss.ms
const timeFormat = (seconds: number): string =>
  new Date(seconds * 1000).toISOString().substring(15, 22)

// Convert time string to ms
const convertToSecs = (time: string): number => {
  const [minutes = 0, seconds = 0, ms = 0] = time.split(/[:.]/)
  return +minutes * 60 + +seconds + +`.${ms}`
}

// Round to two decimal places
const roundTwo = (num: number): number => Math.round(num * 100) / 100

export {
  sort,
  selectAll,
  rowClick,
  changePage,
  changeRows,
  isSelected,
  getComparator,
  formatMinutes,
  timeFormat,
  convertToSecs,
  roundTwo,
}
