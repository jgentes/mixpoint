import { Track } from '~/api/db'
import { processTracks } from './audio'
import { superstate } from '@superstate/core'

const processingState = superstate<boolean>(false)
const analyzingState = superstate<Track[]>([])

const _getFile = async (track: Track): Promise<File | null> => {
  let handle = track.dirHandle || track.fileHandle
  if (!handle) return null

  let file = null,
    perms

  perms = await handle.queryPermission()

  const getFileHandle = async (
    fileOrDirHandle: FileSystemDirectoryHandle | FileSystemFileHandle
  ) => {
    if (fileOrDirHandle.kind == 'directory' && track.name) {
      return await fileOrDirHandle.getFileHandle(track.name)
    }
  }

  if (perms === 'granted') {
    handle = await getFileHandle(handle)
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

  // note: this will throw "DOMException: User activation is required
  // to request permissions" if user hasn't interacted with the page yet
  const handle = track.dirHandle || track.fileHandle
  // @ts-ignore - getFile() is experimental according to MDN
  await handle?.requestPermission()

  return await _getFile(track)
}

const browseFile = async () => {
  const files: FileSystemFileHandle[] = await window
    .showOpenFilePicker({ multiple: true })
    .catch(e => {
      if (e?.message?.includes('user aborted a request')) return []
      throw e
    })

  processTracks(files)
}

export { getPermission, browseFile, processingState, analyzingState }
