// from https://mui.com/joy-ui/guides/using-joy-ui-and-material-ui-together/
import { extendTheme as extendJoyTheme } from '@mui/joy/styles'
import {
	Theme,
	experimental_extendTheme as extendMuiTheme
} from '@mui/material/styles'
import { deepmerge } from '@mui/utils'

const muiTheme = extendMuiTheme({
	// This is required to point to `var(--joy-*)` because we are using `CssVarsProvider` from Joy UI.
	cssVarPrefix: 'joy',
	components: {
		MuiTable: {
			styleOverrides: {
				root: {
					borderCollapse: 'separate',
					borderSpacing: 0
				}
			}
		}
	}
})

const joyTheme = extendJoyTheme({
	components: {
		JoySheet: {
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor:
						theme.palette.mode === 'dark'
							? 'rgba(0, 30, 60, 0.2)'
							: 'rgba(255, 255, 255, 0.99)',
					backgroundImage:
						theme.palette.mode === 'dark'
							? darkGraphBackground
							: lightGraphBackground
				})
			}
		}
	},
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
					'900': '#003A75'
				},
				divider: '#E7EBF0',
				common: {
					black: '#1D1D1D',
					white: '#fff'
				},
				text: {
					primary: '#1A2027',
					secondary: '#3E5060'
				},
				error: {
					mainChannel: '#EB0014',
					lightChannel: '#FF99A2',
					darkChannel: '#C70011',
					contrastTextChannel: '#fff'
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
					'900': '#0F5C2E'
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
					'900': '#5A3600'
				},
				secondary: {
					mainChannel: '#9c27b0',
					lightChannel: '#ba68c8',
					darkChannel: '#7b1fa2',
					contrastTextChannel: '#fff'
				},
				background: {
					surface: '#fff',
					body: '#F0F7FF'
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
					activatedOpacity: 0.12
				}
			}
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
					'900': '#003A75'
				},
				divider: '#c2e0ff14',
				background: {
					body: '#001E3C',
					surface: '#0A1929'
				},
				common: {
					black: '#1D1D1D',
					white: '#fff'
				},
				text: {
					primary: '#fff',
					secondary: '#B2BAC2'
				},
				error: {
					mainChannel: '#EB0014',
					lightChannel: '#FF99A2',
					darkChannel: '#C70011',
					contrastTextChannel: '#fff'
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
					'900': '#0F5C2E'
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
					'900': '#5A3600'
				},
				secondary: {
					mainChannel: '#ce93d8',
					lightChannel: '#f3e5f5',
					darkChannel: '#ab47bc',
					contrastTextChannel: 'rgba(0, 0, 0, 0.87)'
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
					activatedOpacity: 0.24
				}
			}
		}
	},
	fontFamily: {
		display: 'Public Sans, system-ui',
		body: 'Public Sans, system-ui'
	}
})

const graphSvg = `%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

const darkGraphBackground = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23003A75' fill-opacity='0.2'${graphSvg}`

const lightGraphBackground = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23003A75' fill-opacity='0.04'${graphSvg}`

export const theme: Theme = deepmerge(muiTheme, joyTheme)
