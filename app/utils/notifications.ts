import { H } from '@highlight-run/remix/client'
import toast from 'react-hot-toast'

const errorHandler = (error: Error | string) => {
  const err = typeof error === 'string' ? Error(error) : error
  console.error(error)
  toast.error(err?.message)
  H.consumeError(err)
}

export { errorHandler }
