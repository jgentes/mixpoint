import { getAudioState, setAudioState } from '~/api/appState'
import {
  addToMix,
  db,
  getPrefs,
  setPrefs,
  Stem,
  STEMS,
  storeTrack,
  Track,
  TrackCache,
} from '~/api/db/dbHandlers'
import { errorHandler } from '~/utils/notifications'
import { processTracks } from './audioHandlers'

const _getFile = async (track: Track): Promise<File | null> => {
  let handle = track.dirHandle || track.fileHandle
  if (!handle) return null

  let file = null,
    perms = await handle.queryPermission()

  if (perms === 'granted' && track.name) {
    if (handle.kind == 'directory') {
      handle = await handle.getFileHandle(track.name)
    }

    if (handle) file = await handle.getFile()
  }

  // Cache the file
  if (file) await storeTrack({ id: track.id, file })

  // In the case perms aren't granted, return null - we need to request permission
  return file
}

/** Returns the file if permission has been granted to a file.
 *  Will pull from cache or prompt the user if necessary
 * (user must have interacted with the page first!)
 *  otherwise returns null
 */
const getPermission = async (track: Track): Promise<File | null> => {
  // First see if we have the file in the cache
  const cache = await db.trackCache.get(track.id)
  if (cache?.file) return cache.file

  // Check perms, directory handle is preferred over file handle
  const file = await _getFile(track)
  if (file) return file

  const handle = track.dirHandle || track.fileHandle

  try {
    // Note: this will catch "DOMException: User activation is required
    // to request permissions" if user hasn't interacted with the page yet
    await handle?.requestPermission()
  } catch (e) {
    errorHandler('Permission to file or folder was not granted.')
  }

  return await _getFile(track)
}

const browseFile = async (): Promise<void> => {
  const files: FileSystemFileHandle[] | undefined = await window
    .showOpenFilePicker({ multiple: true })
    .catch(e => {
      if (e?.message?.includes('user aborted a request')) return []
    })

  if (files) {
    const tracks = (await processTracks(files)) || []

    // Automatically add the track to the mix (usually because there is only 1 track in the mix)
    if (tracks.length == 1) addToMix(tracks[0])
  }
}

const getStemsDirHandle = async (): Promise<
  FileSystemDirectoryHandle | undefined
> => {
  const { stemsDirHandle } = await getPrefs('user')

  if (stemsDirHandle) {
    // check if we have permission
    if (
      (await stemsDirHandle.queryPermission({ mode: 'readwrite' })) ===
      'granted'
    ) {
      return stemsDirHandle
    } else {
      // no permission, so ask for it
      if (
        (await stemsDirHandle.requestPermission({ mode: 'readwrite' })) ===
        'granted'
      ) {
        return stemsDirHandle
      }
    }
  }

  // no dirHandle, or permission was denied, so ask for a new one
  const newStemsDirHandle = await window.showDirectoryPicker({
    startIn: stemsDirHandle,
    id: 'stemsDir',
    mode: 'readwrite',
  })

  if (
    (await newStemsDirHandle.queryPermission({ mode: 'readwrite' })) ===
    'granted'
  ) {
    await setPrefs('user', { stemsDirHandle: newStemsDirHandle })
    return newStemsDirHandle
  }
}

const validateTrackStemAccess = async (trackId: Track['id']): Promise<void> => {
  if (!trackId) return

  const checkAccess = async () => {
    // See if we have stems in cache
    const { stems } = (await db.trackCache.get(trackId)) || {}
    if (stems) return 'ready'

    // do we have a stem dir defined?
    const { stemsDirHandle } = await getPrefs('user')
    if (!stemsDirHandle) return 'selectStemDir'

    // do we have access to the stem dir?
    try {
      const stemDirAccess = await stemsDirHandle.queryPermission({
        mode: 'readwrite',
      })
      if (stemDirAccess !== 'granted') return 'grantStemDirAccess'
    } catch (e) {
      // directory doesn't exist
      return 'selectStemDir'
    }

    const [stemState] = getAudioState[trackId].stemState()
    if (stemState == 'processingStems' || stemState == 'convertingStems')
      return stemState

    const { name } = (await db.tracks.get(trackId)) || {}
    if (!name) return 'getStems'

    // does the stem dir for this track exist?
    let trackStemDirHandle
    try {
      trackStemDirHandle = await stemsDirHandle.getDirectoryHandle(
        `${name.slice(0, -4)} - stems`
      )
    } catch (e) {
      // directory doesn't exist
      return 'getStems'
    }

    // are there at least 4 files in the dir?
    const localStems: TrackCache['stems'] = {}
    for await (const [name, fileHandle] of trackStemDirHandle.entries()) {
      const file = (await fileHandle.getFile(name)) as File
      const stemName = name.slice(0, -4)
      if (STEMS.includes(stemName as Stem)) localStems[stemName as Stem] = file
    }

    if (Object.keys(localStems).length < 4) return 'getStems'

    // cache the stems
    await storeTrack({ id: trackId, stems: localStems })

    // ready!
    return 'ready'
  }

  const state = await checkAccess()
  setAudioState[trackId].stemState(state)
}

export { getPermission, browseFile, getStemsDirHandle, validateTrackStemAccess }
