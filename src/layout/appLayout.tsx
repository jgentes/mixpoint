import { Helmet } from 'react-helmet'
import { TopNavbar } from './topnav/topnavbar'

import favIcon32 from '../assets/soundwave-32px.jpg'
import favIcon16 from '../assets/soundwave-16px.jpg'
/*
window.onerror = msg =>
  Toaster.show({
    message: `Whoops! ${msg}`,
    intent: 'danger',
    icon: <Icon icon="warning-sign" />,
  })
window.onunhandledrejection = (e: PromiseRejectionEvent) =>
  Toaster.show({
    message: `Whoops! ${e.reason.message}`,
    intent: 'danger',
    icon: <WarningSign />,
  })
*/
const layoutStyle = { width: '90%', margin: '0 auto' }

const favIcons = [
  {
    rel: 'icon',
    type: 'image/jpg',
    sizes: '32x32',
    href: favIcon32,
  },
  {
    rel: 'icon',
    type: 'image/jpg',
    sizes: '16x16',
    href: favIcon16,
  },
]

export const AppLayout: React.FunctionComponent = props => (
  <>
    <Helmet>
      <meta charSet="utf-8" />
      <title>MixPoint</title>
      <meta
        name="description"
        content={'Multi-track audio editor designed for mixing dj sets'}
      />
      {favIcons.map((favIcon, index) => (
        <link {...favIcon} key={index} />
      ))}
    </Helmet>

    <TopNavbar layoutStyle={layoutStyle} />

    <div style={{ ...layoutStyle, padding: '15px 10px' }}>
      {/*props.children*/} Hello there
    </div>
  </>
)
