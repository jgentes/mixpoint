import { ClientOnly } from 'remix-utils'
import { useColorScheme, IconButton } from '@mui/joy'
import { DarkModeRounded, LightModeRounded } from '@mui/icons-material'

const DarkMode = () => {
  const { mode, setMode } = useColorScheme()

  const DarkModeButton = () => (
    <IconButton
      id="toggle-mode"
      size="sm"
      variant="outlined"
      color="primary"
      aria-label="Darkmode"
      onClick={() => {
        new Audio('/media/light.mp3').play()
        setMode(mode === 'dark' ? 'light' : 'dark')
      }}
    >
      {mode === 'light' ? <DarkModeRounded /> : <LightModeRounded />}
    </IconButton>
  )

  return (
    <ClientOnly
      fallback={
        <IconButton variant="outlined" color="primary" size="sm">
          <LightModeRounded />
        </IconButton>
      }
    >
      {() => <DarkModeButton />}
    </ClientOnly>
  )
}

export default DarkMode
