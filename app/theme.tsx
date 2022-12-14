// from https://mui.com/joy-ui/guides/using-joy-ui-and-material-ui-together/
import { extendTheme as extendJoyTheme } from '@mui/joy/styles'
import {
  experimental_extendTheme as extendMuiTheme,
  Theme,
} from '@mui/material/styles'
import { deepmerge } from '@mui/utils'

const muiTheme = extendMuiTheme({
  // This is required to point to `var(--joy-*)` because we are using `CssVarsProvider` from Joy UI.
  cssVarPrefix: 'joy',
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%',
        },

        body: {
          margin: 0,
          height: '100%',
        },

        '.logoText': {
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 400,
          fontSize: '22px',
          margin: 0,
          background:
            'linear-gradient(60deg, hsl(0, 75%, 50%) 5%,hsl(260, 75%, 50%) 35%, hsl(200, 75%, 50%) 65%,hsl(220, 75%, 50%) 95%)',
          color: '#fff',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          WebkitTextStrokeWidth: 'thin',
          WebkitTextStrokeColor: 'rgb(255 255 255 / 35%)',
        },

        'tr:hover .visibleOnHover': {
          visibility: 'visible',
        },

        '.visibleOnHover': {
          visibility: 'hidden',
        },

        '.visible': {
          visibility: 'visible',
        },

        '.wavesurfer-playhead': {
          width: 0,
          height: 0,
          marginLeft: '4px',
          borderStyle: 'solid',
          borderWidth: '7px 7px 0 7px',
          borderColor: '#0492f7c1 transparent transparent transparent',
        },

        '.wavesurfer-playhead svg, .wavesurfer-playhead div': {
          display: 'none',
        },

        // '.wavesurfer-region': {
        //   borderLeft: '2px solid #0492f79e',
        // },

        '.MuiLinearProgress-bar': {
          // for the volume meter
          transition: 'none !important',
        },

        '.wavesurfer-marker': {
          marginLeft: '4px',
          borderLeft: '2px solid rgba(4, 146, 247, 0.757)',
          zIndex: 3,
        },

        '.wavesurfer-marker > *': {
          display: 'none !important',
        },

        '.zoomview-container > wave': {
          scrollbarColor: 'rgba(4, 146, 247, 0.5)transparent' /* track thumb */,
          scrollbarWidth: 'thin' /* none, thin, or auto */,

          '&::-webkit-scrollbar': {
            width: '20px',
          },

          '&::-webkit-scrollbar-corner, &::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },

          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(4, 146, 247, 0.5)',
            borderRadius: '20px',
            border: '6px solid transparent',
            backgroundClip: 'content-box',
            '&:hover': {
              backgroundColor: 'rgb(4, 146, 247)',
            },
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
      },
    },
  },
})

