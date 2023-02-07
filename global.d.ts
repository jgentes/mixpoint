// from https://mui.com/joy-ui/guides/using-joy-ui-and-material-ui-together/
import { CssVarsThemeOptions } from '@mui/joy'
import { Theme as JoyTheme } from '@mui/joy/styles'
import {
  CommonColors,
  experimental_extendTheme as extendMuiTheme,
  Overlays,
  PaletteAlert,
  PaletteAppBar,
  PaletteAvatar,
  PaletteChip,
  PaletteColor,
  PaletteColorChannel,
  PaletteFilledInput,
  PaletteLinearProgress,
  PaletteSkeleton,
  PaletteSlider,
  PaletteSnackbarContent,
  PaletteSpeedDialAction,
  PaletteStepConnector,
  PaletteStepContent,
  PaletteSwitch,
  PaletteTableCell,
  PaletteTextChannel,
  PaletteTooltip,
  Shadows,
  TypeAction,
  TypeBackground,
  TypeText,
  ZIndex,
} from '@mui/material/styles'
import type {} from '@mui/material/themeCssVarsAugmentation'

type JoyComponents = CssVarsThemeOptions['components']

// extends Joy theme to include tokens from Material UI
declare module '@mui/joy/styles' {
  interface Palette {
    secondary: PaletteColorChannel
    error: PaletteColorChannel
    dividerChannel: string
    action: TypeAction
    Alert: PaletteAlert
    AppBar: PaletteAppBar
    Avatar: PaletteAvatar
    Chip: PaletteChip
    FilledInput: PaletteFilledInput
    LinearProgress: PaletteLinearProgress
    Skeleton: PaletteSkeleton
    Slider: PaletteSlider
    SnackbarContent: PaletteSnackbarContent
    SpeedDialAction: PaletteSpeedDialAction
    StepConnector: PaletteStepConnector
    StepContent: PaletteStepContent
    Switch: PaletteSwitch
    TableCell: PaletteTableCell
    Tooltip: PaletteTooltip
  }
  interface PalettePrimary extends PaletteColor {}
  interface PaletteInfo extends PaletteColor {}
  interface PaletteSuccess extends PaletteColor {}
  interface PaletteWarning extends PaletteColor {}
  interface PaletteCommon extends CommonColors {}
  interface PaletteText extends TypeText {}
  interface PaletteBackground extends TypeBackground {}

  interface ThemeVars {
    // attach to Joy UI `theme.vars`
    shadows: Shadows
    overlays: Overlays
    zIndex: ZIndex
  }
}

declare module '@mui/material/styles' {
  interface Theme {
    // put everything back to Material UI `theme.vars`
    vars: JoyTheme['vars']
  }
}
