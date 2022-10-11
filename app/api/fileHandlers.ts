import { Track } from '~/api/db'
import { errorHandler } from '~/utils/notifications'
import { processTracks } from './audio'

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

  // in the case perms aren't granted, return null - we need to request permission
  return file
}

/** Returns the file if permission has been granted to a file
 *  will prompt the user if necessary (user must have interacted with the page first!)
 *  otherwise returns null
 */
const getPermission = async (track: Track): Promise<File | null> => {
  // first check perms
  // directory handle is preferred over file handle

  let file = await _getFile(track)
  if (file) return file

  const handle = track.dirHandle || track.fileHandle

  try {
    // note: this will throw "DOMException: User activation is required
    // to request permissions" if user hasn't interacted with the page yet
    await handle?.requestPermission()
  } catch (e) {
    errorHandler('Permission to file or folder was not granted.')
  }

  return await _getFile(track)
}

const browseFile = async () => {
  const files: FileSystemFileHandle[] | never[] | undefined = await window
    .showOpenFilePicker({ multiple: true })
    .catch(e => {
      if (e?.message?.includes('user aborted a request')) return []
    })

  if (files) processTracks(files)
}

export { getPermission, browseFile }
