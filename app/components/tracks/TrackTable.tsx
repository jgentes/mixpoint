import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Input,
	Link,
	Pagination,
	Select,
	SelectItem,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableColumnProps,
	TableHeader,
	TableRow
} from '@nextui-org/react'
import moment from 'moment'
import { Key, ReactNode, useCallback, useMemo, useState } from 'react'
import { audioEvents } from '~/api/audioEvents'
import { analyzeTracks } from '~/api/audioHandlers'
import { appState, setAppState, setModalState } from '~/api/db/appState'
import {
	Track,
	addToMix,
	db,
	getDirtyTracks,
	getPrefs,
	removeTracks,
	setPrefs,
	useLiveQuery
} from '~/api/db/dbHandlers'
import { browseFile } from '~/api/fileHandlers'
import { ProgressBar } from '~/components/Loader'
import {
	AddIcon,
	AnalyzeIcon,
	CheckIcon,
	ChevronIcon,
	SearchIcon
} from '~/components/icons'
import Dropzone, { itemsDropped } from '~/components/tracks/Dropzone'
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

	// Retrieve sort state from database
	const {
		sortDirection = 'descending',
		sortColumn = 'lastModified',
		visibleColumns = new Set<string>()
	} = useLiveQuery(() => getPrefs('user')) || {}

	// Monitor db for track updates (and filter using searchquery if present)
	const trackCount = useLiveQuery(() => db.tracks.count())
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
		null
	)

	const sortedTracks = useMemo(
		// @ts-ignore this is a tough one
		() => [...(tracks || [])].sort(getComparator(sortDirection, sortColumn)),
		[tracks, sortDirection, sortColumn]
	)

	const pageTracks = useMemo(() => {
		const start = (page - 1) * rowsPerPage
		const end = start + rowsPerPage
		return sortedTracks.slice(start, end)
	}, [page, sortedTracks, rowsPerPage])

	const dirtyTracks = useLiveQuery(() => getDirtyTracks(), [], [])

	const pages = Math.ceil((tracks?.length || 1) / rowsPerPage)

	const analyzeButton = (t: Track) => (
		<Button
			variant="ghost"
			color="secondary"
			className="border-1 rounded h-6 px-2 gap-1 border-secondary-300 text-secondary-700"
			startContent={<AnalyzeIcon className="text-lg" />}
			size="sm"
			onClick={() => analyzeTracks([t])}
		>
			Analyze
		</Button>
	)

	const addToMixHandler = async (t: Track) => {
		const { tracks = [] } = await getPrefs('mix')

		await addToMix(t)

		// if this is the first track in the mix, leave the drawer open
		if (!tracks.length) setAppState.openDrawer(true)
	}

	const AddToMixButton = useCallback(
		({ track }: { track: Track }) => {
			const { tracks = [] } = useLiveQuery(() => getPrefs('mix')) || {}

			const isInMix = tracks.includes(track.id)

			// Prevent user from adding a new track before previous added track finishes analyzing
			const isBeingAnalyzed = tracks.some(id => analyzingTracks.has(id))

			return (
				<Button
					size="sm"
					radius="sm"
					variant="ghost"
					color="primary"
					isDisabled={isBeingAnalyzed}
					className={`border-1 rounded h-6 px-2 gap-1 ${
						isInMix
							? 'border-success-300 text-success-700'
							: 'border-primary-300 text-primary-700'
					}`}
					startContent={
						isInMix ? (
							<CheckIcon className="text-lg" />
						) : (
							<AddIcon className="text-lg" />
						)
					}
					onClick={() => {
						!isInMix ? addToMixHandler(track) : audioEvents.ejectTrack(track.id)
					}}
				>
					{`Add${isInMix ? 'ed' : ' to Mix'}`}
				</Button>
			)
		},
		[analyzingTracks, addToMixHandler]
	)

	const BpmFormatter = useCallback(
		(track: Track) => {
			return track.bpm ? (
				<div className="pl-1">{track.bpm.toFixed(0)}</div>
			) : analyzingTracks.size > 1 || analyzingTracks.has(track.id) ? (
				<div className="relative w-1/2 top-1/2 -mt-0.5 ml-1">
					<ProgressBar />
				</div>
			) : (
				analyzeButton(track)
			)
		},
		[analyzingTracks, analyzeButton]
	)

	// Build table columns
	const columns = useMemo(
		(): {
			dbKey: string
			label: string
			align: TableColumnProps<string>['align']
			width: TableColumnProps<string>['width']
			formatter: (t: Track) => ReactNode
		}[] => [
			{
				dbKey: 'name',
				label: 'Track name',
				align: 'start',
				width: '45%',
				formatter: track =>
					track.name?.replace(/\.[^/.]+$/, '') || 'Track name not found'
			},
			{
				dbKey: 'action',
				label: '',
				align: 'center',
				width: '15%',
				formatter: track => <AddToMixButton track={track} />
			},
			{
				dbKey: 'bpm',
				label: 'BPM',
				align: 'center',
				width: '10%',
				formatter: BpmFormatter
			},
			{
				dbKey: 'duration',
				label: 'Duration',
				align: 'center',
				width: '10%',
				formatter: track => (
					<div className="pl-3">
						{track.duration && formatMinutes(track.duration / 60)}
					</div>
				)
			},
			{
				dbKey: 'mixpoints',
				label: 'Mixes',
				align: 'center',
				width: '5%',
				formatter: track => (
					<div className="pl-3">{track.mixpoints?.length || 0}</div>
				)
			},
			{
				dbKey: 'sets',
				label: 'Sets',
				align: 'center',
				width: '5%',
				formatter: track => (
					<div className="pl-2">{track.sets?.length || 0}</div>
				)
			},
			{
				dbKey: 'lastModified',
				label: 'Updated',
				align: 'end',
				width: '10%',
				formatter: track => (
					<div className="whitespace-nowrap">
						{moment(track.lastModified).fromNow()}
					</div>
				)
			}
		],
		[BpmFormatter, AddToMixButton]
	)

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
			confirmColor: 'warning',
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

	const tableHeader = (
		<div className="flex flex-col gap-4 mb-2">
			<div className="flex justify-between gap-3 items-end">
				<div className="flex flex-start gap-3">
					<Input
						isClearable
						classNames={{
							base: 'w-full',
							inputWrapper: 'border-1 bg-default-50 rounded h-3'
						}}
						placeholder="Search"
						size="sm"
						startContent={<SearchIcon className="text-default-500 text-xl" />}
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
					<Dropdown>
						<DropdownTrigger className="bg-default/30">
							<Button
								endContent={
									<ChevronIcon className="text-xl rotate-90 text-foreground min-w-unit-5" />
								}
								size="sm"
								radius="sm"
								disableRipple
								aria-label="Column selector"
								className="text-default-600 pl-6 pr-5 rounded"
							>
								Columns
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							disallowEmptySelection
							aria-label="Table columns"
							closeOnSelect={false}
							selectedKeys={visibleColumns.size > 2 ? visibleColumns : 'all'}
							selectionMode="multiple"
							onSelectionChange={keys =>
								setPrefs('user', {
									visibleColumns: new Set(['name', 'action', ...keys])
								})
							}
						>
							{columns
								.filter(
									column => column.dbKey !== 'name' && column.dbKey !== 'action'
								)
								.map(column => (
									<DropdownItem key={column.dbKey}>{column.label}</DropdownItem>
								))}
						</DropdownMenu>
					</Dropdown>
				</div>
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
					className="border-1 border-primary-300 rounded text-primary-700 font-semibold gap-1"
					startContent={
						<AddIcon
							className={`text-lg ${selectedCount ? 'rotate-45' : ''}`}
						/>
					}
				>
					{selectedCount ? 'Remove Tracks' : 'Add Tracks'}
				</Button>
			</div>
			<div className="flex justify-between items-center">
				<span className="text-default-600 text-small">
					Total {tracks?.length} tracks
					{!dirtyTracks.length ? null : (
						<Link
							onClick={() => showAnalyzeDirtyModal()}
							color="secondary"
							className="ml-1 text-sm cursor-pointer"
						>
							(
							{analyzingTracks.size
								? `${dirtyTracks.length} to analyze`
								: `click to analyze ${dirtyTracks.length} track${
										dirtyTracks.length > 1 ? 's' : ''
								  }`}
							)
						</Link>
					)}
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
						trigger: 'bg-default/30 rounded',
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
			color="default"
			checkboxesProps={{
				classNames: {
					wrapper: 'rounded'
				}
			}}
			classNames={{
				wrapper: ['max-h-[382px]', 'max-w-3xl'],
				thead: 'rounded',
				th: [
					'text-default-600',
					'text-sm',
					'rounded',
					dragOver ? 'bg-primary-500 bg-opacity-10' : 'bg-default/30'
				],
				tr: ['rounded border-b-1 border-divider'],
				tbody: dragOver ? 'bg-primary-500 bg-opacity-10' : ''
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
						allowsSorting={column.dbKey !== 'actions'}
					>
						{column.label}
					</TableColumn>
				)}
			</TableHeader>

			<TableBody
				emptyContent={
					// this accounts for clearing the search box, where we have zero tracks and need to reload table without showing dropzone
					!tracks || processing || (!tracks.length && trackCount && !search) ? (
						<div className="relative w-1/2 top-1/2 -mt-0.5 m-auto">
							<ProgressBar />
						</div>
					) : search ? (
						'No tracks found'
					) : (
						<Dropzone className="h-full mt-3" />
					)
				}
			>
				{pageTracks.map(track => (
					<TableRow key={track.id}>
						{headerColumns.map(column => (
							<TableCell key={column?.dbKey}>
								{column?.formatter(track)}
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	)

	const tableFooter = !tracks?.length ? null : (
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
		<div className="p-4 bg-primary-50 border-1 border-divider rounded h-fit">
			{tableHeader}
			{tableBody}
			{tableFooter}
		</div>
	)
}

export { TrackTable as default }
