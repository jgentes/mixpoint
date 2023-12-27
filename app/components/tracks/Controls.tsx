import {
	Box,
	Card,
	FormControl,
	Option,
	Radio,
	RadioGroup,
	Select,
	Slider,
	Typography,
	radioClasses
} from '@mui/joy'
import { ButtonGroup, SxProps } from '@mui/material'
import { useEffect, useState } from 'react'
import { audioEvents } from '~/api/audioEvents'
import {
	MixPrefs,
	STEMS,
	Stem,
	Track,
	TrackPrefs,
	db,
	getTrackPrefs,
	useLiveQuery
} from '~/api/db/dbHandlers'

import { Button, Chip, Input, Link, Tooltip } from '@nextui-org/react'
import { audioState } from '~/api/db/appState'
import {
	EjectIcon,
	HeadsetIcon,
	HeadsetOffIcon,
	NextIcon,
	PauseIcon,
	PlayIcon,
	PreviousIcon,
	ReplayIcon,
	RevertIcon,
	SetMixpointIcon,
	VolumeOffIcon,
	VolumeUpIcon
} from '~/components/icons'
import VolumeMeter from '~/components/mixes/VolumeMeter'
import { convertToSecs, timeFormat } from '~/utils/tableOps'

const inputText = (text: string) => {
	return (
		<Typography
			textColor="#888"
			sx={{ fontSize: 12, lineHeight: 0, cursor: 'default' }}
		>
			{text}
		</Typography>
	)
}

const NumberControl = ({
	trackId,
	val,
	adjustedVal,
	toFixedVal = 1,
	title,
	text,
	emitEvent,
	className
}: {
	trackId: Track['id']
	val: string | undefined
	adjustedVal: string | undefined
	toFixedVal?: number
	title: string
	text: string
	emitEvent: 'bpm' | 'offset'
	className?: string
}) => {
	const [inputVal, setInputVal] = useState<string>('0')

	useEffect(
		() => setInputVal(Number(adjustedVal ?? val ?? 0).toFixed(toFixedVal)),
		[adjustedVal, val, toFixedVal]
	)

	const valDiff =
		!Number.isNaN(Number(adjustedVal)) &&
		Number(adjustedVal)?.toFixed(toFixedVal) !== val

	const adjustVal = async (newVal?: string) => {
		const value = newVal ?? val
		if (Number.isNaN(Number(value))) return

		if (value !== undefined) setInputVal(value)

		audioEvents[emitEvent](trackId, Number(value))
	}

	const ResetValLink = () => (
		<Tooltip color="default" content={title}>
			<Link
				underline="none"
				onClick={() => adjustVal()}
				color="foreground"
				isDisabled={!valDiff}
				className="text-default-600 text-xs cursor-pointer z-20"
			>
				{inputText(text)}
				{valDiff ? <ReplayIcon className="ml-1 text-md" /> : ''}
			</Link>
		</Tooltip>
	)

	return (
		<form
			onSubmit={e => {
				e.preventDefault()
				adjustVal(inputVal)
			}}
		>
			<Input
				variant="bordered"
				startContent={<ResetValLink />}
				value={inputVal}
				onValueChange={setInputVal}
				onBlur={() => {
					if (inputVal !== adjustedVal) adjustVal(inputVal)
				}}
				classNames={{
					base: className,
					inputWrapper: 'border-1 bg-default-50 rounded px-2 h-6 min-h-0',
					input: 'text-xs text-right text-default-600'
				}}
			/>
		</form>
	)
}

const EjectControl = ({ trackId }: { trackId: Track['id'] }) => {
	return (
		<Button
			isIconOnly
			variant="ghost"
			color="primary"
			size="sm"
			radius="sm"
			title="Load Track"
			onClick={() => audioEvents.ejectTrack(trackId)}
			className="border-1 rounded h-6 border-primary-300 text-primary-700"
		>
			<EjectIcon className="text-2xl" />
		</Button>
	)
}

