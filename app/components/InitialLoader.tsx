import { Icon } from '@iconify-icon/react'
import { Button, Progress } from '@nextui-org/react'
import { CSSProperties } from 'react'
import Logo from '~/components/layout/MixpointLogo'

const loaderWrapper: CSSProperties = {
	top: 0,
	left: 0,
	width: '100vw',
	height: '100vh',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	fontSize: '12px',
	position: 'fixed',
	zIndex: 99999
}

const InitialLoader = ({ message }: { message?: string }) => {
	return (
		<div aria-busy={!message} style={loaderWrapper}>
			{!message ? null : (
				<Button
					variant="ghost"
					size="sm"
					className="fixed top-12"
					onClick={() => {
						window.location.href = '/'
					}}
				>
					Go Back
				</Button>
			)}
			<div style={{ minWidth: '190px', maxWidth: '30%' }}>
				<div className="flex pb-1">
					<Logo />
					{!message ? null : (
						<Icon icon="bx:error" height={23} className="self-center" />
					)}
				</div>
				<Progress
					size="sm"
					radius="sm"
					isIndeterminate={!message}
					value={100}
					classNames={{
						indicator: 'bg-gradient-to-r from-pink-500 to-yellow-500'
					}}
				/>
				<p className="pt-1">{message || 'Loading...'}</p>
			</div>
		</div>
	)
}

export default InitialLoader