const joyTheme = extendJoyTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          '50': '#F0F7FF',
          '100': '#C2E0FF',
          '200': '#99CCF3',
          '300': '#66B2FF',
          '400': '#3399FF',
          '500': '#007FFF',
          '600': '#0072E5',
          '700': '#0059B2',
          '800': '#004C99',
          '900': '#003A75',
          main: '#007FFF',
          light: '#66B2FF',
          dark: '#0059B2',
          contrastText: '#fff',
        },
        divider: '#E7EBF0',
        common: {
          black: '#1D1D1D',
          white: '#fff',
        },
        text: {
          primary: '#1A2027',
          secondary: '#3E5060',
          disabled: 'rgba(0, 0, 0, 0.38)',
        },
        error: {
          mainChannel: '#EB0014',
          lightChannel: '#FF99A2',
          darkChannel: '#C70011',
          contrastTextChannel: '#fff',
        },
        success: {
          '50': '#E9FBF0',
          '100': '#C6F6D9',
          '200': '#9AEFBC',
          '300': '#6AE79C',
          '400': '#3EE07F',
          '500': '#21CC66',
          '600': '#1DB45A',
          '700': '#1AA251',
          '800': '#178D46',
          '900': '#0F5C2E',
          main: '#1AA251',
          light: '#6AE79C',
          dark: '#1AA251',
          contrastText: '#fff',
        },
        warning: {
          '50': '#FFF9EB',
          '100': '#FFF3C1',
          '200': '#FFECA1',
          '300': '#FFDC48',
          '400': '#F4C000',
          '500': '#DEA500',
          '600': '#D18E00',
          '700': '#AB6800',
          '800': '#8C5800',
          '900': '#5A3600',
          main: '#DEA500',
          light: '#FFDC48',
          dark: '#AB6800',
          contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        secondary: {
          mainChannel: '#9c27b0',
          lightChannel: '#ba68c8',
          darkChannel: '#7b1fa2',
          contrastTextChannel: '#fff',
        },
        info: {
          main: '#0288d1',
          light: '#03a9f4',
          dark: '#01579b',
          contrastText: '#fff',
        },
        background: {
          surface: '#fff',
          body: '#F0F7FF',
        },
        action: {
          active: 'rgba(0, 0, 0, 0.54)',
          hover: 'rgba(0, 0, 0, 0.04)',
          hoverOpacity: 0.04,
          selected: 'rgba(0, 0, 0, 0.08)',
          selectedOpacity: 0.08,
          disabled: 'rgba(0, 0, 0, 0.26)',
          disabledBackground: 'rgba(0, 0, 0, 0.12)',
          disabledOpacity: 0.38,
          focus: 'rgba(0, 0, 0, 0.12)',
          focusOpacity: 0.12,
          activatedOpacity: 0.12,
        },
      },
    },
    dark: {
      palette: {
        primary: {
          '50': '#F0F7FF',
          '100': '#C2E0FF',
          '200': '#99CCF3',
          '300': '#66B2FF',
          '400': '#3399FF',
          '500': '#007FFF',
          '600': '#0072E5',
          '700': '#0059B2',
          '800': '#004C99',
          '900': '#003A75',
          main: '#3399FF',
          light: '#66B2FF',
          dark: '#0059B2',
          contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        divider: 'rgba(194, 224, 255, 0.08)',
        background: {
          body: '#001E3C',
          surface: '#0A1929',
        },
        common: {
          black: '#1D1D1D',
          white: '#fff',
        },
        text: {
          primary: '#fff',
          secondary: '#B2BAC2',
          disabled: 'rgba(255, 255, 255, 0.5)',
        },
        error: {
          mainChannel: '#EB0014',
          lightChannel: '#FF99A2',
          darkChannel: '#C70011',
          contrastTextChannel: '#fff',
        },
        success: {
          '50': '#E9FBF0',
          '100': '#C6F6D9',
          '200': '#9AEFBC',
          '300': '#6AE79C',
          '400': '#3EE07F',
          '500': '#21CC66',
          '600': '#1DB45A',
          '700': '#1AA251',
          '800': '#178D46',
          '900': '#0F5C2E',
          main: '#1DB45A',
          light: '#6AE79C',
          dark: '#1AA251',
          contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        warning: {
          '50': '#FFF9EB',
          '100': '#FFF3C1',
          '200': '#FFECA1',
          '300': '#FFDC48',
          '400': '#F4C000',
          '500': '#DEA500',
          '600': '#D18E00',
          '700': '#AB6800',
          '800': '#8C5800',
          '900': '#5A3600',
          main: '#DEA500',
          light: '#FFDC48',
          dark: '#AB6800',
          contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        secondary: {
          mainChannel: '#ce93d8',
          lightChannel: '#f3e5f5',
          darkChannel: '#ab47bc',
          contrastTextChannel: 'rgba(0, 0, 0, 0.87)',
        },
        info: {
          main: '#29b6f6',
          light: '#4fc3f7',
          dark: '#0288d1',
          contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        action: {
          active: '#fff',
          hover: 'rgba(255, 255, 255, 0.08)',
          hoverOpacity: 0.08,
          selected: 'rgba(255, 255, 255, 0.16)',
          selectedOpacity: 0.16,
          disabled: 'rgba(255, 255, 255, 0.3)',
          disabledBackground: 'rgba(255, 255, 255, 0.12)',
          disabledOpacity: 0.38,
          focus: 'rgba(255, 255, 255, 0.12)',
          focusOpacity: 0.12,
          activatedOpacity: 0.24,
        },
      },
    },
  },
  fontFamily: {
    display: 'Public Sans, system-ui',
    body: 'Public Sans, system-ui',
  },
})

export const theme: Theme = deepmerge(muiTheme, joyTheme)
