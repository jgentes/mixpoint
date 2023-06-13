// This file handles application state that is not persisted through page refreshes, therefore not in IndexedDB. appState is different from Prefs in that it isn't persistent.

import { ButtonProps } from '@mui/joy'
import createStore from 'teaful'
import type WaveSurfer from 'wavesurfer.js'
import { Stem, Track } from '~/api/db/dbHandlers'

// AudioState captures whether audio is being analyzed, processed, or played
const {
	getStore: getAudioState,
	useStore: audioState,
	setStore: setAudioState
} = createStore<{
	[trackId: number]: AudioState
}>({})

type AudioState = Partial<{
	waveform: WaveSurfer
	playing: boolean
	time: number
	gainNode: GainNode // gain controls actual loudness of track
	volume: number // volume is the crossfader value
	volumeMeter: number // value between 0 and 1
	stems: Stems
	stemState: StemState
}>

type Stems = Partial<{
	[key in Stem]: Partial<{
		waveform: WaveSurfer
		gainNode: GainNode // gain controls actual loudness of stem
		volume: number // volume is the crossfader value
		volumeMeter: number
		mute: boolean
	}>
}>

type StemState =
	| 'selectStemDir'
	| 'grantStemDirAccess'
	| 'getStems'
	| 'processingStems'
	| 'convertingStems'
	| 'ready'
	| 'error'

// App captures the state of various parts of the app, mostly the table, such as search value, which which rows are selected and track drawer open/closed state
const {
	getStore: getAppState,
	useStore: AppState,
	setStore: setAppState
} = createStore<{
	search: string | number
	selected: Track['id'][]
	rowsPerPage: number
	page: number
	showButton: number | null
	openDrawer: boolean
	processing: boolean
	analyzing: Track['id'][]
	stemsAnalyzing: Track['id'][]
	multiSyncAnimation: number // a non-zero value returned from requestAnimationFrame
}>({
	search: '',
	selected: [],
	rowsPerPage: 10,
	page: 0,
	showButton: null,
	openDrawer: false,
	processing: false,
	analyzing: [],
	stemsAnalyzing: [],
	multiSyncAnimation: 0
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
	openState: false
})

// NotificationState is an alert handler
const { useStore: notificationState } = createStore<{
	message: string | null
	variant: 'success' | 'error' | 'warning' | 'info'
}>({
	message: '',
	variant: 'error'
})

export {
	AppState,
	audioState,
	getAppState,
	getAudioState,
	modalState,
	notificationState,
	setAppState,
	setAudioState,
	setModalState
}
export type { AudioState, StemState, Stems }
