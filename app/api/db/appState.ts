// This file handles application state that is not persisted through page refreshes, therefore not in IndexedDB. appState is different from Prefs in that it isn't persistent.

import { ButtonProps } from '@mui/joy'
import { Key } from 'react'
import createStore from 'teaful'
import type WaveSurfer from 'wavesurfer.js'
import { Stem, Track } from '~/api/db/dbHandlers'

// AudioState captures whether audio is being analyzed, processed, or played
// It's worth mentioning that mixPrefs also has the keys of tracks current being mixed. The difference is that the database is intended to retain state after refresh, and appState will retain data for a large number of tracks for efficiency (ie. don't re-analyze a waveform you've already analyzed), so references should generally be made to appstate for what tracks are currently being mixed
const {
	getStore: getAudioState,
	useStore: audioState,
	setStore: setAudioState
} = createStore<{
	[trackId: Track['id']]: AudioState
}>({})

type AudioState = {
	waveform: WaveSurfer
	playing: boolean
	time: number
	gainNode: GainNode // gain controls actual loudness of track
	analyserNode: AnalyserNode // analyzerNode is used for volumeMeter
	volume: number // volume is the crossfader value
	volumeMeter: number // value between 0 and 1
	stems: Stems
	stemState: StemState
	stemTimer: number
}

type Stems = {
	[key in Stem]: {
		waveform: WaveSurfer
		gainNode?: GainNode // gain controls actual loudness of stem
		analyserNode?: AnalyserNode // analyzerNode is used for volumeMeter
		volume: number // volume is the crossfader value
		volumeMeter: number
		mute: boolean
	}
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

// App captures the state of various parts of the app, mostly the table, such as search value, which which rows are selected and track drawer open/closed state
const {
	getStore: getAppState,
	useStore: appState,
	setStore: setAppState
} = createStore<{
	search: string | number
	selected: Set<Key>
	rowsPerPage: number
	page: number
	showButton: number | null
	openDrawer: boolean
	processing: boolean
	analyzing: Set<Track['id']>
	stemsAnalyzing: Set<Track['id']>
	syncTimer: ReturnType<typeof requestAnimationFrame> | undefined
	audioContext?: AudioContext
	loggedIn: string // email address
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
	loggedIn: ''
})

// ModalState is a generic handler for various modals, usually when doing something significant like deleting tracks
const { useStore: modalState, setStore: setModalState } = createStore<
	Partial<{
		openState: boolean
		headerText: string
		bodyText: string
		confirmColor: ButtonProps['color']
		confirmText: string
		onConfirm: () => void
		onCancel: () => void
	}>
>({
	openState: false
})

export {
	appState,
	audioState,
	getAppState,
	getAudioState,
	modalState,
	setAppState,
	setAudioState,
	setModalState
}
export type { AudioState, StemState, Stems }
