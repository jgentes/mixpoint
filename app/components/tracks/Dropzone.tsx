import { Icon } from '@iconify-icon/react'
import { Box, Sheet, Typography } from '@mui/joy'
import { SxProps } from '@mui/material'
import { useState } from 'react'
import { processTracks } from '~/api/audioHandlers'
import { addToMix } from '~/api/db/dbHandlers'
import { browseFile } from '~/api/fileHandlers'

const itemsDropped = async (items: DataTransferItemList, trackSlot?: 0 | 1) => {
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
	const tracks = await processTracks(handleArray)
	if (tracks[0]) addToMix(tracks[0], trackSlot)
}

const Dropzone = ({
	sx = {},
	trackSlot
}: { sx?: SxProps; trackSlot?: 0 | 1 }) => {
	const [dragOver, setDragOver] = useState(false)

	return (
		<Sheet
			variant="soft"
			id="dropzone"
			sx={{
				border: '2px dashed #bbb',
				padding: '10px',
				textAlign: 'center',
				cursor: 'pointer',
				borderColor: dragOver ? '#30b2e9' : undefined,
				backgroundImage: 'none',
				backgroundColor: dragOver ? '#30b2e919' : 'background.level1',
				borderRadius: '4px',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',

				'&:hover, &:active': {
					borderColor: '#30b2e9',
					backgroundColor: 'rgba(48, 178, 233, 0.1)'
				},
				...sx
			}}
			onClick={() => browseFile(trackSlot)}
			onDrop={e => {
				e.preventDefault()
				itemsDropped(e.dataTransfer.items, trackSlot)
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
			<Box>
				<Icon
					icon="material-symbols:drive-folder-upload-outline"
					style={{ fontSize: 38, color: '#aaa' }}
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
			</Box>
		</Sheet>
	)
}

export { Dropzone as default, itemsDropped }
