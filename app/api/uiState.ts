// This file handles application state that is not persisted through page refreshes, therefore not in IndexedDB

import { ButtonProps } from '@mui/joy'
import createStore from 'teaful'
import { Track } from '~/api/db/dbHandlers'

// AudioState captures whether audio is being analyzed, processed, or played
const { useStore: audioState, setStore: setAudioState } = createStore<{
  analyzing: Track['id'][]
  playing: Track['id'][]
}>({
  analyzing: [],
  playing: [],
})

// TableState captures the state of the table, such as search value, which which rows are selected and track drawer open/closed state
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
  processing: boolean
}>({
  search: '',
  selected: [],
  rowsPerPage: 10,
  page: 0,
  showButton: null,
  openDrawer: false,
  processing: false,
})

// ModalState is a generic handler for various modals, usually when doing something significant like deleting tracks
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

// NotificationState is an alert handler
const { useStore: notificationState } = createStore<{
  message: string | null
  variant: 'success' | 'error' | 'warning' | 'info'
}>({
  message: '',
  variant: 'error',
})

const { useStore: waveformState, setStore: setWaveformState } = createStore<{
  [trackId: string]: { waveform: WaveSurfer; volume: number }
}>({})

export {
  audioState,
  setAudioState,
  tableState,
  getTableState,
  setTableState,
  modalState,
  setModalState,
  notificationState,
  waveformState,
  setWaveformState,
}
