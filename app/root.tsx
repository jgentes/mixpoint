import { Scripts, Outlet } from '@remix-run/react'
import type { MetaFunction, LinksFunction } from '@remix-run/node'

import favIcon32 from './assets/soundwave-32.png'
import favIcon16 from './assets/soundwave-16.png'

export const meta: MetaFunction = () => {
  return {
    title: 'Mixpoint',
    description: 'Mixpoint is multi-track audio editor for the modern dj',
    charset: 'utf-8',
  }
}

export const links: LinksFunction = () => {
  return [
    {
      rel: 'icon',
      type: 'image/png',
      href: favIcon32,
      sizes: '32x32',
    },
    {
      rel: 'icon',
      type: 'image/png',
      href: favIcon16,
      sizes: '16x16',
    },
  ]
}

const App: React.FunctionComponent = () => (
  <html>
    <body>
      <div id="root">
        <Outlet />
      </div>
    </body>
    <Scripts />
  </html>
)

export default App
