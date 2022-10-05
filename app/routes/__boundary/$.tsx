import InitialLoader from '~/components/InitialLoader'
import { useParams } from '@remix-run/react'

export default function notFound() {
  const url = useParams()?.['*']
  return <InitialLoader message={`Page not found at "${url}"`} />
}
