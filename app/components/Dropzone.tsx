import { DriveFolderUpload } from '@mui/icons-material'
import { BoxProps, Sheet, Typography } from '@mui/joy'
import { useState } from 'react'
import { processTracks } from '~/api/audio'
import { browseFile } from '~/api/fileHandlers'

const itemsDropped = async (items: DataTransferItemList) => {
  const handleArray: (FileSystemFileHandle | FileSystemDirectoryHandle)[] = []
  const itemQueue = []

  for (const fileOrDirectory of items) {
    if (fileOrDirectory.kind === 'file') {
      itemQueue.push(
        fileOrDirectory
          .getAsFileSystemHandle()
          .then(
            handle =>
              handle &&
              handleArray.push(
                handle as FileSystemFileHandle | FileSystemDirectoryHandle
              )
          )
      )
    }
  }

  // Must use a promise queue with DataTransferItemList
  // https://stackoverflow.com/q/55658851/1058302
  await Promise.all(itemQueue)
  processTracks(handleArray)
}

const Dropzone = (props: BoxProps) => {
  const [dragOver, setDragOver] = useState(false)

  return (
    <Sheet
      variant="soft"
      id="dropzone"
      sx={{
        margin: '10px 0',
        border: '2px dashed #bbb',
        padding: '10px',
        textAlign: 'center',
        cursor: 'pointer',
        borderColor: dragOver ? '#30b2e9' : undefined,
        backgroundColor: dragOver ? '#30b2e919' : undefined,
        borderRadius: 'sm',

        '&:hover, &:active': {
          borderColor: '#30b2e9',
          backgroundColor: 'rgba(48, 178, 233, 0.1)',
        },
        ...props.sx,
      }}
      onClick={browseFile}
      onDrop={e => {
        e.preventDefault()
        itemsDropped(e.dataTransfer.items)
        setDragOver(false)
      }}
      onDragOver={e => {
        e.stopPropagation()
        e.preventDefault()
        setDragOver(true)
      }}
      onDragEnter={() => setDragOver(true)}
      onDragLeave={() => setDragOver(false)}
    >
      <DriveFolderUpload
        sx={{ fontSize: 38, color: 'text.secondary' }}
        className="drop"
      />
      <Typography
        level="body1"
        className="drop"
        sx={{ color: 'text.secondary' }}
      >
        <b>Add Tracks</b>
      </Typography>
      <Typography className="drop" level="body2">
        Drag or click here
      </Typography>
    </Sheet>
  )
}

export { Dropzone as default, itemsDropped }
