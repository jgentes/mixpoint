import { ButtonProps } from '@mui/joy'
import createStore from 'teaful'
import { Track } from '~/api/dbHandlers'

type AudioStateProps = {
  analyzing: Track['id'][]
  processing: boolean
}

const initialAudioState: AudioStateProps = {
  analyzing: [],
  processing: false,
}

const { useStore: audioState, setStore: setAudioState } =
  createStore(initialAudioState)

type TableStateProps = {
  search: string | number
  selected: Track['id'][]
  rowsPerPage: number
  page: number
  showButton: number | null
  openDrawer: boolean
}

const initialTableState: TableStateProps = {
  search: '',
  selected: [],
  rowsPerPage: 10,
  page: 0,
  showButton: null,
  openDrawer: false,
}

const {
  getStore: getTableState,
  useStore: tableState,
  setStore: setTableState,
} = createStore(initialTableState)

type ConfirmModalProps = Partial<{
  openState: boolean
  headerText: string
  bodyText: string
  confirmColor: ButtonProps['color']
  confirmText: string
  onConfirm: Function
  onCancel: Function
}>

const confirmModal: ConfirmModalProps = {
  openState: false,
}

const { useStore: modalState, setStore: setModalState } =
  createStore(confirmModal)

type NotificationStateProps = {
  message: string | null
  variant: 'success' | 'error' | 'warning' | 'info'
}

const initialNotificationState: NotificationStateProps = {
  message: '',
  variant: 'error',
}

const { useStore: notificationState } = createStore(initialNotificationState)

export {
  audioState,
  setAudioState,
  tableState,
  getTableState,
  setTableState,
  modalState,
  setModalState,
  notificationState,
}