const ZoomSelectControl = ({
	trackId,
	sx
}: { trackId: Track['id']; sx?: SxProps }) => {
	if (!trackId) return null

	const { stemZoom } =
		useLiveQuery(() => getTrackPrefs(trackId), [trackId]) || {}

	return (
		<Select
			variant="outlined"
			size="sm"
			title="Load Track"
			value={stemZoom || 'all'}
			onChange={(e, newValue) => {
				if (newValue)
					audioEvents.stemZoom(trackId, newValue as TrackPrefs['stemZoom'])
			}}
			sx={{
				minHeight: '24px',
				fontSize: 12,
				borderRadius: '5px',
				borderColor: 'action.selected',
				'+ .MuiSelect-listbox': {
					paddingTop: 0,
					'> .MuiOption-root': {
						fontSize: '12px',
						marginTop: 0,
						'--List-item-minHeight': '1rem'
					}
				},
				...sx
			}}
		>
			<Option value="all">All Stems</Option>
			{STEMS.map(stem => (
				<Option value={stem} key={stem}>
					{stem[0].toUpperCase() + stem.slice(1).toLowerCase()}
				</Option>
			))}
		</Select>
	)
}

const BpmControl = ({
	trackId,
	className
}: {
	trackId: Track['id']
	className: string
}) => {
	if (!trackId) return null

	const { bpm } = useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}

	const { adjustedBpm } =
		useLiveQuery(() => getTrackPrefs(trackId), [trackId]) || {}

	return (
		<NumberControl
			trackId={trackId}
			val={String(bpm?.toFixed(1))}
			adjustedVal={String(adjustedBpm)}
			toFixedVal={1}
			title="Reset BPM"
			text="BPM:"
			emitEvent="bpm"
			className={className}
		/>
	)
}

const OffsetControl = ({
	trackId,
	className
}: {
	trackId: TrackPrefs['id']
	className?: string
}) => {
	if (!trackId) return null

	const { offset, adjustedOffset } =
		useLiveQuery(() => db.tracks.get(trackId)) || {}

	return (
		<NumberControl
			trackId={trackId}
			val={String(offset?.toFixed(2))}
			adjustedVal={String(adjustedOffset)}
			toFixedVal={2}
			title="Reset Beat Offset"
			text="Beat Offset:"
			emitEvent="offset"
			className={className}
		/>
	)
}

const BeatResolutionControl = ({
	trackId,
	sx
}: {
	trackId: TrackPrefs['id']
	sx?: SxProps
}) => {
	if (!trackId) return null

	const { beatResolution = 1 } =
		useLiveQuery(() => getTrackPrefs(trackId), [trackId]) || {}

	return (
		<RadioGroup
			orientation={'horizontal'}
			name="beatResolution"
			value={beatResolution}
			variant="outlined"
			sx={{
				backgroundColor: 'background.surface',
				borderColor: 'action.selected',
				borderRadius: '5px',
				...sx
			}}
			onChange={e =>
				audioEvents.beatResolution(
					trackId,
					+e.target.value as TrackPrefs['beatResolution']
				)
			}
		>
			{[0.25, 0.5, 1].map(item => (
				<Box
					key={item}
					sx={theme => ({
						position: 'relative',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						width: 48,
						height: 24,
						'&:not([data-first-child])': {
							borderLeft: '1px solid',
							borderColor: theme.palette.divider
						},
						[`&[data-first-child] .${radioClasses.action}`]: {
							borderTopLeftRadius: '5px',
							borderBottomLeftRadius: '5px'
						},
						[`&[data-last-child] .${radioClasses.action}`]: {
							borderTopRightRadius: '5px',
							borderBottomRightRadius: '5px'
						}
					})}
				>
					<Radio
						value={item}
						disableIcon
						overlay
						label={`${item * 100}%`}
						variant={beatResolution === item ? 'outlined' : 'plain'}
						color="primary"
						sx={{
							fontSize: 12,
							color: 'text.secondary'
						}}
						slotProps={{
							action: {
								sx: { borderRadius: 0, transition: 'none' }
							},
							label: { sx: { lineHeight: 0 } }
						}}
					/>
				</Box>
			))}
		</RadioGroup>
	)
}

