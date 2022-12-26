import ThemeLoader from '#/app/ThemeLoader'
import { Public_Sans } from '@next/font/google'

const publicSans = Public_Sans({ subsets: ['latin'] })

const App = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className={publicSans.className}>
    <body>
      <ThemeLoader>{children}</ThemeLoader>
    </body>
  </html>
)

export { App as default }
