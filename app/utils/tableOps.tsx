import moment from 'moment'
import React, { ChangeEvent, MouseEvent } from 'react'
import { getAppState, setAppState } from '~/api/appState'
import { Track, db, getPrefs, setPrefs } from '~/api/db/dbHandlers'
import { errorHandler } from '~/utils/notifications'

const sort = async (event: MouseEvent<unknown>, property: keyof Track) => {
	const { sortDirection } = (await getPrefs('user', 'sortDirection')) || {
		sortDirection: 'desc'
	}
	const { sortColumn } = (await getPrefs('user', 'sortColumn')) || {
		sortColumn: 'lastModified'
	}

	const isAsc = sortColumn === property && sortDirection === 'asc'

	setPrefs('user', {
		sortDirection: isAsc ? 'desc' : 'asc',
		sortColumn: property
	})
}

const selectAll = async (event: ChangeEvent<HTMLInputElement>) => {
	if (!event.target.checked) return setAppState.selected([])
	const tracks = await db.tracks.toArray()

	const newSelected = tracks?.map((n) => n.id)
	setAppState.selected(newSelected.filter((n) => n) as number[])
}

const rowClick = (
	event: React.MouseEvent | React.KeyboardEvent,
	id: Track['id']
) => {
	if (!id) return errorHandler('There was a problem selecting the row')

	const [selected] = getAppState.selected()

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

	setAppState.selected(newSelected.filter((n) => n) as number[])
}

const changePage = (event: unknown, newPage: number) => {
	setAppState.page(newPage)
}

const changeRows = (event: ChangeEvent<HTMLInputElement>) => {
	setAppState.rowsPerPage(parseInt(event.target.value, 10))
	setAppState.page(0)
}

const isSelected = (id: Track['id']) => {
	const [selected] = getAppState.selected()
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

// rome-ignore lint/suspicious/noExplicitAny: this is a generic function
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
const timeFormat = (seconds: number): string => {
	const mm = String(Math.floor(seconds / 60)).padStart(1, '0')
	const ss = String(Math.floor(seconds % 60)).padStart(2, '0')
	const ms = String(Math.floor((seconds - Math.floor(seconds)) * 10)).padStart(
		1,
		'0'
	)

	return `${mm}:${ss}.${ms}`
}

// Convert time string to ms
const convertToSecs = (time: string): number => {
	const [minutes = 0, seconds = 0, ms = 0] = time.split(/[:.]/)
	return +minutes * 60 + +seconds + +`.${ms}`
}

// Round to two decimal places
const roundTwo = (num: number): number => Math.round(num * 100) / 100

export {
	changePage,
	changeRows,
	convertToSecs,
	formatMinutes,
	getComparator,
	isSelected,
	roundTwo,
	rowClick,
	selectAll,
	sort,
	timeFormat
}
