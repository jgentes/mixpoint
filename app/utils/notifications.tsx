import { superstate } from '@superstate/core'

export const notification = superstate<Notification>({})

export type Notification = {
  message?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
}

export function errorHandler(error: any) {
  notification.set({
    message: error.message,
    variant: 'error',
  })
}
