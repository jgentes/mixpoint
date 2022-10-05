import { superstate } from '@superstate/core'

export const notificationState = superstate<Notification>({})

export type Notification = {
  message?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
}

export function errorHandler(error: Error | string) {
  if (typeof error == 'string') error = Error(error)

  notificationState.set({
    message: error.message,
    variant: 'error',
  })
}