const TrackNavControl = ({ trackId = 0 }: { trackId: TrackPrefs['id'] }) => {
	const navEvent = (nav: string) => {
		switch (nav) {
			case 'Play':
				audioEvents.play(trackId)
				break
			case 'Pause':
				audioEvents.pause(trackId)
				break
			case 'Go to Mixpoint':
				audioEvents.seekMixpoint(trackId)
				break
			case 'Set Mixpoint':
				audioEvents.setMixpoint(trackId)
				break
			case 'Previous Beat Marker':
				audioEvents.seek(trackId, 0, 'previous')
				break
			case 'Next Beat Marker':
				audioEvents.seek(trackId, 0, 'next')
				break
		}
	}

	const [isPlaying] = audioState[trackId].playing()

	return (
		<ButtonGroup variant="text" color="inherit" disableRipple id="navControl">
			{[
				{
					val: 'Previous Beat Marker',
					icon: <PreviousIcon className="text-lg" />
				},
				{
					val: 'Go to Mixpoint',
					icon: <RevertIcon className="text-lg" />
				},

				{
					val: 'Set Mixpoint',
					icon: <SetMixpointIcon className="text-lg" />
				},
				{
					val: isPlaying ? 'Pause' : 'Play',
					icon: isPlaying ? (
						<PauseIcon className="text-lg" />
					) : (
						<PlayIcon className="text-lg" />
					)
				},
				{
					val: 'Next Beat Marker',
					icon: <NextIcon className="text-lg" />
				}
			].map(item => {
				const noNudge = item.val.includes('Nudge') && !isPlaying

				return (
					<Button
						component="button"
						onClick={e => navEvent(e.currentTarget.value)}
						key={item.val}
						value={item.val}
						title={item.val}
						disabled={noNudge}
						sx={theme => ({
							'--Icon-color': noNudge
								? theme.palette.action.selected
								: theme.palette.text.secondary,
							borderColor: 'transparent !important'
						})}
					>
						{item.icon}
					</Button>
				)
			})}
		</ButtonGroup>
	)
}

const MixControl = ({ tracks }: { tracks: MixPrefs['tracks'] }) => {
	if (!tracks?.length) return null

	const navEvent = (nav: string) => {
		switch (nav) {
			case 'Play':
				audioEvents.play()
				break
			case 'Pause':
				audioEvents.pause()
				break
			case 'Go to Mixpoint':
				for (const track of tracks) audioEvents.seekMixpoint(track)
				break
		}
	}

	const radioSize = 28

	return (
		<RadioGroup
			orientation={'horizontal'}
			name="mixControl"
			variant="outlined"
			sx={{ height: radioSize, my: 1, backgroundColor: 'background.surface' }}
			onClick={e => {
				const el = e.target as HTMLInputElement
				navEvent(el.value)
			}}
		>
			{[
				{
					val: 'Go to Mixpoint',
					icon: <RevertIcon className="text-lg" />
				},
				{
					val: 'Pause',
					icon: <PauseIcon className="text-lg" />
				},
				{
					val: 'Play',
					icon: <PlayIcon className="text-lg" />
				}
			].map(item => (
				<Box
					key={item.val}
					sx={theme => {
						return {
							position: 'relative',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							width: radioSize * 2,
							height: radioSize,
							'&:not([data-first-child])': {
								borderLeft: '1px solid',
								borderColor: `${theme.palette.divider} !important`,
								height: '99%'
							},
							[`&[data-first-child] .${radioClasses.action}`]: {
								borderTopLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`,
								borderBottomLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`,
								bottom: '2px',
								left: '-1px'
							},
							[`&[data-last-child] .${radioClasses.action}`]: {
								borderTopRightRadius: `calc(${theme.vars.radius.sm} - 1px)`,
								borderBottomRightRadius: `calc(${theme.vars.radius.sm} - 1px)`,
								height: '101%'
							}
						}
					}}
				>
					<Radio
						value={item.val}
						disableIcon
						overlay
						label={item.icon}
						variant="plain"
						color="primary"
						slotProps={{
							root: {
								sx: {
									'--Icon-fontSize': `${radioSize - 8}px`
								}
							},
							action: {
								sx: {
									borderRadius: 0,
									transition: 'none'
								}
							},
							label: { sx: { lineHeight: 0 } }
						}}
					/>
				</Box>
			))}
		</RadioGroup>
	)
}

const MixpointControl = ({ trackId }: { trackId: Track['id'] }) => {
	if (!trackId) return null

	const { mixpointTime } =
		useLiveQuery(() => getTrackPrefs(trackId), [trackId]) || {}

	const [mixpointVal, setMixpointVal] = useState<string>('0:00.00')

	useEffect(() => setMixpointVal(timeFormat(mixpointTime || 0)), [mixpointTime])

	const adjustMixpoint = async (newMixpoint: string) => {
		if (convertToSecs(newMixpoint) === mixpointTime) return null

		audioEvents.setMixpoint(trackId, newMixpoint)
	}

	return (
		<FormControl
			onSubmit={e => {
				e.preventDefault()
				adjustMixpoint(mixpointVal)
			}}
			sx={{
				'& div': {
					'--Input-minHeight': '24px'
				}
			}}
		>
			<Input
				variant="outlined"
				startDecorator={inputText('Mixpoint:')}
				value={mixpointVal}
				onChange={e => setMixpointVal(e.target.value)}
				onBlur={() => adjustMixpoint(mixpointVal)}
				sx={{
					width: 135,
					borderRadius: '5px',
					borderColor: 'action.selected',
					'& div': {
						borderColor: 'action.disabled',
						'--Input-gap': '4px'
					},
					'& input': {
						textAlign: 'right',
						fontSize: 12,
						color: 'text.secondary'
					},
					backgroundColor: 'background.surface'
				}}
			/>
		</FormControl>
	)
}

