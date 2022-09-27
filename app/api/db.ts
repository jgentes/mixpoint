import Dexie, { DBCoreRangeType } from 'dexie'
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

// define tables

interface Track {
  id: number
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
  mixpoints: MixPoint[]
  sets: Set['id'][]
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
}

const db = new MixpointDb()

const putTrack = async (track: Track): Promise<Track> => {
  // if below line changes, potentially remove [name+size] index
  const dup = await db.tracks.get({ name: track.name, size: track.size })
  if (dup && dup.bpm) return dup

  track.lastModified = new Date()
  const id = await db.tracks.put(track)
  track.id = id
  return track
}

const removeTrack = async (id: number): Promise<void> =>
  await db.tracks.delete(id)

// const addMix = async (
//   trackIds: Track['id'][],
//   mixPoints: MixPoint[]
// ): Promise<number> =>
//   await db.mixes.add({ trackIds, mixPoints })

const getMix = async (id: number): Promise<Mix | undefined> =>
  await db.mixes.get(id)

const removeMix = async (id: number): Promise<void> => await db.mixes.delete(id)

// ok I give up, TS forces me to be explicit here rather than use variable table names :(

const appState = {
  get: async (): Promise<AppState> =>
    (await db.appState.orderBy('date').last()) || {},
  put: async (state: Partial<AppState>): Promise<void> =>
    appState
      .get()
      .then(
        async prevState =>
          await db.appState.put({ ...prevState, ...state, date: new Date() })
      ),
}

const trackState = {
  get: async (): Promise<TrackState> =>
    (await db.trackState.orderBy('date').last()) || {},
  put: async (state: Partial<TrackState>): Promise<void> =>
    trackState
      .get()
      .then(
        async prevState =>
          await db.trackState.put({ ...prevState, ...state, date: new Date() })
      ),
}

const mixState = {
  get: async (): Promise<MixState> =>
    (await db.mixState.orderBy('date').last()) || {},
  put: async (state: Partial<MixState>): Promise<void> =>
    mixState
      .get()
      .then(
        async prevState =>
          await db.mixState.put({ ...prevState, ...state, date: new Date() })
      ),
}

const setState = {
  get: async (): Promise<SetState> =>
    (await db.setState.orderBy('date').last()) || {},
  put: async (state: Partial<SetState>): Promise<void> =>
    setState
      .get()
      .then(
        async prevState =>
          await db.setState.put({ ...prevState, ...state, date: new Date() })
      ),
}

// db hooks, again redundant due to TS issues with variable table names

// this hook limits the number of rows in a state table
db.trackState.hook('creating', async () => {
  const count = await db.trackState.count()
  if (count > STATE_ROW_LIMIT) {
    const oldest = await db.trackState.orderBy('date').first()
    if (oldest) db.trackState.delete(oldest.date)
  }
})

db.mixState.hook('creating', async () => {
  const count = await db.mixState.count()
  if (count > STATE_ROW_LIMIT) {
    const oldest = await db.mixState.orderBy('date').first()
    if (oldest) db.mixState.delete(oldest.date)
  }
})

db.setState.hook('creating', async () => {
  const count = await db.setState.count()
  if (count > STATE_ROW_LIMIT) {
    const oldest = await db.setState.orderBy('date').first()
    if (oldest) db.setState.delete(oldest.date)
  }
})

db.appState.hook('creating', async () => {
  const count = await db.appState.count()
  if (count > STATE_ROW_LIMIT) {
    const oldest = await db.appState.orderBy('date').first()
    if (oldest) db.appState.delete(oldest.date)
  }
})

export type { Track, Mix, Set, TrackState, MixState, SetState, AppState }

export {
  db,
  putTrack,
  removeTrack,
  getMix,
  removeMix,
  useLiveQuery,
  appState,
  trackState,
  mixState,
  setState,
}
