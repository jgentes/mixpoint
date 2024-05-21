import { nextui } from '@nextui-org/react'
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontSize: {
        '2xs': '0.625rem'
      }
    }
  },
  darkMode: 'class',
  plugins: [
    nextui({
      addCommonColors: true,
      themes: {
        light: {
          colors: {
            background: 'rgba(255, 255, 255, 0.5)',
            primary: {
              50: '#f0f7ff'
            }
          }
        },
        dark: {
          colors: {
            background: '#0e141a',
            primary: {
              50: '#0a1929'
            }
          }
        }
      }
    })
  ]
} satisfies Config
