import { Icon } from '@iconify-icon/react'
import { Box, Sheet, Typography } from '@mui/joy'
import { CSSProperties, useState } from 'react'
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
	className = {},
	trackSlot
}: { className?: CSSProperties; trackSlot?: 0 | 1 }) => {
	const [dragOver, setDragOver] = useState(false)

	return (
		<div
			id="dropzone"
			className={`border-2 border-dashed cursor-pointer border-default-500 p-2 text-center rounded-md flex justify-center items-center duration-0 ${
				dragOver
					? 'border-primary-500 bg-primary-500 bg-opacity-10'
					: 'bg-default-50'
			} hover:border-primary-500 active:border-primary-500 hover:bg-primary-500 hover:bg-opacity-10 active:bg-primary-500 active:bg-opacity-10 ${className}`}
			onClick={() => browseFile(trackSlot)}
			onKeyDown={e => {
				if (e.key === 'Enter') {
					browseFile(trackSlot)
				}
			}}
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
			<div>
				<Icon
					icon="material-symbols-light:drive-folder-upload-outline"
					className="drop text-default-600 text-4xl"
				/>
				<div className="drop text-md font-semibold text-default-600">
					Add Tracks
				</div>
				<div className="drop text-sm text-default-600">Drag or click here</div>
			</div>
		</div>
	)
}

export { Dropzone as default, itemsDropped }
