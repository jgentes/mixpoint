import { Helmet } from 'react-helmet'
import favIcon32 from '../assets/soundwave-32.png'
import favIcon16 from '../assets/soundwave-16.png'

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

export const AppHelmet: React.FunctionComponent = () => (
  <Helmet>
    <meta charSet="utf-8" />
    <title>MixPoint</title>
    <meta
      name="description"
      content={'MixPoint is multi-track audio editor for the modern dj'}
    />
    {favIcons.map((favIcon, index) => (
      <link {...favIcon} key={index} />
    ))}
  </Helmet>
)
