import { useParams } from '@remix-run/react'
import { ErrorBoundary } from '~/root'

const notFound = () => {
	const url = useParams()?.['*']
	return ErrorBoundary(Error(`Page not found at "${url}"`))
}

export { notFound as default }
