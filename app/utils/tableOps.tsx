import { ChangeEvent, MouseEvent } from 'react'
import { db, getState, putState, Track } from '~/api/db'
import { searchState } from '~/components/tracks/tableHeader'
import {
  pageState,
  rowsPerPageState,
  selectedState,
} from '~/routes/__boundary/tracks'
import { errorHandler } from '~/utils/notifications'

export const tableOps = {
  search: (tracks: Track[]) =>
    tracks.filter(t =>
      t.name?.toLowerCase().includes(`${searchState.now()}`.toLowerCase())
    ),

  sort: (event: MouseEvent<unknown>, property: keyof Track) => {
    const sortOrderBy = getState('app')?.sortOrderBy || 'name'
    const sortDirection = getState('app')?.sortDirection || 'desc'

    const isAsc = sortOrderBy === property && sortDirection === 'asc'

    putState('app', { sortDirection: isAsc ? 'desc' : 'asc', sortOrderBy })
  },

  selectAll: async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.checked) return selectedState.set([])
    const tracks = await db.tracks.toArray()

    const newSelected = tracks?.map(n => n.id)
    selectedState.set(newSelected.filter(n => n) as number[])
  },

  rowClick: (event: MouseEvent<unknown>, id: Track['id']) => {
    if (!id) throw errorHandler('There was a problem selecting the row')

    const selectedIndex = selectedState.now().indexOf(id)
    let newSelected: readonly Track['id'][] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedState.now(), id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedState.now().slice(1))
    } else if (selectedIndex === selectedState.now().length - 1) {
      newSelected = newSelected.concat(selectedState.now().slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedState.now().slice(0, selectedIndex),
        selectedState.now().slice(selectedIndex + 1)
      )
    }

    selectedState.set(newSelected.filter(n => n) as number[])
  },

  changePage: (event: unknown, newPage: number) => {
    pageState.set(newPage)
  },

  changeRows: (event: ChangeEvent<HTMLInputElement>) => {
    rowsPerPageState.set(parseInt(event.target.value, 10))
    pageState.set(0)
  },

  isSelected: (id: Track['id']) =>
    typeof id === 'number' && selectedState.now().indexOf(id) !== -1,

  descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1
    }
    if (b[orderBy] > a[orderBy]) {
      return 1
    }
    return 0
  },

  getComparator<Key extends keyof any>(
    order: 'asc' | 'desc',
    orderBy: Key
  ): (
    a: { [key in Key]: number | string },
    b: { [key in Key]: number | string }
  ) => number {
    return order === 'desc'
      ? (a, b) => tableOps.descendingComparator(a, b, orderBy)
      : (a, b) => -tableOps.descendingComparator(a, b, orderBy)
  },
}
