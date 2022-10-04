import { superstate } from '@superstate/core'

export const notificationState = superstate<Notification>({})

export type Notification = {
  message?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
}

export function errorHandler(error: any) {
  notificationState.set({
    message: error.message,
    variant: 'error',
  })
}
