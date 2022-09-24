import { useColorScheme, IconButton } from '@mui/joy'
import { useState, useEffect } from 'react'
import { DarkModeRounded, LightModeRounded } from '@mui/icons-material'

//const light = new URL('../assets/light.mp3', import.meta.url)

export const DarkMode: React.FunctionComponent = () => {
  const { mode, setMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) {
    return <IconButton size="sm" variant="outlined" color="primary" />
  }
  return (
    <IconButton
      id="toggle-mode"
      size="sm"
      variant="outlined"
      color="primary"
      onClick={() => {
        //new Audio(light.href).play()
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
