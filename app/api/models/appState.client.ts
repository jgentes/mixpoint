// This file handles application state that is not persisted through page refreshes, therefore not in IndexedDB. appState is different from Prefs in that it isn't persistent.
import type { ButtonProps } from '@nextui-org/react'
import { type Key } from 'react'
import { proxy } from 'valtio'
import { devtools } from 'valtio/utils'
import type WaveSurfer from 'wavesurfer.js'
import {
  type Stem,
  type Track,
  getPrefs,
  getTrackPrefs
} from '~/api/handlers/dbHandlers'
import { Env } from '~/utils/env'

// AudioState captures ephemeral state of a mix, while persistent state is stored in IndexedDB
const audioState = proxy<{
  [trackId: Track['id']]: AudioState
}>({})

type AudioState = {
  waveform?: WaveSurfer
  playing?: boolean
  time?: number
  gainNode?: GainNode // gain controls actual loudness of track
  analyserNode?: AnalyserNode // analyzerNode is used for volumeMeter
  volume?: number // volume is the crossfader value
  volumeMeter?: number // value between 0 and 1
  stems: Stems
  stemState?: StemState
  stemTimer?: number
}

type Stems = {
  [key in Stem]: Partial<{
    waveform: WaveSurfer
    gainNode?: GainNode // gain controls actual loudness of stem
    analyserNode?: AnalyserNode // analyzerNode is used for volumeMeter
    volume: number // volume is the crossfader value
    volumeMeter: number
    mute: boolean
  }>
}

type StemState =
  | 'selectStemDir'
  | 'grantStemDirAccess'
  | 'getStems'
  | 'uploadingFile'
  | 'processingStems'
  | 'downloadingStems'
  | 'ready'
  | 'error'

// ModalState is a generic handler for various modals, usually when doing something significant like deleting tracks
type ModalState = Partial<{
  openState: boolean
  headerText: string
  bodyText: string
  confirmColor: ButtonProps['color']
  confirmText: string
  onConfirm: () => void
  onCancel: () => void
}>

// App captures the state of various parts of the app, mostly the table, such as search value, which which rows are selected and track drawer open/closed state
const appState = proxy<{
  search: string | number
  selected: Set<Key> // NextUI table uses string keys
  rowsPerPage: number
  page: number
  showButton: number | null
  openDrawer: boolean
  processing: boolean
  analyzing: Set<Track['id']>
  stemsAnalyzing: Set<Track['id']>
  syncTimer: ReturnType<typeof requestAnimationFrame> | undefined
  audioContext?: AudioContext
  userEmail: string // email address
  modal: ModalState
}>({
  search: '',
  selected: new Set(),
  rowsPerPage: 10,
  page: 1,
  showButton: null,
  openDrawer: false,
  processing: false,
  analyzing: new Set(),
  stemsAnalyzing: new Set(),
  syncTimer: undefined,
  userEmail: '',
  modal: { openState: false }
})

if (Env === 'development') {
  devtools(appState, { name: 'appState', enable: true })
  devtools(audioState, { name: 'audioState', enable: true })
}

// Start audioState init (if we have a mix in IndexedDB)
const mixPrefs = await getPrefs('mix')
const tracks = mixPrefs.tracks?.filter(t => t)

if (tracks?.length) {
  for (const trackId of tracks) {
    audioState[trackId] = {
      stems: { bass: {}, drums: {}, other: {}, vocals: {} }
    }
  }
}

// End audioState init

export { appState, audioState }
export type { AudioState, StemState, Stems }
