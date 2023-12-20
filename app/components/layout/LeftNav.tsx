import { Icon } from '@iconify-icon/react'
import {
	Box,
	List,
	ListItem,
	ListItemButton,
	ListItemContent,
	ListItemDecorator,
	Typography
} from '@mui/joy'
import { Listbox, ListboxItem, ListboxSection, cn } from '@nextui-org/react'

import { appState } from '~/api/db/appState'
import Dropzone from '~/components/tracks/Dropzone'

const LeftNav = () => {
	const [openDrawer] = appState.openDrawer()

	return (
		<div className="h-full flex flex-col p-1 border-r border-divider bg-background">
			<div className="w-full max-w-[260px] px-1 py-2 rounded-small">
				<Listbox variant="flat" aria-label="Navigation menu">
					<ListboxSection
						title="Browse"
						classNames={{
							heading:
								'uppercase tracking-widest font-semibold text-2xs text-neutral-500'
						}}
					>
						<ListboxItem
							key="tracks"
							startContent={
								<Icon
									icon="material-symbols:lens-outline"
									className="text-xl text-blue-400"
								/>
							}
						>
							Tracks
						</ListboxItem>
						<ListboxItem
							key="mixes"
							startContent={
								<Icon
									icon="material-symbols-light:join-outline"
									className="text-3xl text-blue-400"
								/>
							}
						>
							Mixes
						</ListboxItem>
						<ListboxItem
							key="sets"
							startContent={
								<Icon
									icon="material-symbols:animation"
									className="text-2xl text-blue-400 transform rotate-45"
								/>
							}
						>
							Sets
						</ListboxItem>
					</ListboxSection>
				</Listbox>
				<ListItem nested sx={{ p: 0 }}>
					<Box
						sx={{
							mt: 2,
							mb: 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between'
						}}
					>
						<Typography
							id="nav-list-playlists"
							textColor="neutral.500"
							fontWeight={700}
							sx={{
								fontSize: '10px',
								textTransform: 'uppercase',
								letterSpacing: '.1rem'
							}}
						>
							Playlists
						</Typography>
					</Box>
					<List
						aria-labelledby="nav-list-playlists"
						size="sm"
						sx={{
							'--List-decorator-size': '32px',
							'& .MuiListItemButton-root': { p: '8px' }
						}}
					>
						<ListItem>
							<ListItemButton>
								<ListItemDecorator>
									<Box
										sx={{
											width: '10px',
											height: '10px',
											borderRadius: '99px',
											backgroundColor: 'primary.300'
										}}
									/>
								</ListItemDecorator>
								<ListItemContent>Electro</ListItemContent>
							</ListItemButton>
						</ListItem>
						<ListItem>
							<ListItemButton>
								<ListItemDecorator>
									<Box
										sx={{
											width: '10px',
											height: '10px',
											borderRadius: '99px',
											backgroundColor: 'danger.400'
										}}
									/>
								</ListItemDecorator>
								<ListItemContent>House</ListItemContent>
							</ListItemButton>
						</ListItem>
						<ListItem>
							<ListItemButton>
								<ListItemDecorator>
									<Box
										sx={{
											width: '10px',
											height: '10px',
											borderRadius: '99px',
											backgroundColor: 'warning.500'
										}}
									/>
								</ListItemDecorator>
								<ListItemContent>Drum & Bass</ListItemContent>
							</ListItemButton>
						</ListItem>
						<ListItem>
							<ListItemButton>
								<ListItemDecorator>
									<Box
										sx={{
											width: '10px',
											height: '10px',
											borderRadius: '99px',
											backgroundColor: 'success.400'
										}}
									/>
								</ListItemDecorator>
								<ListItemContent>Downtempo</ListItemContent>
							</ListItemButton>
						</ListItem>
					</List>
				</ListItem>
			</div>

			<Dropzone />
		</div>
	)
}

export default LeftNav
