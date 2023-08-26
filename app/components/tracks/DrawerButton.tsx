import { Icon } from '@iconify-icon/react'
import { Button } from '@mui/joy'
import { AppState } from '~/api/appState'

const DrawerButton = () => {
	const [openDrawer, setOpenDrawer] = AppState.openDrawer()

	const direction = openDrawer ? 'down' : 'up'

	return (
		<Button
			variant="soft"
			size="sm"
			fullWidth
			title={direction === 'up' ? 'Open drawer' : 'Close drawer'}
			sx={{
				borderTop: '1px solid',
				borderColor: 'divider',
				borderRadius: 0,
				position: 'fixed',
				bottom: 0
			}}
			onClick={() => setOpenDrawer(direction === 'up' ? true : false)}
		>
			<Icon
				icon={`material-symbols:keyboard-arrow-${direction}`}
				height="24px"
			/>
		</Button>
	)
}

export { DrawerButton as default }
