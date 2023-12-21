import { Icon } from '@iconify-icon/react'
import { Listbox, ListboxItem, ListboxSection } from '@nextui-org/react'

import Dropzone from '~/components/tracks/Dropzone'

const LeftNav = () => (
	<div className="h-full flex flex-col p-0.5 border-r border-divider bg-background justify-between">
		<div className="w-full max-w-[260px] px-1 py-2 rounded-small">
			<Listbox
				variant="flat"
				aria-label="Navigation menu"
				disabledKeys={['electro', 'house', 'drum & bass', 'downtempo']}
			>
				<ListboxSection
					title="Browse"
					classNames={{
						heading:
							'uppercase tracking-widest font-semibold text-2xs text-neutral-400 light:text-neutral-500'
					}}
				>
					<ListboxItem
						key="tracks"
						title="Tracks"
						className="h-10"
						startContent={
							<Icon
								icon="material-symbols:lens-outline"
								className="text-xl text-blue-400 ml-1 w-7"
							/>
						}
					/>
					<ListboxItem
						key="mixes"
						title="Mixes"
						className="h-10"
						startContent={
							<Icon
								icon="material-symbols-light:join-outline"
								className="text-3xl text-blue-400 w-8"
							/>
						}
					/>
					<ListboxItem
						key="sets"
						title="Sets"
						className="h-10"
						startContent={
							<Icon
								icon="material-symbols-light:animation"
								className="text-3xl text-blue-400 rotate-45 w-8"
							/>
						}
					/>
				</ListboxSection>
				<ListboxSection
					title="Playlists"
					classNames={{
						heading:
							'uppercase tracking-widest font-semibold text-2xs text-neutral-400 light:text-neutral-500'
					}}
				>
					<ListboxItem
						key="electro"
						title="Electro"
						startContent={
							<div className="w-2.5 h-2.5 rounded-full bg-blue-300 ml-1" />
						}
					/>
					<ListboxItem
						key="house"
						title="House"
						startContent={
							<div className="w-2.5 h-2.5 rounded-full bg-red-300 ml-1" />
						}
					/>
					<ListboxItem
						key="drum & bass"
						title="Drum & Bass"
						startContent={
							<div className="w-2.5 h-2.5 rounded-full bg-orange-300 ml-1" />
						}
					/>
					<ListboxItem
						key="downtempo"
						title="Downtempo"
						startContent={
							<div className="w-2.5 h-2.5 rounded-full bg-green-300 ml-1" />
						}
					/>
				</ListboxSection>
			</Listbox>
		</div>

		<Dropzone />
	</div>
)

export default LeftNav
