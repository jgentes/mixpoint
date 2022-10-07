import { Card, Checkbox } from '@mui/joy'
import {
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'
import { useSuperState } from '@superstate/react'
import { useEffect, useMemo, useState } from 'react'
import { analyzingState } from '~/api/audio'
import { Track } from '~/api/db'
import { tableOps } from '~/utils/tableOps'
import { createColumnDefinitions } from './tableColumns'

export default function TableRows({
  key,
  row,
  isItemSelected,
}: {
  key: number
  row: Track
  isItemSelected: boolean
}) {
  const [open, setOpen] = useState(false)
  useSuperState(analyzingState)

  // A bit of a hack since fn components don't have this.forceUpdate
  // This is being done to refresh the 'Updated' column every minute
  const [, updateState] = useState({})
  useEffect(() => {
    const interval = setInterval(() => updateState({}), 60000)
    return () => clearInterval(interval)
  }, [])

  // Build table columns (once)
  const columnDefs = useMemo(() => createColumnDefinitions(), [])

  return (
    <>
      <TableRow key={key} hover selected={isItemSelected}>
        <TableCell
          padding="none"
          onClick={event => tableOps.rowClick(event, row.id)}
          role="checkbox"
          aria-checked={isItemSelected}
          tabIndex={-1}
          sx={{ cursor: 'pointer', padding: '7px 12px 0 16px' }}
        >
          <Checkbox color="primary" checked={isItemSelected} title={row.name} />
        </TableCell>
        {columnDefs.map((column, i) => (
          <TableCell
            key={i}
            id={`${column.dbKey}-${row.id}`}
            sx={{
              minHeight: '38px',
              cursor:
                row[column.dbKey] || !column.onClick ? 'default' : 'pointer',
              ...column.sx,
            }}
            align={column.align}
            padding={column.padding}
            width={column.width}
            onClick={() =>
              row[column.dbKey] || !column.onClick
                ? setOpen(!open)
                : column.onClick(row)
            }
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
      <TableRow hover selected={isItemSelected} onClick={() => setOpen(!open)}>
        <TableCell sx={{ pb: 0, pt: 0, border: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Card sx={{ margin: 1 }}>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Total price ($)</TableCell>
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
