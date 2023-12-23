import { Icon } from '@iconify-icon/react'
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Input,
	Button,
	DropdownTrigger,
	Dropdown,
	DropdownMenu,
	DropdownItem,
	Chip,
	User,
	Pagination
} from '@nextui-org/react'
import {
	Card,
	Checkbox,
	FormControl,
	IconButton,
	Link,
	Typography
} from '@mui/joy'
import { TableHead, TableSortLabel, Toolbar } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { visuallyHidden } from '@mui/utils'
import { ChangeEvent, MouseEvent, useMemo } from 'react'
import { audioEvents } from '~/api/audioEvents'
import { analyzeTracks } from '~/api/audioHandlers'
import { appState, setModalState } from '~/api/db/appState'
import {
	Track,
	UserPrefs,
	db,
	getDirtyTracks,
	removeTracks,
	useLiveQuery
} from '~/api/db/dbHandlers'
import { browseFile } from '~/api/fileHandlers'
import { createColumnDefinitions } from '~/components/tracks/tableColumns'

// Toolbar is on top of the table, includes search, info, and button bar
const EnhancedTableToolbar = (props: { numSelected: number }) => {
	const [search, setSearch] = appState.search()
	const [selected, setSelected] = appState.selected()

	const { numSelected } = props

	const trackCount = useLiveQuery(() => db.tracks.count())
	const dirtyTracks = useLiveQuery(() => getDirtyTracks(), [], [])

	const showRemoveTracksModal = () =>
		setModalState({
			openState: true,
			headerText: 'Are you sure?',
			bodyText: 'Removing tracks here will not delete them from your computer.',
			confirmColor: 'danger',
			confirmText: `Remove ${numSelected} track${numSelected > 1 ? 's' : ''}`,
			onConfirm: async () => {
				setModalState.openState(false)
				for (const id of selected) await audioEvents.ejectTrack(id)
				await removeTracks([...selected])
				setSelected(new Set())
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
					backgroundColor: theme =>
						alpha(
							theme.palette.primary.main,
							theme.palette.action.activatedOpacity
						)
				})
			}}
		>
			{numSelected > 0 ? (
				<div>{numSelected} selected</div>
			) : (
				<Typography id="tableTitle" component="div" sx={{ flexBasis: '200px' }}>
					{trackCount} Track{trackCount === 1 ? '' : 's'}
					{!dirtyTracks.length ? null : (
						<Link
							onClick={() => showAnalyzeDirtyModal()}
							variant="plain"
							level="body-md"
							underline="none"
							sx={{ p: '2px 6px', ml: 1 }}
						>
							{dirtyTracks.length} to analyze
						</Link>
					)}
				</Typography>
			)}
			<FormControl
				sx={{
					display: 'flex',
					flexDirection: 'row'
				}}
			>
				<Input
					variant="soft"
					placeholder="Search..."
					startDecorator={<Icon icon="material-symbols:search" height="20px" />}
					onChange={e => setSearch(e.target.value)}
					value={search}
					endDecorator={
						!search ? null : (
							<IconButton
								variant="outlined"
								size="sm"
								color="neutral"
								onClick={() => setSearch('')}
							>
								<Icon icon="material-symbols:clear" height="20px" />
							</IconButton>
						)
					}
					size="sm"
					sx={{
						border: '1px solid',
						borderColor: 'action.focus',
						fontWeight: 'thin',
						flexBasis: '500px',
						mx: 2,
						display: {
							xs: 'none',
							sm: 'flex'
						}
					}}
				/>
			</FormControl>
			{numSelected === 0 ? (
				<Button
					size="sm"
					radius="sm"
					variant="light"
					onClick={() => browseFile()}
					className="whitespace-nowrap"
				>
					<Icon icon="material-symbols:add" height="20px" />
					Add Track
				</Button>
			) : (
				<Button
					variant="light"
					title="Remove tracks"
					size="sm"
					radius="sm"
					onClick={() => showRemoveTracksModal()}
				>
					<Icon icon="ri:recycle-line" height="20px" />
				</Button>
			)}
		</Toolbar>
	)
}

// Table header includes column headers, select all, and sort buttons
const EnhancedTableHead = (props: {
	numSelected: number
	onRequestSort: (event: MouseEvent<unknown>, property: keyof Track) => void
	onSelectAllClick: (event: ChangeEvent<HTMLInputElement>) => void
	sortDirection: UserPrefs['sortDirection']
	sortColumn: UserPrefs['sortColumn']
	rowCount: number
}) => {
	const {
		onSelectAllClick,
		sortDirection,
		sortColumn,
		numSelected,
		rowCount,
		onRequestSort
	} = props

	// Build table columns (once)
	const columnDefs = useMemo(() => createColumnDefinitions(), [])

	const createSort =
		(property: keyof Track) => (event: MouseEvent<unknown>) => {
			onRequestSort(event, property)
		}

	return (
		<TableHead>
			<TableRow>
				<TableCell padding="none" sx={{ padding: '7px 12px 0 16px' }}>
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
						key={column.dbKey}
						align={column.align}
						padding={column.padding}
						width={column.width}
						sx={{
							...column.sx,
							padding: column.align === 'center' ? '6px 0 0 28px' : ''
						}}
						sortDirection={sortColumn === column.dbKey ? sortDirection : false}
					>
						<TableSortLabel
							active={sortColumn === column.dbKey}
							direction={
								sortColumn === column.dbKey ? sortDirection : 'ascending'
							}
							onClick={createSort(column.dbKey)}
						>
							{column.label}
							{sortColumn === column.dbKey ? (
								<Card component="span" sx={visuallyHidden}>
									{sortDirection === 'descending'
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

export { EnhancedTableHead, EnhancedTableToolbar }
