// This file provides a few helper functions for interacting with the database
import { useLiveQuery } from 'dexie-react-hooks'
import {
  __db as db,
  __Mix as Mix,
  __MixState as MixState,
  __Set as Set,
  __SetState as SetState,
  __StateTypes as StateTypes,
  __Stem as Stem,
  __StemCache as StemCache,
  __Track as Track,
  __TrackCache as TrackCache,
  __TrackState as TrackState,
  __UserState as UserState,
} from '~/api/db/__dbSchema'
import { waveformEvent } from '~/api/events/waveformEvents'
import { getPermission } from '~/api/fileHandlers'
import { errorHandler } from '~/utils/notifications'

const CACHE_LIMIT = 25

const storeTrack = async (id: TrackCache['id'], file: TrackCache['file']) => {
  // Enforce database limit
  const count = await db.trackCache.count()
  if (count > CACHE_LIMIT) {
    const oldest = await db.trackCache.orderBy('id').first()
    if (oldest) db.trackCache.delete(oldest.id)
  }

  await db.trackCache.put({ id, file })
}

const storeStems = async (id: StemCache['id'], files: StemCache['files']) => {
  // Enforce database limit
  const count = await db.stemCache.count()
  if (count > CACHE_LIMIT) {
    const oldest = await db.stemCache.orderBy('id').first()
    if (oldest) db.stemCache.delete(oldest.id)
  }

  const cache = await db.stemCache.get(id)
  if (cache?.files) files = { ...cache.files, ...files }

  await db.stemCache.put({ id, files })
}

const updateTrack = async (
  trackId: Track['id'],
  keyvals: Partial<Track>
): Promise<Track> => {
  if (!trackId) throw errorHandler('No track id provided')

  const track = await db.tracks.get(trackId)
  if (!track) throw errorHandler('No track found, try re-adding it.')

  const updatedTrack = { ...track, ...keyvals }

  await db.tracks.put(updatedTrack)

  return updatedTrack
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
  for (const id of ids) await removeFromMix(id)

  await db.tracks.bulkDelete(ids)

  // Ensure we delete the file cache when a track is deleted
  await db.trackCache.bulkDelete(ids)
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
  const { tracks = [], trackStates = [] } = await getState('mix')
  const trackIndex = tracks.indexOf(trackId) ?? -1

  return trackStates[trackIndex] || {}
}

const getTrackName = async (trackId: Track['id']) => {
  if (!trackId) return null

  let { name } = (await db.tracks.get(trackId)) || {}

  return name?.slice(0, -4) || 'Loading...'
}

// Update the state for an individual track in the mix, such as when offset is adjusted
const putTrackState = async (
  trackId: Track['id'],
  state: Partial<TrackState>
): Promise<void> => {
  const { tracks = [], trackStates = [] } = await getState('mix')
  const trackIndex = tracks.indexOf(trackId) ?? -1

  if (trackIndex == -1) throw errorHandler('Track not found in mix state')

  const newState = { ...(trackStates[trackIndex] || {}), ...state }
  trackStates[trackIndex] = newState

  await putState('mix', { tracks, trackStates })
}

const addToMix = async (track: Track) => {
  // retrieve cached file or store file for access on page refresh, don't add if we don't have perms
  const file = await getPermission(track)
  if (!file) return

  const { tracks = [], trackStates = [] } = await getState('mix')

  // limit 2 tracks in the mix for now
  if (tracks.length > 1) waveformEvent.emit(tracks[1]!, 'destroy')

  const index = tracks.length > 0 ? 1 : 0
  tracks[index] = track.id
  trackStates[index] = { id: track.id }

  await putState('mix', { tracks, trackStates })
}

const removeFromMix = async (id: Track['id']) => {
  if (id) waveformEvent.emit(id, 'destroy')

  const { tracks = [], trackStates = [] } = await getState('mix')

  const index = tracks.indexOf(id) ?? -1

  if (index > -1) {
    tracks.splice(index, 1)
    trackStates.splice(index, 1)
  }

  await putState('mix', { tracks, trackStates })
}

export type {
  Track,
  Mix,
  Set,
  TrackState,
  MixState,
  SetState,
  UserState,
  StateTypes,
  TrackCache,
  StemCache,
  Stem,
}
export {
  db,
  useLiveQuery,
  updateTrack,
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
  getTrackName,
  putTrackState,
  storeTrack,
  storeStems,
}
