import { notificationState } from '~/api/db/appState'

type Notification = {
	message?: string
	variant?: 'success' | 'error' | 'warning' | 'info'
}

const errorHandler = (error: Error | string) => {
	const err = typeof error === 'string' ? Error(error) : error

	console.error(err.message)

	window.dispatchEvent(
		new CustomEvent('notify', {
			detail: { message: err?.message, variant: 'error' }
		})
	)
}

export { errorHandler, notificationState }
export type { Notification }
