import { Box, IconButton } from '@mui/joy'

import DarkMode from '~/components/layout/DarkModeButton'
import Logo from '~/components/layout/MixpointLogo'

import { Icon } from '@iconify-icon/react'
import posthog from 'posthog-js'
import LoginButton from '~/components/layout/LoginButton.client'

const Header = () => (
	<Box
		component="header"
		sx={{
			p: 2,
			backgroundColor: 'background.surface',
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			gridColumn: '1 / -1',
			borderBottom: '1px solid',
			borderColor: 'divider',
			position: 'sticky',
			top: 0,
			zIndex: 1100
		}}
	>
		<Logo />
		<Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
			{posthog.isFeatureEnabled('Login') ? <LoginButton /> : null}
			<IconButton
				size="sm"
				variant="outlined"
				color="primary"
				aria-label="Github"
				title="Discuss on Github"
				onClick={() =>
					window.open('https://github.com/jgentes/mixpoint/discussions')
				}
			>
				<Icon icon="mdi:github" height="20px" />
			</IconButton>
			<DarkMode />
		</Box>
	</Box>
)

export default Header
