import { ClientOnly } from 'remix-utils'
import { useColorScheme, IconButton } from '@mui/joy'
import { DarkModeRounded, LightModeRounded } from '@mui/icons-material'

export default function DarkMode() {
  const { mode, setMode } = useColorScheme()

  const DarkModeButton = () => (
    <IconButton
      id="toggle-mode"
      size="sm"
      variant="outlined"
      color="primary"
      onClick={() => {
        new Audio('/light.mp3').play()
        setMode(mode === 'dark' ? 'light' : 'dark')
      }}
    >
      {mode === 'light' ? <DarkModeRounded /> : <LightModeRounded />}
    </IconButton>
  )

  return (
    <ClientOnly
      fallback={
        <IconButton variant="outlined" color="primary" size="sm"></IconButton>
      }
    >
      {() => <DarkModeButton />}
    </ClientOnly>
  )
}
