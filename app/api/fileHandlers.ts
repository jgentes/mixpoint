import { addToMix, db, storeFile, Track } from '~/api/dbHandlers'
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
  if (file) await storeFile(track.id, file)

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
  const cache = await db.fileStore.get(track.id)
  if (cache) return cache.file

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

const browseFile = async () => {
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

const getStemDir = () => {
  // Has the user specified a stemDir?
}

export { getPermission, browseFile }