const StemControl = ({
	trackId,
	stemType
}: {
	trackId: Track['id']
	stemType: Stem
}) => {
	if (!trackId) return null

	const [volume = 100] = audioState[trackId].stems[stemType].volume()
	const [mute = false] = audioState[trackId].stems[stemType].mute()

	const [solo, setSolo] = useState(false)

	const toggleSolo = () => {
		audioEvents.stemSoloToggle(trackId, stemType, !solo)
		setSolo(!solo)
	}

	const loaderSx = {
		p: 0,
		border: '1px solid',
		borderColor: 'action.focus',
		borderRadius: '4px',
		borderBottom: 'none',
		backgroundColor: 'background.body',
		overflow: 'hidden',
		zIndex: 1
	}

	const iconStyle = 'text-lg cursor-pointer text-default-300'

	return (
		<>
			<Box
				sx={{
					display: 'flex',
					gap: 1,
					alignItems: 'center',
					justifyContent: 'space-between'
				}}
			>
				<Typography
					sx={{
						fontSize: 'xs',
						fontWeight: 'md',
						pl: '3px',
						width: '60px'
					}}
				>
					{stemType[0].toUpperCase() + stemType.slice(1).toLowerCase()}
				</Typography>
				<Box sx={{ width: '100%' }}>
					<Card
						id={`zoomview-container_${trackId}_${stemType}`}
						sx={{
							...loaderSx,
							height: '20px',
							pt: '3px'
						}}
						onClick={e => {
							const parent = e.currentTarget.firstElementChild as HTMLElement
							audioEvents.clickToSeek(trackId, e, parent)
						}}
					/>
					<VolumeMeter trackId={trackId} stemType={stemType} />
				</Box>
				{solo ? (
					<HeadsetOffIcon className={iconStyle} onClick={() => toggleSolo()} />
				) : (
					<HeadsetIcon className={iconStyle} onClick={() => toggleSolo()} />
				)}
				{!volume || mute ? (
					<VolumeOffIcon
						className={iconStyle}
						onClick={() => audioEvents.stemMuteToggle(trackId, stemType, false)}
					/>
				) : (
					<VolumeUpIcon
						className={iconStyle}
						onClick={() => audioEvents.stemMuteToggle(trackId, stemType, true)}
					/>
				)}
			</Box>
		</>
	)
}

const StemsCrossfaders = () => (
	<Box sx={{ my: 1, lineHeight: 1.2 }}>
		{STEMS.map(stem => (
			<CrossfaderControl key={stem} stemType={stem as Stem} />
		))}
	</Box>
)

const CrossfaderControl = ({ stemType }: { stemType?: Stem }) => (
	<Slider
		aria-label="crossfader"
		defaultValue={50}
		min={0}
		max={100}
		step={2}
		track={false}
		marks={[0, 50, 100].map(v => ({ value: v }))}
		valueLabelDisplay="off"
		variant="soft"
		size="md"
		onChange={(_, val) => audioEvents.crossfade(val as number, stemType)}
		sx={{
			padding: '15px 0',
			'& .MuiSlider-thumb': {
				width: '10px',
				height: '20px',
				borderRadius: '3px'
			}
		}}
	/>
)

const TrackTime = ({ trackId, sx }: { trackId: Track['id']; sx?: SxProps }) => {
	const [time = 0] = audioState[trackId].time()

	return (
		<Typography sx={{ fontSize: 'xs', ...sx }}>{timeFormat(time)}</Typography>
	)
}

export {
	BeatResolutionControl,
	BpmControl,
	CrossfaderControl,
	EjectControl,
	MixControl,
	MixpointControl,
	OffsetControl,
	StemControl,
	StemsCrossfaders,
	TrackNavControl,
	TrackTime,
	ZoomSelectControl
}
