import { Icon } from '@iconify-icon/react'
import { CircularProgress, Sheet, Typography } from '@mui/joy'
import { ReactElement } from 'react'
import { useCountUp } from 'use-count-up'
import { StemState, audioState } from '~/api/db/appState'
import { Track } from '~/api/db/dbHandlers'
import { getStemsDirHandle, validateTrackStemAccess } from '~/api/fileHandlers'
import { stemAudio } from '~/api/stemHandler'
import { errorHandler } from '~/utils/notifications'

const StemAccessButton = ({ trackId }: { trackId: Track['id'] }) => {
	if (!trackId) return null

	const [stemState = 'selectStemDir'] = audioState[trackId].stemState()
	const [stemTimer = 45] = audioState[trackId].stemTimer()

	const getStemsDir = async () => {
		try {
			await getStemsDirHandle()
			await validateTrackStemAccess(trackId)
		} catch (err) {
			// this would be due to denial of permission (ie. clicked cancel)
			return errorHandler('Permission to the file or folder was denied.')
		}
	}

	const stemHandler = async () => {
		try {
			stemState === 'getStems' ? stemAudio(trackId) : await getStemsDir()
		} catch (e) {
			return // error handled in promises
		}
	}

	const TimerCircle = ({ color }: { color: 'success' | 'warning' }) => {
		const { value = 1 } = useCountUp({
			isCounting: true,
			duration: stemTimer,
			start: 0,
			end: 100,
			easing: 'linear',
			updateInterval: 1,
			onComplete: () => ({ shouldRepeat: true })
		})

		return (
			<CircularProgress
				size="md"
				color={color}
				determinate
				value={(((value as number) || 1) / stemTimer) * 100}
			/>
		)
	}

	const stemStates: {
		[key in StemState]: {
			icon: ReactElement
			primaryText: string
			secondaryText: string
		}
	} = {
		selectStemDir: {
			icon: (
				<Icon
					icon="material-symbols:download-for-offline"
					style={{ fontSize: 38, color: 'text.secondary' }}
				/>
			),
			primaryText: 'Click to Select Stems Folder',
			secondaryText: 'Downloaded stems will be stored here'
		},
		grantStemDirAccess: {
			icon: (
				<Icon
					icon="material-symbols:rule-folder-outline"
					style={{ fontSize: 38, color: 'text.secondary' }}
				/>
			),
			primaryText: 'Click to Grant Folder Access',
			secondaryText: 'Permission needed to access stems'
		},
		getStems: {
			icon: (
				<Icon
					icon="material-symbols:tune"
					style={{ fontSize: 38, color: 'text.secondary' }}
				/>
			),
			primaryText: 'Click to Retrieve Stems',
			secondaryText: 'Separate track into drums, vocals, etc'
		},
		uploadingFile: {
			icon: <TimerCircle color="success" />,
			primaryText: 'Please stand by...',
			secondaryText: 'Preparing service for stem separation'
		},
		processingStems: {
			icon: <TimerCircle color="warning" />,
			primaryText: 'Please stand by...',
			secondaryText: 'Stem separation in progress'
		},
		downloadingStems: {
			icon: <CircularProgress size="md" color="success" />,
			primaryText: 'Please stand by...',
			secondaryText: 'Downloading stems'
		},
		ready: { icon: <></>, primaryText: '', secondaryText: '' },
		error: {
			icon: (
				<Icon
					icon="material-symbols:error-outline"
					style={{ fontSize: 38, color: 'text.secondary' }}
				/>
			),
			primaryText: 'Something went wrong',
			secondaryText: 'Please refresh the page and try again'
		}
	}

	return (
		<Sheet
			variant="soft"
			sx={{
				border: '2px dashed #bbb',
				height: '138px', // height of stems once loaded
				padding: '20px 10px',
				textAlign: 'center',
				cursor: 'pointer',
				borderRadius: '4px',
				borderColor: '#e9b830cc',
				backgroundColor: 'rgba(233, 215, 48, 0.1)',

				'&:hover, &:active': {
					borderColor: '#e9b830c0',
					backgroundColor: 'rgba(233, 215, 48, 0.3)'
				}
			}}
			onClick={stemHandler}
		>
			{stemStates[stemState].icon}
			<Typography
				level="body-sm"
				className="drop"
				sx={{ color: 'text.secondary' }}
			>
				<b>{stemStates[stemState].primaryText}</b>
			</Typography>
			<Typography className="drop" level="body-md">
				{stemStates[stemState].secondaryText}
			</Typography>
		</Sheet>
	)
}

export { StemAccessButton as default }
