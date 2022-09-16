// from https://mui.com/joy-ui/guides/using-joy-ui-and-material-ui-together/
import { deepmerge } from '@mui/utils'
import { experimental_extendTheme as extendMuiTheme } from '@mui/material/styles'
import { extendTheme as extendJoyTheme } from '@mui/joy/styles'
import { createTheme } from '@mui/material/styles'

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    code: true
    link: true
  }
}

export const onlyMui = createTheme({
  typography: {
    fontFamily: "'Public Sans', var(--joy-fontFamily-fallback)",
  },
  components: {
    MuiCssBaseline: {
      defaultProps: {
        enableColorScheme: true,
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableTouchRipple: true,
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        sizeLarge: {
          padding: '0.875rem 1rem',
          fontSize: '1rem',
          lineHeight: 1.3125,
          letterSpacing: 0,
          fontFamily:
            '"IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
          fontWeight: 700,
          scrollMarginTop: 'calc(var(--MuiDocs-header-height) + 32px)',
        },
        sizeSmall: {
          padding: '4px 8px',
          marginLeft: '-8px',
        },
        containedPrimary: {
          backgroundColor: '#007FFF',
          color: '#fff',
        },
      },
      variants: [
        {
          props: {
            variant: 'code',
          },
          style: {
            color: '#bdbdbd',
            border: '1px solid',
            borderColor: '#265D97',
            backgroundColor: '#132F4C',
            fontFamily:
              'Consolas,Menlo,Monaco,Andale Mono,Ubuntu Mono,monospace',
            fontWeight: 400,
            fontSize: '0.8125rem',
            lineHeight: 1.5,
            letterSpacing: 0,
            WebkitFontSmoothing: 'subpixel-antialiased',
            '&:hover, &.Mui-focusVisible': {
              borderColor: '#3399FF',
              backgroundColor: '#173A5E',
              '& .MuiButton-endIcon': {
                color: '#66B2FF',
              },
            },
            '& .MuiButton-startIcon': {
              color: '#bdbdbd',
            },
            '& .MuiButton-endIcon': {
              display: 'inline-block',
              position: 'absolute',
              right: 0,
              marginRight: 10,
              color: '#bdbdbd',
            },
          },
        },
        {
          props: {
            variant: 'link',
          },
          style: {
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#66B2FF',
            mb: 1,
            '& svg': {
              ml: -0.5,
            },
          },
        },
      ],
    },
    MuiIconButton: {
      variants: [
        {
          props: {
            color: 'primary',
          },
          style: {
            height: 34,
            width: 34,
            border: '1px solid #132F4C',
            borderRadius: 10,
            color: '#66B2FF',
            '&:hover': {
              borderColor: '#173A5E',
              background: 'rgba(19, 47, 76, 0.4)',
            },
          },
        },
      ],
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          minWidth: 160,
          color: '#B2BAC2',
          backgroundImage: 'none',
          backgroundColor: '#0A1929',
          border: '1px solid #132F4C',
          '& .MuiMenuItem-root': {
            fontSize: '0.875rem',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(19, 47, 76, 0.4)',
            },
            '&:focus': {
              backgroundColor: 'rgba(19, 47, 76, 0.4)',
            },
            '&.Mui-selected': {
              fontWeight: 500,
              color: '#66B2FF',
              backgroundColor: '#132F4C',
            },
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(194, 224, 255, 0.08)',
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'none',
      },
      styleOverrides: {
        root: {
          color: '#66B2FF',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          '&:hover': {
            color: '#99CCF3',
          },
          '&.MuiTypography-body1 > svg': {
            marginTop: 2,
          },
          '& svg:last-child': {
            marginLeft: 2,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        deleteIcon: {
          color: '#fff',
          '&:hover': {
            color: '#f5f5f5',
          },
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          padding: '8px',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          color: '#e0e0e0',
          borderRadius: 0,
          '&:hover': {
            backgroundColor: 'rgba(19, 47, 76, 0.4)',
          },
          '&.Mui-selected': {
            color: '#fff',
            borderRadius: 10,
            border: '1px solid',
            borderColor: '#0059B2 !important',
            backgroundColor: '#132F4C',
            '&:hover': {
              backgroundColor: '#173A5E',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        iconFilled: {
          top: 'calc(50% - .25em)',
        },
      },
    },
    MuiTab: {
      defaultProps: {
        disableTouchRipple: true,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0A1929',
          '&[href]': {
            textDecorationLine: 'none',
          },
        },
        outlined: {
          display: 'block',
          borderColor: '#1E4976',
          backgroundColor: '#132F4C',
          'a&, button&': {
            '&:hover': {
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.5)',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px 16px',
          borderColor: 'rgba(194, 224, 255, 0.08)',
        },
        head: {
          color: '#fff',
          fontWeight: 700,
        },
        body: {
          color: '#B2BAC2',
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A1929',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          color: '#e0e0e0',
          borderColor: '#1E4976',
          '&.Mui-selected': {
            color: '#fff',
            borderColor: '#0059B2 !important',
            backgroundColor: '#132F4C',
            '&:hover': {
              backgroundColor: '#173A5E',
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          padding: '5px 9px',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 32,
          height: 20,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            '&.Mui-checked': {
              transform: 'translateX(11px)',
              color: '#fff',
            },
          },
        },
        switchBase: {
          height: 20,
          width: 20,
          padding: 0,
          color: '#fff',
          '&.Mui-checked + .MuiSwitch-track': {
            opacity: 1,
          },
        },
        track: {
          opacity: 1,
          borderRadius: 32,
          backgroundColor: '#424242',
        },
        thumb: {
          flexShrink: 0,
          width: '14px',
          height: '14px',
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          color: '#e0e0e0',
          borderColor: '#1E4976',
          '&.Mui-selected': {
            color: '#fff',
            borderColor: '#0059B2 !important',
            backgroundColor: '#132F4C',
            '&:hover': {
              backgroundColor: '#173A5E',
            },
          },
        },
      },
    },
  },
  palette: {
    mode: 'dark',
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
      default: '#001E3C',
      paper: '#0A1929',
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
    grey: {
      '50': '#fafafa',
      '100': '#f5f5f5',
      '200': '#eeeeee',
      '300': '#e0e0e0',
      '400': '#bdbdbd',
      '500': '#9e9e9e',
      '600': '#757575',
      '700': '#616161',
      '800': '#424242',
      '900': '#212121',
      A100: '#f5f5f5',
      A200: '#eeeeee',
      A400: '#bdbdbd',
      A700: '#616161',
    },
    error: {
      '50': '#FFF0F1',
      '100': '#FFDBDE',
      '200': '#FFBDC2',
      '300': '#FF99A2',
      '400': '#FF7A86',
      '500': '#FF505F',
      '600': '#EB0014',
      '700': '#C70011',
      '800': '#94000D',
      '900': '#570007',
      main: '#EB0014',
      light: '#FF99A2',
      dark: '#C70011',
      contrastText: '#fff',
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
      main: '#ce93d8',
      light: '#f3e5f5',
      dark: '#ab47bc',
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    info: {
      main: '#29b6f6',
      light: '#4fc3f7',
      dark: '#0288d1',
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    contrastThreshold: 3,
    tonalOffset: 0.2,
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
  shape: {
    borderRadius: 10,
  },
  mixins: {
    toolbar: {
      minHeight: 56,
      '@media (min-width:0px)': {
        '@media (orientation: landscape)': {
          minHeight: 48,
        },
      },
      '@media (min-width:600px)': {
        minHeight: 64,
      },
    },
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
    '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
    '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
    '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
    '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
    '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
    '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
    '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
    '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
    '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
    '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
  ],
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
  },
  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
})

const muiTheme = extendMuiTheme({
  // This is required to point to `var(--joy-*)` because we are using `CssVarsProvider` from Joy UI.
  cssVarPrefix: 'joy',
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
          body: '#fff',
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
    display: "'Public Sans', var(--joy-fontFamily-fallback)",
    body: "'Public Sans', var(--joy-fontFamily-fallback)",
  },
})

export const theme = deepmerge(muiTheme, joyTheme)
