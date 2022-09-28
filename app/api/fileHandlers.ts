import { Track } from '~/api/db'

const _getFile = async (track: Track): Promise<File | undefined> => {
  let handle = track.dirHandle || track.fileHandle

  let file = null,
    perms

  perms = await handle.queryPermission()

  if (perms === 'granted') {
    if (handle.kind == 'directory')
      handle = await handle.getFileHandle(track.name)

    file = await handle.getFile()
  }

  // in the case perms aren't granted, return null - we need to request permission
  return file
}

/** returns the file if permission has been granted to a file
 *  will prompt the user if necessary (user must have interacted with the page first!)
 *  otherwise returns null
 */
const getPermission = async (track: Track): Promise<File | undefined> => {
  // first check perms
  // directory handle is preferred over file handle
  let file = await _getFile(track)
  if (file) return file

  // note: this will throw "DOMException: User activation is required
  // to request permissions" if user hasn't interacted with the page yet
  const handle = track.dirHandle || track.fileHandle
  await handle.requestPermission()

  return await _getFile(track)
}

export { getPermission }
