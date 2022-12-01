// This file handles application state that is not persisted through page refreshes, therefore not in IndexedDB

import { ButtonProps } from '@mui/joy'
import createStore from 'teaful'
import { Track } from '~/api/dbHandlers'

const { useStore: audioState, setStore: setAudioState } = createStore<{
  analyzing: Track['id'][]
  processing: boolean
}>({
  analyzing: [],
  processing: false,
})

const {
  getStore: getTableState,
  useStore: tableState,
  setStore: setTableState,
} = createStore<{
  search: string | number
  selected: Track['id'][]
  rowsPerPage: number
  page: number
  showButton: number | null
  openDrawer: boolean
}>({
  search: '',
  selected: [],
  rowsPerPage: 10,
  page: 0,
  showButton: null,
  openDrawer: false,
})

const { useStore: modalState, setStore: setModalState } = createStore<
  Partial<{
    openState: boolean
    headerText: string
    bodyText: string
    confirmColor: ButtonProps['color']
    confirmText: string
    onConfirm: Function
    onCancel: Function
  }>
>({
  openState: false,
})

const { useStore: notificationState } = createStore<{
  message: string | null
  variant: 'success' | 'error' | 'warning' | 'info'
}>({
  message: '',
  variant: 'error',
})

const { useStore: trackVolume } = createStore<number[]>([])

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
