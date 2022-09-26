import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import WaveformData from 'waveform-data'
//import { Toaster } from './layout/toaster'

// from https://dexie.org/docs/Typescript

class MixpointDb extends Dexie {
  tracks: Dexie.Table<Track, number>
  mixes: Dexie.Table<Mix, number>
  sets: Dexie.Table<Set, number>
  trackState: Dexie.Table<TrackState>
  mixState: Dexie.Table<MixState>
  setState: Dexie.Table<SetState>
  appState: Dexie.Table<any>

  constructor() {
    super('MixpointDb')
    this.version(1).stores({
      tracks: '++id, name, bpm, [name+size]',
      mixes: '++id, tracks',
      sets: '++id, mixes',
      trackState: 'trackKey',
      mixState: '++id',
      setState: '++id',
      appState: '',
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
/* TrackState should not contain mix state */
interface TrackState {
  trackKey?: number
  trackId?: number
  adjustedBpm?: number
  file?: File | undefined
  waveformData?: WaveformData | undefined
  mixPoint?: number
}

interface Track {
  id: number
  name?: string
  fileHandle?: FileSystemFileHandle
  dirHandle?: FileSystemDirectoryHandle
  size?: number
  type?: string // type of file as returned from fileHandle
  lastModified?: number
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

interface MixState {
  mixId?: Mix['id']
  bpmSync?: boolean
}

interface Set {
  id?: number
  mixIds: Mix['id'][]
}

interface SetState {
  setId?: Set['id']
}

interface AppState {
  darkMode: boolean
  leftNavOpen: boolean
}

const db = new MixpointDb()

const errHandler = (err: Error) => {
  console.error(
    'THIS WAS CAUGHT BY DB ERRORHANDLER, CURIOUS TO KNOW IF THIS WOULD HAVE BEEN CAUGHT IF THE .CATCH BLOCK WAS OMITTED'
  )
  /*
  Toaster.show({
    message: `Oops, there was a problem: ${err.message}`,
    intent: 'danger'
  })
  */
}

const putTrack = async (track: Track): Promise<Track> => {
  // if below line changes, potentially remove [name+size] index
  const dup = await db.tracks.get({ name: track.name, size: track.size })
  if (dup && dup.bpm) return dup

  track.lastModified = Date.now()
  const id = await db.tracks.put(track).catch(errHandler)
  track.id = id
  return track
}

const removeTrack = async (id: number): Promise<void> =>
  await db.tracks.delete(id).catch(errHandler)

// const addMix = async (
//   trackIds: Track['id'][],
//   mixPoints: MixPoint[]
// ): Promise<number> =>
//   await db.mixes.add({ trackIds, mixPoints }).catch(errHandler)

const getMix = async (id: number): Promise<Mix | undefined> =>
  await db.mixes.get(id).catch(errHandler)

const removeMix = async (id: number): Promise<void> =>
  await db.mixes.delete(id).catch(errHandler)

export type { Track, TrackState, Mix, MixState, Set, SetState, AppState }

export { db, putTrack, removeTrack, getMix, removeMix, useLiveQuery }
