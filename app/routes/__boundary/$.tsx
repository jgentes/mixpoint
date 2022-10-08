import { useParams } from '@remix-run/react'
import InitialLoader from '~/components/InitialLoader'

const notFound = () => {
  const url = useParams()?.['*']
  return <InitialLoader message={`Page not found at "${url}"`} />
}

export { notFound as default }
