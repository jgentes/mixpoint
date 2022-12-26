'use client'

import { DarkModeRounded, LightModeRounded } from '@mui/icons-material'
import { IconButton, useColorScheme } from '@mui/joy'
import { Suspense } from 'react'

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
    <Suspense
      fallback={
        <IconButton variant="outlined" color="primary" size="sm">
          <LightModeRounded />
        </IconButton>
      }
    >
      <DarkModeButton />
    </Suspense>
  )
}

export default DarkMode
