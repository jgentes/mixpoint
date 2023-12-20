import { IconButton } from '@mui/joy'

import DarkMode from '~/components/layout/DarkModeButton'
import Logo from '~/components/layout/MixpointLogo'

import { Icon } from '@iconify-icon/react'
import { Button } from '@nextui-org/react'
import LoginButton from '~/components/layout/LoginButton.client'

const Header = () => (
	<div className="p-4 flex flex-row bg-background justify-between items-center border-b sticky z-10">
		<Logo />
		<div className="flex flex-row gap-x-2">
			<LoginButton />
			<Button
				isIconOnly
				variant="faded"
				color="primary"
				aria-label="Github"
				title="Discuss on Github"
				radius="sm"
				className="border-1 transition-none hover:text-primary-50"
				onClick={() =>
					window.open('https://github.com/jgentes/mixpoint/discussions')
				}
			>
				<Icon icon="mdi:github" height="20px" />
			</Button>
			<DarkMode />
		</div>
	</div>
)

export default Header
