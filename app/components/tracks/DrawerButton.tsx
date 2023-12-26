import { Button } from '@mui/joy'
import { appState } from '~/api/db/appState'
import { ChevronIcon } from '~/components/icons'

const DrawerButton = () => {
	const [openDrawer, setOpenDrawer] = appState.openDrawer()

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
				bottom: direction === 'up' ? '0' : '80%'
			}}
			onClick={() => setOpenDrawer(direction === 'up' ? true : false)}
		>
			<ChevronIcon
				className={`text-xl ${
					direction === 'down' ? 'rotate-90' : '-rotate-90'
				}`}
			/>
		</Button>
	)
}

export { DrawerButton as default }
