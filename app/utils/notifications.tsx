import { SnackbarProps } from '@mui/joy'

type Notification = {
	message: string
	color?: SnackbarProps['color']
}

const errorHandler = (error: Error | string) => {
	const err = typeof error === 'string' ? Error(error) : error

	console.error(err.message)

	window.dispatchEvent(
		new CustomEvent('notify', {
			detail: { message: err?.message, color: 'danger' }
		})
	)
}

export { errorHandler }
export type { Notification }
