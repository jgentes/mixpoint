import { H } from '@highlight-run/remix/client'
import toast from 'react-hot-toast'

const errorHandler = (error: Error | string, noToast?: boolean) => {
  const err = typeof error === 'string' ? Error(error) : error
  console.error(error)
  if (!noToast) toast.error(err?.message)
  H.consumeError(err)
}

export { errorHandler }
