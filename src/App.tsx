//import AppLayout from './layout/layout'
import {
  EuiProvider,
  EuiIcon,
  EuiCode,
  EuiText,
  useEuiTheme,
} from '@elastic/eui'
import { db } from './db'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppLayout } from './layout/appLayout'

// styles
import './styles/icons'
import '@elastic/eui/dist/eui_theme_dark.css' // these will go away once eui transitions entirely to emotion rather than sass
import '@elastic/eui/dist/eui_theme_light.css' // https://github.com/elastic/eui/blob/main/wiki/consuming.md

const App = () => {
  const colorMode = useLiveQuery(
    (): Promise<boolean> => db.appState.get('darkMode')
  )
    ? 'dark'
    : 'light'

  return (
    <EuiProvider colorMode={colorMode}>
      <AppLayout />
    </EuiProvider>
  )
}

export default App
