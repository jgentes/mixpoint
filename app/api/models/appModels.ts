// This file initializes Dexie (indexDB), defines the schema and creates tables
// Be sure to create MIGRATIONS for any changes to SCHEMA!
import type { ButtonProps } from '@nextui-org/react'
import Dexie from 'dexie'
import type { Key } from 'react'
import type WaveSurfer from 'wavesurfer.js'

// from https://dexie.org/docs/Typescript

class MixpointDb extends Dexie {
  tracks: Dexie.Table<Track, number>
  mixpoints: Dexie.Table<Mixpoint, number>
  mixes: Dexie.Table<Mix, number>
  sets: Dexie.Table<MixSet, number>
  trackCache: Dexie.Table<TrackCache>
  appState: Dexie.Table<AppState>

  constructor() {
    super('MixpointDb')
    this.version(4).stores({
      tracks: '++id, name, bpm, [name+size]',
      mixpoints: '++id',
      mixes: '++id, tracks',
      sets: '++id, mixes',
      trackCache: 'id',
      appState: ''
    })
    // example migration:
    //
    // this.version(2).upgrade(tx => {
    //   tx.table('userPrefs')
    //     .toCollection()
    //     .modify(userPref => {
    //       if (userPref.sortDirection === 'asc')
    //         userPref.sortDirection = 'ascending'
    //       if (userPref.sortDirection === 'desc')
    //         userPref.sortDirection = 'descending'
    //     })
    // })

    this.tracks = this.table('tracks')
    this.mixpoints = this.table('mixpoints')
    this.mixes = this.table('mixes')
    this.sets = this.table('sets')
    this.trackCache = this.table('trackCache')
    this.appState = this.table('appState')
  }
}

const db = new MixpointDb()

// Core data models (tracks, mixes, sets)

type Track = {
  id: number
  name: string
  size: number
  type: string // type of file as returned from fileHandle
  fileHandle?: FileSystemFileHandle
  dirHandle?: FileSystemDirectoryHandle
  lastModified?: Date
  duration?: number
  bpm?: number
  sampleRate?: number
  offset?: number // first beat as determined by bpm analysis
  adjustedOffset?: number
  mixpoints?: {
    to: { [trackid: number]: Set<Mixpoint['id']> }
    from: { [trackid: number]: Set<Mixpoint['id']> }
  }
  mixes?: Set<number>
  sets?: Set<number>
}

const EFFECTS = ['gain', 'linear-ramp', 'exp-ramp'] as const
type Effect = (typeof EFFECTS)[number]

// a mixpoint is a point in a track where the user can add transition effects
type Mixpoint = {
  id?: number // id always exists but add/put complains if it's not there and in this type definition
  name: string
  effects: {
    [timecode: number]: { [key in Effect]: number } // timecode is a percentage of the track duration
  }
}

// a mix is a representation of the transition between tracks

type Mix = {
  id: number
  from: Track['id']
  to: Track['id']
  status: string // TODO: define good | bad | unknown?
  effects: {
    timestamp: number
    duration: number
  }[]
}

// would have used "Set" but it's protected in JS, so named it MixSet instead

type MixSet = {
  id: number
  mixIds: Mix['id'][]
}

// The TrackCache provides a cache for file data. This allows the app to render
// waveforms without prompting the user for permission to read the file from
// disk, which cannot be done without interacting with the page first.
// Each file is a few megabytes, so the cache must be limited.
const STEMS = ['drums', 'bass', 'vocals', 'other'] as const
type Stem = (typeof STEMS)[number]

// TrackCache is a cache for track files, including stems
type TrackCache = {
  id: Track['id']
  file?: File
  stems?: Partial<{
    [key in Stem]: { file?: File }
  }>
}

// AppState provides persistence for Valtio state, which has much simpler get/set than Dexie
type AppState = Partial<{
  userState: UserState
  mixState: MixState
}>

type TrackState = Partial<{
  adjustedBpm: Track['bpm']
  beatResolution: '1:1' | '1:2' | '1:4'
  stemZoom: Stem
  mixpointTime: number // seconds
}>

type MixState = {
  tracks: Track['id'][]
  trackState: {
    [trackId: Track['id']]: TrackState
  }
}

type UserState = Partial<{
  sortDirection: 'ascending' | 'descending'
  sortColumn: Key
  visibleColumns: Set<Key> // track table visible columns
  stemsDirHandle: FileSystemDirectoryHandle // local folder on file system to store stems
}>

// AudioState is the working state of the mix, limited to the # of tracks in use, thereby not storing waveforms for all tracks
type AudioState = Partial<{
  waveform: WaveSurfer // must be a valtio ref()
  playing: boolean
  time: number
  gainNode?: GainNode // gain controls actual loudness of track, must be a ref()
  analyserNode?: AnalyserNode // analyzerNode is used for volumeMeter, must be a ref()
  volume: number // volume is the crossfader value
  volumeMeter?: number // value between 0 and 1
  stems: Stems
  stemState: StemState
  stemTimer: number
}>

type Stems = {
  [key in Stem]: Partial<{
    waveform: WaveSurfer // must be a valtio ref()
    gainNode?: GainNode // gain controls actual loudness of stem, must be a ref()
    analyserNode?: AnalyserNode // analyzerNode is used for volumeMeter, must be a ref()
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

// UiState captures the state of various parts of the app, mostly the table, such as search value, which which rows are selected and track drawer open/closed state
type UiState = {
  search: string | number
  selected: Set<Key> // NextUI table uses string keys
  rowsPerPage: number
  page: number
  showButton: number | null
  openDrawer: boolean
  dropZoneLoader: boolean
  processing: boolean
  analyzing: Set<Track['id']>
  stemsAnalyzing: Set<Track['id']>
  syncTimer: ReturnType<typeof requestAnimationFrame> | undefined
  audioContext?: AudioContext
  userEmail: string // email address
  modal: ModalState
}

// Avoid having two files export same type names
export type {
  Track,
  Mix,
  Mixpoint,
  Effect,
  MixSet,
  TrackCache,
  Stem,
  StemState,
  AppState,
  UserState,
  MixState,
  TrackState,
  AudioState,
  UiState
}
export { db, STEMS, EFFECTS }
