import Header from '~/components/layout/Header'
import Main from '~/components/layout/Main'

const Layout = () => (
  <div className="h-full flex flex-col graphBackground">
    <Header />
    <Main />
  </div>
)

export { Layout as default }
