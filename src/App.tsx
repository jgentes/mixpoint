//import AppLayout from './layout/layout'
import { EuiProvider, EuiThemeColorMode } from '@elastic/eui'
import { db } from './db'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppLayout } from './layout/appLayout'

// styles
import './styles/icons'
import '@elastic/eui/dist/eui_theme_dark.css' // these will go away once eui transitions entirely to emotion rather than sass
import '@elastic/eui/dist/eui_theme_light.css' // https://github.com/elastic/eui/blob/main/wiki/consuming.md

const App = () => {
  const colorMode = useLiveQuery(
    (): Promise<EuiThemeColorMode> => db.appState.get('colorMode')
  )

  return (
    <EuiProvider colorMode={colorMode}>
      <AppLayout />
    </EuiProvider>
  )
}

export default App
