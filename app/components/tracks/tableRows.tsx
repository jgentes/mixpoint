import { Card, Checkbox } from '@mui/joy'
import {
	Collapse,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { AppState } from '~/api/db/appState'
import { Track } from '~/api/db/dbHandlers'
import { rowClick } from '~/utils/tableOps'
import { createColumnDefinitions } from './tableColumns'

const TableRows = ({
	row,
	isItemSelected
}: {
	row: Track
	isItemSelected: boolean
}) => {
	const [open, setOpen] = useState(false)
	const [showButton, setShowButton] = AppState.showButton()

	// This is being done to refresh the 'Updated' column periodically
	const [, updateState] = useState({})
	useEffect(() => {
		const interval = setInterval(() => updateState({}), 30000)
		return () => clearInterval(interval)
	}, [])

	// Build table columns (once)
	const columnDefs = useMemo(() => createColumnDefinitions(), [])

	return (
		<>
			<TableRow
				hover
				selected={isItemSelected}
				onMouseEnter={() => row.id && setShowButton(row.id)}
				onMouseLeave={() => setShowButton(null)}
			>
				<TableCell
					padding="none"
					onClick={(event) => rowClick(event, row.id)}
					role="checkbox"
					aria-checked={isItemSelected}
					tabIndex={-1}
					sx={{ cursor: 'pointer', padding: '7px 12px 0 16px' }}
				>
					<Checkbox color="primary" checked={isItemSelected} title={row.name} />
				</TableCell>
				{columnDefs.map((column) => (
					<TableCell
						key={column.dbKey}
						id={`${column.dbKey}-${row.id}`}
						sx={{
							cursor: 'default',
							alignItems: 'center',
							...column.sx
						}}
						align={column.align}
						padding={column.padding}
						width={column.width}
					>
						{column.formatter(row)}
					</TableCell>
				))}
			</TableRow>
			{/* <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton> */}
			<TableRow hover selected={isItemSelected}>
				<TableCell sx={{ pb: 0, pt: 0, border: 0 }} colSpan={6}>
					<Collapse in={open} timeout="auto" unmountOnExit>
						<Card sx={{ margin: 1 }}>
							<Table size="small" aria-label="mixes">
								<TableHead>
									<TableRow>
										<TableCell>Mixes</TableCell>
										<TableCell>From Track</TableCell>
										<TableCell align="right">To Track</TableCell>
										<TableCell align="right">Duration</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{/* {row.history?.map(historyRow => (
                    <TableRow key={historyRow.date}>
                      <TableCell component="th" scope="row">
                        {historyRow.date}
                      </TableCell>
                      <TableCell>{historyRow.customerId}</TableCell>
                      <TableCell align="right">{historyRow.amount}</TableCell>
                      <TableCell align="right">23532</TableCell>
                    </TableRow>
                  ))} */}
								</TableBody>
							</Table>
						</Card>
					</Collapse>
				</TableCell>
			</TableRow>
		</>
	)
}

export { TableRows as default }
