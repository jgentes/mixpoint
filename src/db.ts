import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import WaveformData from 'waveform-data'
//import { Toaster } from './layout/toaster'

// from https://dexie.org/docs/Typescript

class MixPointDb extends Dexie {
  tracks: Dexie.Table<Track, number>
  mixes: Dexie.Table<Mix, number>
  sets: Dexie.Table<Set, number>
  trackState: Dexie.Table<TrackState>
  mixState: Dexie.Table<MixState>
  setState: Dexie.Table<SetState>
  appState: Dexie.Table<any>

  constructor () {
    super('MixPointDb')
    this.version(1).stores({
      tracks: '++id, name, bpm, [name+size]',
      mixes: '++id, tracks',
      sets: '++id, mixes',
      trackState: 'trackKey',
      mixState: '++id',
      setState: '++id',
      appState: ''
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
  type?: string
  lastModified?: number
  duration?: number
  bpm?: number
  sampleRate?: number
  offset?: number
}

/* TrackState should not contain mix state */
interface TrackState {
  trackKey?: number
  trackId?: number
  adjustedBpm?: number
  file?: File | undefined
  waveformData?: WaveformData | undefined
  mixPoint?: number
}

interface Mix {
  id?: number
  trackIds: number[]
  mixPoints: MixPoint[]
}
interface MixState {
  mixId?: number
  bpmSync?: boolean
}

interface Set {
  id?: number
  mixIds: number[]
}

interface SetState {
  setId?: number
}

interface MixPoint {
  times: number[]
  effects: any
}

const db = new MixPointDb()

const errHandler = (err: Error) => {
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

const addMix = async (
  trackIds: number[],
  mixPoints: MixPoint[]
): Promise<number> =>
  await db.mixes.add({ trackIds, mixPoints }).catch(errHandler)

const getMix = async (id: number): Promise<Mix | undefined> =>
  await db.mixes.get(id).catch(errHandler)

const removeMix = async (id: number): Promise<void> =>
  await db.mixes.delete(id).catch(errHandler)

export {
  db,
  Track,
  TrackState,
  Mix,
  MixState,
  Set,
  SetState,
  putTrack,
  removeTrack,
  addMix,
  getMix,
  removeMix,
  useLiveQuery
}
