import { Icon } from '@iconify-icon/react'
import { IconButton, useColorScheme } from '@mui/joy'

const DarkMode = () => {
	const { mode, setMode } = useColorScheme()

	return (
		<IconButton
			id="toggle-mode"
			size="sm"
			variant="outlined"
			color="primary"
			aria-label="Darkmode"
			onClick={() => {
				new Audio('/media/light.mp3').play()
				setMode(mode === 'dark' ? 'light' : 'dark')
			}}
		>
			<Icon
				icon={`material-symbols:${
					mode === 'light' ? 'dark' : 'light'
				}-mode-outline`}
				height="20px"
				title={mode === 'light' ? 'Dark Mode' : 'Light Mode'}
			/>
		</IconButton>
	)
}

export default DarkMode
