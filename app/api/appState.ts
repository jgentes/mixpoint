import { ButtonProps } from '@mui/joy'
import createStore from 'teaful'
import { Track } from '~/api/dbHandlers'

const { useStore: audioState, setStore: setAudioState } = createStore({
  analyzing: [] as Track['id'][],
  processing: false,
})

const {
  getStore: getTableState,
  useStore: tableState,
  setStore: setTableState,
} = createStore({
  search: '' as string | number,
  selected: [] as Track['id'][],
  rowsPerPage: 10 as number,
  page: 0 as number,
  showButton: null as number | null,
  openDrawer: false as boolean,
})

type ConfirmModalProps = Partial<{
  openState: boolean
  headerText: string
  bodyText: string
  confirmColor: ButtonProps['color']
  confirmText: string
  onConfirm: Function
  onCancel: Function
}>

const { useStore: confirmModalState } = createStore({
  openState: false,
} as ConfirmModalProps)

const { useStore: notificationState } = createStore({
  message: '' as string | null,
  varient: 'error' as 'success' | 'error' | 'warning' | 'info',
})

export {
  audioState,
  setAudioState,
  tableState,
  getTableState,
  setTableState,
  confirmModalState,
  notificationState,
}
