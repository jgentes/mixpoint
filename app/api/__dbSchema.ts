// This file initializes Dexie (indexDB), defines the schema and creates tables

import Dexie from 'dexie'

// eventually allow the user to change these
const STATE_ROW_LIMIT = 100

// from https://dexie.org/docs/Typescript

class MixpointDb extends Dexie {
  tracks: Dexie.Table<Track, number>
  mixes: Dexie.Table<Mix, number>
  sets: Dexie.Table<Set, number>
  mixState: Dexie.Table<MixState>
  setState: Dexie.Table<SetState>
  appState: Dexie.Table<AppState>
  fileStore: Dexie.Table<FileStore>

  constructor() {
    super('MixpointDb')
    this.version(1).stores({
      tracks: '++id, name, bpm, [name+size]',
      mixes: '++id, tracks',
      sets: '++id, mixes',
      mixState: 'date',
      setState: 'date',
      appState: 'date',
      fileStore: 'id',
    })

    this.tracks = this.table('tracks')
    this.mixes = this.table('mixes')
    this.sets = this.table('sets')
    this.mixState = this.table('mixState')
    this.setState = this.table('setState')
    this.appState = this.table('appState')
    this.fileStore = this.table('fileStore')
  }
}

const db = new MixpointDb()

// Core data models (tracks, mixes, sets)

type Track = Partial<{
  id: number
  name: string
  fileHandle: FileSystemFileHandle
  dirHandle: FileSystemDirectoryHandle
  size: number
  type: string // type of file as returned from fileHandle
  lastModified: Date
  duration: number
  bpm: number
  sampleRate: number
  offset: number // first beat as determined by bpm analysis
  adjustedOffset: number
  mixpoints: Mixpoint[]
  sets: Set['id'][]
}>

// a mixpoint is a point in time where the To track begins to overlay the From track.
// a mixpoint is not the output of two tracks mixed together.

type Mixpoint = {
  timestamp: number
  mixes: Mix['id'][]
}

// a mix is a representation of the transition between tracks

type Mix = {
  id: number
  status: string // Todo: define good | bad | unknown?
  effects: {
    timestamp: number
    duration: number
  }[]
  lastState: MixState
}

type Set = {
  id: number
  mixIds: Mix['id'][]
}

// The FileStore provides a cache for file data. This allows the app to render
// waveforms without prompting the user for permission to read the file from
// disk, which cannot be done without interacting with the page first.
// Each file is a few megabytes, so the cache must be limited.
type FileStore = {
  id: Track['id']
  file: File
}

// State tables

// Each row in a state table is a full representation of state at that point in time
// This allows easy undo/redo of state changes by using timestamps (primary key)
// State tables are limited to STATE_ROW_LIMIT rows (arbitrarily 100)

type MixState = Partial<{
  date: Date // current mix is most recent mixState
  tracks: Track['id'][]
  trackStates: TrackState[]
}>

type SetState = Partial<{
  date: Date
  setId: Set['id']
}>

type AppState = Partial<{
  date: Date
  sortDirection: 'asc' | 'desc'
  sortColumn: keyof Track // track table order property
}>

// Note TrackState is not a table. Track states are contained in MixState
type TrackState = Partial<{
  id: Track['id']
  adjustedBpm: Track['bpm']
  beatResolution: 0.25 | 0.5 | 1
  mixpoint: string
}>

// For state getter and setter
type StateTypes = {
  mix: MixState
  set: SetState
  app: AppState
}

// db hooks to limit the number of rows in a state table
const createHooks = (table: keyof StateTypes) => {
  db[`${table}State`].hook('creating', async () => {
    const count = await db[`${table}State`].count()
    if (count > STATE_ROW_LIMIT) {
      const oldest = await db[`${table}State`].orderBy('date').first()
      if (oldest) db[`${table}State`].delete(oldest.date)
    }
  })
}

const tables = ['mix', 'set', 'app'] as const
tables.forEach(table => createHooks(table))

// Avoid having two files export same type names
export type {
  Track as __Track,
  Mix as __Mix,
  Set as __Set,
  TrackState as __TrackState,
  MixState as __MixState,
  SetState as __SetState,
  AppState as __AppState,
  StateTypes as __StateTypes,
  FileStore as __FileStore,
}
export { db as __db }
