// this file initializes Dexie (indexDB), defines the schema and creates tables if needed
// it also provides a few helper functions for interacting with the database

import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import WaveformData from 'waveform-data'

const STATE_ROW_LIMIT = 100 // eventually allow the user to change this

// from https://dexie.org/docs/Typescript

class MixpointDb extends Dexie {
  tracks: Dexie.Table<Track, number>
  mixes: Dexie.Table<Mix, number>
  sets: Dexie.Table<Set, number>
  trackState: Dexie.Table<TrackState>
  mixState: Dexie.Table<MixState>
  setState: Dexie.Table<SetState>
  appState: Dexie.Table<AppState>

  constructor() {
    super('MixpointDb')
    this.version(1).stores({
      tracks: '++id, name, bpm, [name+size]',
      mixes: '++id, tracks',
      sets: '++id, mixes',
      trackState: 'date',
      mixState: 'date',
      setState: 'date',
      appState: 'date',
    })

    this.tracks = this.table('tracks')
    this.mixes = this.table('mixes')
    this.sets = this.table('sets')
    this.trackState = this.table('trackState')
    this.mixState = this.table('mixState')
    this.setState = this.table('setState')
    this.appState = this.table('appState')
  }
}

const db = new MixpointDb()

// define tables

interface Track {
  id?: number
  name?: string
  fileHandle?: FileSystemFileHandle
  dirHandle?: FileSystemDirectoryHandle
  size?: number
  type?: string // type of file as returned from fileHandle
  lastModified?: Date
  duration?: number
  bpm?: number
  sampleRate?: number
  offset?: number // first beat as determined by getBpm
  mixpoints?: MixPoint[]
  sets?: Set['id'][]
}

// a mixpoint is a point in time where the To track begins to overlay the From track.
// a mixpoint is not the output of two tracks mixed together.

interface MixPoint {
  timestamp: number
  mixes: Mix['id'][]
}

// a mix is a representation of the transition between tracks

interface Mix {
  id: number
  from: {
    id: Track['id']
    bpm: number
    timestamp: number
  }
  to: {
    id: Track['id']
    bpm: number
    timestamp: number
  }
  status: string // good | bad | unknown?
  effects: {
    timestamp: number
    duration: number
  }[]
}

interface Set {
  id: number
  mixIds: Mix['id'][]
}

// Each row in a state table is a full representation of state at that point in time
// This allows easy undo/redo of state changes by using timestamps (primary key)

interface TrackState {
  date?: Date
  trackId?: Track['id']
  adjustedBpm?: number
  file?: File | undefined
  waveformData?: WaveformData | undefined
  mixPoint?: number
}

interface MixState {
  date?: Date
  mixId?: Mix['id']
  bpmSync?: boolean
}

interface SetState {
  date?: Date
  setId?: Set['id']
}

interface AppState {
  date?: Date
  leftNavOpen?: boolean
  sortDirection?: 'asc' | 'desc'
  sortColumn?: keyof Track // track table order property
}

const putTracks = async (tracks: Partial<Track[]>): Promise<void> => {
  const bulkPut: Track[] = []

  for (let track of tracks) {
    if (!track) continue

    // if this is a new file, check for existing track with same name and size
    if (!track.id) {
      // if below line changes, potentially remove [name+size] index
      const dup = await db.tracks.get({ name: track.name, size: track.size })
      // if we found the track in the database already, set the primary key
      if (dup) track = { ...dup, ...track }
    }

    track.lastModified = new Date()
    bulkPut.push(track)
  }

  await db.tracks.bulkPut(bulkPut)
}

const removeTracks = async (ids: number[]): Promise<void> =>
  await db.tracks.bulkDelete(ids)

// const addMix = async (
//   trackIds: Track['id'][],
//   mixPoints: MixPoint[]
// ): Promise<number> =>
//   await db.mixes.add({ trackIds, mixPoints })

// Dirty tracks need analysis to determine bpm and duration
const getDirtyTracks = async (): Promise<Track[]> =>
  await db.tracks.filter(t => !t.bpm).toArray()

const getMix = async (id: number): Promise<Mix | undefined> =>
  await db.mixes.get(id)

const removeMix = async (id: number): Promise<void> => await db.mixes.delete(id)

// state getter and setter
interface StateTypes {
  track: TrackState
  mix: MixState
  set: SetState
  app: AppState
}

// use a single-call-signature overload to help TS determine the return type
// https://stackoverflow.com/a/71726295/1058302
// function getState<S extends keyof StateTypes>(key: S): StateTypes[S]
async function getState(table: keyof StateTypes, key?: string) {
  const state = await db[`${table}State`].orderBy('date').last()
  // @ts-ignore - no easy TS fix for this as it doesn't know whether the key is
  // valid for different tables
  return key ? state[key] : state
}

const putState = async (
  table: keyof StateTypes,
  state: Partial<StateTypes[typeof table]>
): Promise<void> => {
  const prevState = await getState(table)
  await db[`${table}State`].put({
    ...prevState,
    ...state,
    date: new Date(),
  })
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

const tables = ['track', 'mix', 'set', 'app'] as const
tables.forEach(table => createHooks(table))

export type { Track, Mix, Set, TrackState, MixState, SetState, AppState }
export {
  db,
  putTracks,
  removeTracks,
  getDirtyTracks,
  getMix,
  removeMix,
  useLiveQuery,
  getState,
  putState,
}
