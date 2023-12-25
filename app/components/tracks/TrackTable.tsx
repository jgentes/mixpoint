import { Icon } from '@iconify-icon/react'
import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Input,
	Pagination,
	Select,
	SelectItem,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	User
} from '@nextui-org/react'
import moment from 'moment'
import { Key, ReactNode, useCallback, useMemo, useState } from 'react'
import { audioEvents } from '~/api/audioEvents'
import { analyzeTracks } from '~/api/audioHandlers'
import { appState, setAppState, setModalState } from '~/api/db/appState'
import {
	Track,
	db,
	getDirtyTracks,
	getPrefs,
	removeTracks,
	setPrefs,
	useLiveQuery
} from '~/api/db/dbHandlers'
import { browseFile } from '~/api/fileHandlers'
import Dropzone, { itemsDropped } from '~/components/tracks/Dropzone'
import TrackLoader from '~/components/tracks/TrackLoader'
import {
	AddToMixButton,
	analyzeButton,
	createColumnDefinitions
} from '~/components/tracks/tableColumns'
import { formatMinutes, getComparator } from '~/utils/tableOps'

const TrackTable = () => {
	// Re-render when page or selection changes
	const [page] = appState.page()
	const [rowsPerPage] = appState.rowsPerPage()
	const [selected] = appState.selected()
	const [analyzingTracks] = appState.analyzing()
	const selectedCount = selected.size

	// Re-render when search query changes
	const [search] = appState.search()

	// Show loader while processing tracks
	const [processing] = appState.processing()

	// Allow drag & drop files / folders into the table
	const [dragOver, setDragOver] = useState(false)

	// Build table columns
	const columns = useMemo(() => createColumnDefinitions(), [])

	// Retrieve sort state from database
	const {
		sortDirection = 'descending',
		sortColumn = 'lastModified',
		visibleColumns = new Set<string>()
	} = useLiveQuery(() => getPrefs('user')) || {}

	// Monitor db for track updates (and filter using searchquery if present)
	const tracks = useLiveQuery(
		() =>
			db.tracks
				.filter(
					t =>
						t.name?.toLowerCase().includes(`${search}`.toLowerCase()) ||
						t.bpm?.toString().includes(`${search}`) ||
						formatMinutes((t.duration || 60) / 60)
							.toString()
							.includes(`${search}`)
				)
				.toArray(),
		[search],
		[]
	)

	const sortedTracks = useMemo(
		// @ts-ignore this is a tough one
		() => [...tracks].sort(getComparator(sortDirection, sortColumn)),
		[tracks, sortDirection, sortColumn]
	)

	const pageTracks = useMemo(() => {
		const start = (page - 1) * rowsPerPage
		const end = start + rowsPerPage
		return sortedTracks.slice(start, end)
	}, [page, sortedTracks, rowsPerPage])

	const dirtyTracks = useLiveQuery(() => getDirtyTracks(), [], [])

	const pages = Math.ceil(tracks.length / rowsPerPage)

	const headerColumns = useMemo(() => {
		if (!visibleColumns.size) return columns

		return columns.filter(column =>
			Array.from(visibleColumns).includes(column.dbKey)
		)
	}, [visibleColumns, columns])

	const showRemoveTracksModal = () =>
		setModalState({
			openState: true,
			headerText: 'Are you sure?',
			bodyText: 'Removing tracks here will not delete them from your computer.',
			confirmColor: 'danger',
			confirmText: `Remove ${selectedCount} track${
				selectedCount > 1 ? 's' : ''
			}`,
			onConfirm: async () => {
				setModalState.openState(false)
				for (const id of selected) await audioEvents.ejectTrack(Number(id))
				await removeTracks([...selected].map(Number))
				setAppState.selected(new Set())
			},
			onCancel: async () => {
				setModalState.openState(false)
			}
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
			}
		})

	const currentPageTracks = (): Set<Key> => {
		const startIndex = (page - 1) * Number(rowsPerPage)
		const endIndex = startIndex + Number(rowsPerPage)
		const visibleTracks = sortedTracks.slice(startIndex, endIndex)
		return new Set(visibleTracks.map(t => String(t.id)))
	}

	const renderCell = useCallback(
		(track: Track, columnKey: keyof Track): ReactNode => {
			switch (columnKey) {
				case 'name':
					return (
						<div className="flex justify-between items-center">
							{track.name?.replace(/\.[^/.]+$/, '') || 'Track name not found'}
							<div className="min-w-20 ml-2">
								<AddToMixButton track={track} />
							</div>
						</div>
					)
				case 'bpm':
					return (
						track.bpm?.toFixed(0) ||
						(!analyzingTracks.has(track.id) ? (
							analyzeButton(track)
						) : (
							<TrackLoader style={{ margin: 'auto', height: '15px' }} />
						))
					)
				case 'duration':
					return track.duration && formatMinutes(track.duration / 60)
				case 'mixpoints':
					return track.mixpoints?.length || 0
				case 'sets':
					return track.sets?.length || 0
				case 'lastModified':
					return moment(track.lastModified).fromNow()
			}
		},
		[analyzingTracks]
	)

	const tableHeader = (
		<div className="flex flex-col gap-4 mb-2">
			<div className="flex justify-between gap-3 items-end">
				<Input
					isClearable
					classNames={{
						base: 'w-full sm:max-w-[34%]',
						inputWrapper: 'border-1 bg-default-50 rounded h-3'
					}}
					placeholder="Search"
					size="sm"
					startContent={
						<Icon
							icon="material-symbols-light:search-rounded"
							className="text-default-500 text-xl"
						/>
					}
					value={String(search)}
					variant="bordered"
					onClear={() => setAppState.search('')}
					onValueChange={value => {
						if (value) {
							setAppState.search(value)
							setAppState.page(1)
						} else {
							setAppState.search('')
						}
					}}
				/>
				<div className="flex gap-3">
					<Dropdown>
						<DropdownTrigger className="hidden sm:flex bg-default/30">
							<Button
								disableRipple
								endContent={
									<Icon
										icon="material-symbols-light:chevron-right-rounded"
										className="text-lg rotate-90"
									/>
								}
								size="sm"
								variant="flat"
								className="text-default-600"
							>
								Columns
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							disallowEmptySelection
							aria-label="Table columns"
							closeOnSelect={false}
							selectedKeys={visibleColumns.size ? visibleColumns : 'all'}
							selectionMode="multiple"
							onSelectionChange={keys =>
								setPrefs('user', { visibleColumns: new Set(keys) })
							}
						>
							{columns.map(column => (
								<DropdownItem key={column.dbKey}>{column.label}</DropdownItem>
							))}
						</DropdownMenu>
					</Dropdown>
					<Button
						size="sm"
						radius="sm"
						variant="light"
						color="primary"
						disableRipple
						aria-label={selectedCount ? 'Remove Track' : 'Add Tracks'}
						onClick={() =>
							selectedCount ? showRemoveTracksModal() : browseFile()
						}
						className="border-1 border-primary-300 text-primary-700 font-semibold gap-1"
						startContent={
							<Icon
								icon={
									selectedCount ? 'ri:recycle-line' : 'material-symbols:add'
								}
								className="text-lg"
							/>
						}
					>
						{selectedCount ? 'Remove Tracks' : 'Add Tracks'}
					</Button>
				</div>
			</div>
			<div className="flex justify-between items-center">
				<span className="text-default-600 text-small">
					Total {tracks.length} tracks
				</span>
				<Select
					labelPlacement="outside-left"
					label="Rows per page"
					placeholder="10"
					size="sm"
					onChange={e => {
						setAppState.rowsPerPage(Number(e.target.value))
						setAppState.page(1)
					}}
					classNames={{
						base: 'w-min',
						mainWrapper: 'w-16',
						listbox: 'p-0 bg-default/30',
						trigger: 'bg-default/30',
						popoverContent: 'p-0',
						label:
							'text-sm text-default-600 whitespace-nowrap self-center w-3/4'
					}}
				>
					{['10', '25', '50'].map(rows => (
						<SelectItem key={rows} value={rows}>
							{rows}
						</SelectItem>
					))}
				</Select>
			</div>
		</div>
	)

	const tableBody = (
		<Table
			isCompact
			removeWrapper
			aria-label="Track table"
			checkboxesProps={{
				classNames: {
					wrapper: 'rounded'
				}
			}}
			classNames={{
				wrapper: ['max-h-[382px]', 'max-w-3xl'],
				th: ['text-default-600', 'text-sm', 'bg-default/30']
			}}
			selectedKeys={selected}
			selectionMode="multiple"
			sortDescriptor={{ column: sortColumn, direction: sortDirection }}
			onSelectionChange={keys =>
				setAppState.selected(keys === 'all' ? currentPageTracks() : keys)
			}
			onSortChange={({ column, direction }) =>
				setPrefs('user', { sortDirection: direction, sortColumn: column })
			}
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
			<TableHeader columns={headerColumns}>
				{column => (
					<TableColumn
						key={column.dbKey}
						align={column.align}
						width={column.width}
						allowsSorting
					>
						{column.label}
					</TableColumn>
				)}
			</TableHeader>

			<TableBody
				emptyContent={
					tracks.length ? (
						<></>
					) : processing ? (
						<TrackLoader style={{ margin: '50px auto' }} />
					) : (
						<Dropzone />
					)
				}
				items={pageTracks}
			>
				{track => (
					<TableRow key={track.id}>
						{columnKey => (
							<TableCell>
								{renderCell(track, columnKey as keyof Track)}
							</TableCell>
						)}
					</TableRow>
				)}
			</TableBody>
		</Table>
	)

	const tableFooter = !tracks.length ? null : (
		<div className="mt-3 flex justify-between items-center">
			<Pagination
				showControls
				classNames={{
					base: 'pl-0',
					item: 'text-md text-default-600 w-7 h-7',
					prev: 'w-7 h-7',
					next: 'w-7 h-7',
					cursor:
						'bg-transparent border-1 border-primary-300 text-transparent rounded w-7 h-7'
				}}
				isCompact
				page={page}
				total={pages}
				variant="light"
				onChange={pageNum => setAppState.page(pageNum)}
			/>
			<span className="text-small text-default-500">
				{selectedCount === tracks.length
					? 'All tracks selected'
					: `${selectedCount} of ${tracks.length} tracks selected`}
			</span>
		</div>
	)

	return (
		<div className="p-4 m-4 bg-primary-50 border-1 border-divider rounded h-fit">
			{tableHeader}
			{tableBody}
			{tableFooter}
		</div>
	)
}

export { TrackTable as default }
