import { Box, BoxProps, Paper } from '@mui/material'

const SidePane = (props: BoxProps) => (
  <Box
    className="Inbox"
    {...props}
    sx={[
      {
        bgcolor: 'background.surface',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: {
          xs: 'none',
          md: 'initial',
        },
      },
      ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
    ]}
  />
)

const Main = (props: BoxProps) => (
  <Box
    component="main"
    className="Main"
    {...props}
    sx={[{ p: 2 }, ...(Array.isArray(props.sx) ? props.sx : [props.sx])]}
  />
)

const SideDrawer = ({
  onClose,
  ...props
}: BoxProps & { onClose: React.MouseEventHandler<HTMLDivElement> }) => (
  <Box
    {...props}
    sx={[
      { position: 'fixed', zIndex: 1200, width: '100%', height: '100%' },
      ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
    ]}
  >
    <Box
      role="button"
      onClick={onClose}
      sx={{
        position: 'absolute',
        inset: 0,
        bgcolor: theme =>
          `rgba(${theme.vars.palette.neutral.darkChannel} / 0.8)`,
      }}
    />
    <Paper
      sx={{
        minWidth: 256,
        width: 'max-content',
        height: '100%',
        p: 2,
        boxShadow: 'lg',
        bgcolor: 'background.surface',
      }}
    >
      {props.children}
    </Paper>
  </Box>
)

export default {
  SidePane,
  SideDrawer,
  Main,
}