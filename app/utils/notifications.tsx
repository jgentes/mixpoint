import { notificationState } from '~/api/uiState'

//const [notification, setNotification] = notificationState()

type Notification = {
  message?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
}

const errorHandler = (error: Error | string) => {
  if (typeof error == 'string') error = Error(error)

  console.error(error)

  window.dispatchEvent(
    new CustomEvent('notify', {
      detail: { message: error.message, variant: 'error' },
    })
  )
}

export type { Notification }
export { errorHandler, notificationState }
