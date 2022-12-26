import InitialLoader from '#/components/InitialLoader'
import { useParams } from '@remix-run/react'

const notFound = () => {
  const url = useParams()?.['*']
  return <InitialLoader message={`Page not found at "${url}"`} />
}

export { notFound as default }
