import Layout from '~/components/layout/Layout'
import { errorHandler } from '~/utils/notifications'

// detect mobile device
const userAgent = typeof window !== 'undefined' && window.navigator?.userAgent
if (
  userAgent &&
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ((/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) ||
    /android/i.test(userAgent))
) {
  setTimeout(
    () => errorHandler('Mixpoint is for desktops only (for now)'),
    2000
  )
}

const Index = () => <Layout />
export { Index as default }
