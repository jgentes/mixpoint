import { Listbox, ListboxItem, ListboxSection } from '@nextui-org/react'
import { AnimationIcon, JoinIcon, LensIcon } from '~/components/icons'

import Dropzone from '~/components/tracks/Dropzone'

const LeftNav = () => (
	<div className="h-full flex flex-col p-0.5 border-r border-default justify-between bg-primary">
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
						className="h-10"
						startContent={<LensIcon className="text-xl text-blue-400 w-8" />}
					>
						Tracks
					</ListboxItem>
					<ListboxItem
						key="mixes"
						className="h-10"
						startContent={<JoinIcon className="text-3xl text-blue-400 w-8" />}
					>
						Mixes
					</ListboxItem>
					<ListboxItem
						key="sets"
						className="h-10"
						startContent={
							<AnimationIcon className="text-3xl text-blue-400 rotate-45 w-8" />
						}
					>
						Sets
					</ListboxItem>
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
						startContent={
							<div className="w-2.5 h-2.5 rounded-full bg-blue-300 ml-1" />
						}
					>
						Electro
					</ListboxItem>
					<ListboxItem
						key="house"
						startContent={
							<div className="w-2.5 h-2.5 rounded-full bg-red-300 ml-1" />
						}
					>
						House
					</ListboxItem>
					<ListboxItem
						key="drum & bass"
						startContent={
							<div className="w-2.5 h-2.5 rounded-full bg-orange-300 ml-1" />
						}
					>
						Drum & Bass
					</ListboxItem>
					<ListboxItem
						key="downtempo"
						startContent={
							<div className="w-2.5 h-2.5 rounded-full bg-green-300 ml-1" />
						}
					>
						Downtempo
					</ListboxItem>
				</ListboxSection>
			</Listbox>
		</div>

		<Dropzone className="m-2" />
	</div>
)

export default LeftNav
