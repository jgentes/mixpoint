import { Icon } from '@iconify-icon/react'
import { IconButton } from '@mui/joy'
import { useTheme } from 'next-themes'

const DarkMode = () => {
	const { theme, setTheme } = useTheme()

	return (
		<IconButton
			id="toggle-mode"
			size="sm"
			variant="outlined"
			color="primary"
			aria-label="Darkmode"
			onClick={() => {
				new Audio('/media/light.mp3').play()
				setTheme(theme === 'dark' ? 'light' : 'dark')
			}}
		>
			<Icon
				icon={`material-symbols:${
					theme === 'dark' ? 'light' : 'dark'
				}-mode-outline`}
				height="20px"
				title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
			/>
		</IconButton>
	)
}

export default DarkMode
