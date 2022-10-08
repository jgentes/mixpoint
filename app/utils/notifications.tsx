import { superstate } from '@superstate/core'

const notificationState = superstate<Notification>({})

type Notification = {
  message?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
}

const errorHandler = (error: Error | string) => {
  if (typeof error == 'string') error = Error(error)

  notificationState.set({
    message: error.message,
    variant: 'error',
  })
}

export type { Notification }
export { errorHandler, notificationState }
