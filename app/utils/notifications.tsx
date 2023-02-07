import { notificationState } from '~/api/appState'

type Notification = {
  message?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
}

const errorHandler = (error: Error | string) => {
  if (typeof error == 'string') error = Error(error)

  console.error(error.message)

  window.dispatchEvent(
    new CustomEvent('notify', {
      detail: { message: error?.message, variant: 'error' },
    })
  )
}

export type { Notification }
export { errorHandler, notificationState }
