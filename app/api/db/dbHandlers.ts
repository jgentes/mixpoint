// This file provides a few helper functions for interacting with the database
import { useLiveQuery } from 'dexie-react-hooks'
import { audioEvents } from '~/api/audioEvents'
import {
  __db as db,
  __Mix as Mix,
  __MixPrefs as MixPrefs,
  __Set as Set,
  __SetPrefs as SetPrefs,
  __Stem as Stem,
  __StoreTypes as StoreTypes,
  __Track as Track,
  __TrackCache as TrackCache,
  __TrackPrefs as TrackPrefs,
  __UserPrefs as UserPrefs,
} from '~/api/db/__dbSchema'
import { getPermission } from '~/api/fileHandlers'
import { errorHandler } from '~/utils/notifications'

const CACHE_LIMIT = 25

const storeTrack = async ({
  id,
  file,
  stems,
}: {
  id: TrackCache['id']
  file?: TrackCache['file']
  stems?: TrackCache['stems']
}) => {
  // Retrieve any existing cache data
  const cache = await db.trackCache.get(id)
  if (!file) file = cache?.file
  if (cache?.stems) stems = { ...cache.stems, ...stems }

  // Enforce database limit
  const count = await db.trackCache.count()
  if (count > CACHE_LIMIT) {
    const oldest = await db.trackCache.orderBy('id').first()
    if (oldest) db.trackCache.delete(oldest.id)
  }

  await db.trackCache.put({ id, file, stems })
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
const getPrefs = async <T extends keyof StoreTypes>(
  table: T,
  key?: keyof StoreTypes[T]
): Promise<Partial<StoreTypes[T]>> => {
  const state =
    ((await db[`${table}Prefs`].orderBy('date').last()) as StoreTypes[T]) || {}
  return key ? ({ [key]: state[key] } as Partial<StoreTypes[T]>) : state
}

const setPrefs = async (
  table: keyof StoreTypes,
  state: Partial<StoreTypes[typeof table]>
): Promise<void> => {
  const prevState = await getPrefs(table)

  await db[`${table}Prefs`].put({
    ...prevState,
    ...state,
    date: new Date(),
  })
}

const getTrackPrefs = async (trackId: Track['id']): Promise<TrackPrefs> => {
  const { tracks = [], trackPrefs = [] } = await getPrefs('mix')
  const trackIndex = tracks.indexOf(trackId) ?? -1

  return trackPrefs[trackIndex] || {}
}

const getTrackName = async (trackId: Track['id']) => {
  if (!trackId) return null

  let { name } = (await db.tracks.get(trackId)) || {}

  return name?.slice(0, -4) || 'Loading...'
}

// Update the state for an individual track in the mix, such as when offset is adjusted
const setTrackPrefs = async (
  trackId: Track['id'],
  state: Partial<TrackPrefs>
): Promise<void> => {
  const { tracks = [], trackPrefs = [] } = await getPrefs('mix')
  const trackIndex = tracks.indexOf(trackId) ?? -1

  if (trackIndex == -1) throw errorHandler('Track not found in mix state')

  const newState = { ...(trackPrefs[trackIndex] || {}), ...state }
  trackPrefs[trackIndex] = newState

  await setPrefs('mix', { tracks, trackPrefs })
}

const addToMix = async (track: Track) => {
  // retrieve cached file or store file for access on page refresh, don't add if we don't have perms
  const file = await getPermission(track)
  if (!file) return

  const { tracks = [], trackPrefs = [] } = await getPrefs('mix')

  // limit 2 tracks in the mix for now
  // removing because destroy should occur on renderwaveform component unmount  if (tracks.length > 1) audioEvent.emit(tracks[1]!, 'destroy')

  const index = tracks.length > 0 ? 1 : 0
  tracks[index] = track.id
  trackPrefs[index] = { id: track.id }

  await setPrefs('mix', { tracks, trackPrefs })
}

const removeFromMix = async (id: Track['id']) => {
  // removing because destroy should occur on renderwaveform component unmount   if (id) audioEvent.emit(id, 'destroy')

  const { tracks = [], trackPrefs = [] } = await getPrefs('mix')

  const index = tracks.indexOf(id) ?? -1

  if (index > -1) {
    tracks.splice(index, 1)
    trackPrefs.splice(index, 1)
  }

  await setPrefs('mix', { tracks, trackPrefs })
}

export type {
  Track,
  Mix,
  Set,
  TrackPrefs,
  MixPrefs,
  SetPrefs,
  UserPrefs,
  StoreTypes,
  TrackCache,
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
  getPrefs,
  setPrefs,
  getTrackPrefs,
  getTrackName,
  setTrackPrefs,
  storeTrack,
}
