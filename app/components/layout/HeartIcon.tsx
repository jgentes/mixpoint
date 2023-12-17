import { Icon } from '@iconify-icon/react'
import { CSSProperties, useState } from 'react'

const Heart: React.FunctionComponent = () => {
	const [isHovered, setIsHovered] = useState(false)

	const heartStyle = {
		color: isHovered ? 'red' : 'grey',
		fontSize: '16px'
	}

	const hideWrapStyle: CSSProperties = {
		position: 'fixed',
		bottom: '5px',
		right: '5px',
		cursor: 'default',
		display: 'flex',
		justifyContent: 'right',
		alignItems: 'center'
	}

	const hideStyle = {
		display: 'inline-block',
		fontSize: '13px',
		maxWidth: isHovered ? '100%' : '0%',
		verticalAlign: 'bottom',
		overflow: 'hidden',
		textWrap: 'nowrap',
		transition: 'max-width .5s ease-in-out'
	}

	return (
		<div
			style={hideWrapStyle}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div style={hideStyle}>Made with&nbsp;</div>
			<Icon style={heartStyle} icon="mdi:cards-heart-outline" />
			<div style={hideStyle}>&nbsp;in Oregon</div>
		</div>
	)
}

export { Heart as default }
