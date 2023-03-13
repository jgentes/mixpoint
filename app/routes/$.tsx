import { useParams } from '@remix-run/react'
import InitialLoader from '~/components/InitialLoader'

const notFound = () => {
  const url = useParams()?.['*']
  return (
    <InitialLoader
      message={url == 'loader' ? '' : `Page not found at "${url}"`}
    />
  )
}

export { notFound as default }
