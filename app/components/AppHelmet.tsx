import { Helmet } from 'react-helmet'

export const AppHelmet: React.FunctionComponent = () => (
  <Helmet>
    <meta charSet="utf-8" />
    <title></title>
    <meta
      name="description"
      content={'Mixpoint is multi-track audio editor for the modern dj'}
    />
    <link rel="icon" type="image/png" href={favIcon32} sizes="32x32" />
    <link rel="icon" type="image/png" href={favIcon16} sizes="16x16" />
  </Helmet>
)
