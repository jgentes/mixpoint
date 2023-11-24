import { useParams } from '@remix-run/react'
import { ErrorBoundary } from '~/errorBoundary'

const notFound = () => {
	const url = useParams()?.['*']
	return ErrorBoundary(Error(`Page not found at "${url}"`))
}

export { notFound as default }
