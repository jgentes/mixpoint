import { CloudUpload } from '@mui/icons-material'
import { Box, Sheet, Typography } from '@mui/joy'
import { useState } from 'react'
import { processTracks } from '~/api/audio'

export default function ({ onClick }: { onClick: () => Promise<void> }) {
  const [dragOver, setDragOver] = useState(false)

  // careful wtih DataTransferItemList: https://stackoverflow.com/questions/55658851/javascript-datatransfer-items-not-persisting-through-async-calls
  const itemsDropped = async (items: DataTransferItemList) => {
    const handleArray: (FileSystemFileHandle | FileSystemDirectoryHandle)[] = []

    for (const fileOrDirectory of items) {
      if (fileOrDirectory.kind === 'file') {
        const handle = (await fileOrDirectory.getAsFileSystemHandle()) as
          | FileSystemFileHandle
          | FileSystemDirectoryHandle
        if (handle) handleArray.push(handle)
      }
    }

    setDragOver(false)
    processTracks(handleArray)
  }

  return (
    <Sheet
      variant="soft"
      id="dropzone"
      sx={{
        margin: '10px 0',
        border: '2px dashed #777',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        borderColor: dragOver ? '#30b2e9' : undefined,
        backgroundColor: dragOver ? 'rgba(48, 178, 233, 0.1)' : undefined,

        '&:hover, &:active': {
          borderColor: '#30b2e9',
          backgroundColor: 'rgba(48, 178, 233, 0.1)',
        },
      }}
    >
      <Box
        onClick={onClick}
        onDrop={e => {
          e.preventDefault()
          itemsDropped(e.dataTransfer.items)
        }}
        onDragOver={e => {
          e.stopPropagation()
          e.preventDefault()
          setDragOver(true)
        }}
        onDragEnter={() => setDragOver(true)}
        onDragLeave={() => setDragOver(false)}
      >
        <CloudUpload sx={{ fontSize: 48 }} className="drop" />
        <Typography level="h4" className="drop">
          Add Tracks
        </Typography>
        <Typography className="drop">
          Drag a <strong>folder</strong> or files here.
        </Typography>
      </Box>
    </Sheet>
  )
}
