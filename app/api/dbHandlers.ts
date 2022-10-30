// This file provides a few helper functions for interacting with the database
import { useLiveQuery } from 'dexie-react-hooks'
import { getPermission } from '~/api/fileHandlers'
import {
  __AppState as AppState,
  __db as db,
  __FileStore as FileStore,
  __Mix as Mix,
  __MixState as MixState,
  __Set as Set,
  __SetState as SetState,
  __StateTypes as StateTypes,
  __Track as Track,
  __TrackState as TrackState,
} from '~/api/__dbSchema'
import { errorHandler } from '~/utils/notifications'

const FILE_STORE_LIMIT = 50

const storeFile = async (id: Track['id'], file: File) => {
  // Enforce database limit
  const count = await db.fileStore.count()
  if (count > FILE_STORE_LIMIT) {
    const oldest = await db.fileStore.orderBy('id').first()
    if (oldest) db.fileStore.delete(oldest.id)
  }

  await db.fileStore.put({ id, file })
}

const putTracks = async (tracks: Partial<Track[]>): Promise<Track[]> => {
  const bulkTracks: Track[] = []

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

    // push into bulk array if it's not already there
    if (!bulkTracks.some(t => t.name == track?.name && t.size == track?.size))
      bulkTracks.push(track)
  }

  const updatedTracks = await db.tracks.bulkPut(bulkTracks, { allKeys: true })
  return (await db.tracks.bulkGet(updatedTracks)) as Track[]
}

const removeTracks = async (ids: number[]): Promise<void> => {
  // remove tracks from mixState if needed
  const mixState = await getState('mix')
  const from =
    mixState.from?.id && ids.includes(mixState.from.id)
      ? undefined
      : mixState.from
  const to =
    mixState.to?.id && ids.includes(mixState.to.id) ? undefined : mixState.to
  await putState('mix', { from, to })

  await db.tracks.bulkDelete(ids)
}
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

// this function is a work of typescript wizardry
const getState = async <T extends keyof StateTypes>(
  table: T,
  key?: keyof StateTypes[T]
): Promise<Partial<StateTypes[T]>> => {
  const state =
    ((await db[`${table}State`].orderBy('date').last()) as StateTypes[T]) || {}
  return key ? ({ [key]: state[key] } as Partial<StateTypes[T]>) : state
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

const getTrackState = async (trackId: Track['id']): Promise<TrackState> => {
  const mixState = await getState('mix')
  const state =
    mixState.from?.id == trackId
      ? mixState.from
      : mixState.to?.id == trackId
      ? mixState.to
      : {}

  return state || {}
}

const putTrackState = async (
  trackId: Track['id'],
  state: Partial<TrackState>
): Promise<void> => {
  const prevState = await getState('mix')
  const isFromTrack = prevState.from?.id == trackId
  if (!isFromTrack && prevState.to?.id !== trackId)
    throw errorHandler('Track not found in mix state')

  const newState = { ...prevState[isFromTrack ? 'from' : 'to'], ...state }

  await db.mixState.put({
    ...prevState,
    ...{ [isFromTrack ? 'from' : 'to']: newState },
    date: new Date(),
  })
}

const addToMix = async (track: Track) => {
  let { from, to } = await getState('mix')

  // store file for access on page refresh
  const file = await getPermission(track)
  if (!file) return

  // order of operations: from -> to
  const state = { id: track.id, file }
  if (!from) from = state
  else to = state

  putState('mix', { from, to })
}

const removeFromMix = async (id: Track['id']) => {
  let { from, to } = await getState('mix')

  from = from?.id == id ? undefined : from
  to = to?.id == id ? undefined : to

  await putState('mix', { from, to })
}

export type {
  Track,
  Mix,
  Set,
  TrackState,
  MixState,
  SetState,
  AppState,
  StateTypes,
  FileStore,
}
export {
  db,
  useLiveQuery,
  putTracks,
  removeTracks,
  getDirtyTracks,
  getMix,
  removeMix,
  addToMix,
  removeFromMix,
  getState,
  putState,
  getTrackState,
  putTrackState,
  storeFile,
}
