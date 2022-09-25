import { useColorScheme, IconButton } from '@mui/joy'
import { DarkModeRounded, LightModeRounded } from '@mui/icons-material'

export default function DarkMode() {
  const { mode, setMode } = useColorScheme()

  return (
    <IconButton
      id="toggle-mode"
      size="sm"
      variant="outlined"
      color="primary"
      onClick={() => {
        new Audio('/light.mp3').play()
        if (mode === 'light') {
          setMode('dark')
        } else {
          setMode('light')
        }
      }}
    >
      {mode === 'light' ? <DarkModeRounded /> : <LightModeRounded />}
    </IconButton>
  )
}
