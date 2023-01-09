// This file initializes Dexie (indexDB), defines the schema and creates tables

import Dexie from 'dexie'

// eventually allow the user to change these
const STATE_ROW_LIMIT = 100

// from https://dexie.org/docs/Typescript

class MixpointDb extends Dexie {
  tracks: Dexie.Table<Track, number>
  mixes: Dexie.Table<Mix, number>
  sets: Dexie.Table<Set, number>
  mixPrefs: Dexie.Table<MixPrefs>
  setPrefs: Dexie.Table<SetPrefs>
  userPrefs: Dexie.Table<UserPrefs>
  trackCache: Dexie.Table<TrackCache>

  constructor() {
    super('MixpointDb')
    this.version(1).stores({
      tracks: '++id, name, bpm, [name+size]',
      mixes: '++id, tracks',
      sets: '++id, mixes',
      mixPrefs: 'date',
      setPrefs: 'date',
      userPrefs: 'date',
      trackCache: 'id',
    })

    this.tracks = this.table('tracks')
    this.mixes = this.table('mixes')
    this.sets = this.table('sets')
    this.mixPrefs = this.table('mixPrefs')
    this.setPrefs = this.table('setPrefs')
    this.userPrefs = this.table('userPrefs')
    this.trackCache = this.table('trackCache')
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
  lastState: MixPrefs
}

type Set = {
  id: number
  mixIds: Mix['id'][]
}

// The TrackCache provides a cache for file data. This allows the app to render
// waveforms without prompting the user for permission to read the file from
// disk, which cannot be done without interacting with the page first.
// Each file is a few megabytes, so the cache must be limited.
const stems = ['drums', 'bass', 'vocals', 'other'] as const
type Stem = typeof stems[number]

type TrackCache = {
  id: Track['id']
  file?: File
  stems?: Partial<{ [key in Stem]: File }>
}

// Note TrackPrefs is not a table. Track states are contained in MixPrefs
type TrackPrefs = Partial<{
  id: Track['id']
  adjustedBpm: Track['bpm']
  beatResolution: 0.25 | 0.5 | 1
  mixpointTime: number // seconds
}>

// State tables

// Each row in a state table is a full representation of state at that point in time
// This allows easy undo/redo of state changes by using timestamps (primary key)
// State tables are limited to STATE_ROW_LIMIT rows (arbitrarily 100)

type MixPrefs = Partial<{
  date: Date // current mix is most recent mixPrefs
  tracks: Track['id'][]
  trackPrefs: TrackPrefs[]
}>

type SetPrefs = Partial<{
  date: Date
  setId: Set['id']
}>

type UserPrefs = Partial<{
  date: Date
  sortDirection: 'asc' | 'desc'
  sortColumn: keyof Track // track table order property
  stemsDirHandle: FileSystemDirectoryHandle // local folder on file system to store stems
}>

// For state getter and setter
type StoreTypes = {
  mix: MixPrefs
  set: SetPrefs
  user: UserPrefs
}

// db hooks to limit the number of rows in a state table
const createHooks = (table: keyof StoreTypes) => {
  db[`${table}Prefs`].hook('creating', async () => {
    const count = await db[`${table}Prefs`].count()
    if (count > STATE_ROW_LIMIT) {
      const oldest = await db[`${table}Prefs`].orderBy('date').first()
      if (oldest) db[`${table}Prefs`].delete(oldest.date)
    }
  })
}

const tables = ['mix', 'set', 'user'] as const
tables.forEach(table => createHooks(table))

// Avoid having two files export same type names
export type {
  Track as __Track,
  Mix as __Mix,
  Set as __Set,
  TrackPrefs as __TrackPrefs,
  MixPrefs as __MixPrefs,
  SetPrefs as __SetPrefs,
  UserPrefs as __UserPrefs,
  StoreTypes as __StoreTypes,
  TrackCache as __TrackCache,
  Stem as __Stem,
}
export { db as __db }
