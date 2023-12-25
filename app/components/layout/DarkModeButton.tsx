import { Icon } from '@iconify-icon/react'
import { Button, Tooltip } from '@nextui-org/react'
import { useTheme } from 'next-themes'

const DarkMode = () => {
	const { theme, setTheme } = useTheme()

	return (
		<Tooltip
			color="primary"
			content={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
		>
			<Button
				isIconOnly
				id="toggle-mode"
				size="sm"
				radius="sm"
				variant="light"
				color="primary"
				aria-label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
				className="border-1 border-primary-300 text-primary-700"
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
				/>
			</Button>
		</Tooltip>
	)
}

export default DarkMode
