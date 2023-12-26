import { Button, Tooltip } from '@nextui-org/react'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from '~/components/icons'

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
				{theme === 'dark' ? (
					<SunIcon className="text-xl" />
				) : (
					<MoonIcon className="text-xl" />
				)}
			</Button>
		</Tooltip>
	)
}

export default DarkMode
