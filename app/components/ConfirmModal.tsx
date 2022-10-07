import { WarningRounded } from '@mui/icons-material'
import {
  Box,
  Button,
  ButtonProps,
  Modal,
  ModalDialog,
  Typography,
} from '@mui/joy'
import { Divider } from '@mui/material'

export default function ConfirmModal({
  openState,
  setOpenState,
  headerText,
  bodyText,
  confirmColor,
  confirmText,
  clickHandler,
}: {
  openState: boolean
  setOpenState: Function
  headerText: string
  bodyText: string
  confirmColor: ButtonProps['color']
  confirmText: string
  clickHandler: Function
}): React.ReactElement {
  return (
    <Modal
      aria-labelledby="alert-dialog-modal-title"
      aria-describedby="alert-dialog-modal-description"
      open={openState}
      sx={{ alignItems: 'normal' }}
      onClose={() => setOpenState(false)}
    >
      <ModalDialog variant="outlined" role="alertdialog">
        <Typography
          id="alert-dialog-modal-title"
          component="h2"
          level="inherit"
          fontSize="1.25em"
          sx={{ display: 'flex', alignItems: 'normal' }}
          startDecorator={<WarningRounded />}
        >
          {headerText}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography
          id="alert-dialog-modal-description"
          textColor="text.tertiary"
          mb={3}
        >
          {bodyText}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            variant="plain"
            color="neutral"
            onClick={() => setOpenState(false)}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            color={confirmColor}
            onClick={() => clickHandler()}
          >
            {confirmText}
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  )
}
