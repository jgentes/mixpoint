import { WarningRounded } from '@mui/icons-material'
import { Box, Button, Modal, ModalDialog, Typography } from '@mui/joy'
import { Divider } from '@mui/material'
import { confirmModalState } from '~/api/appState'

const ConfirmModal = () => {
  const [confirmModal] = confirmModalState()
  const [openState, setOpenState] = confirmModalState.openState()

  const closeModal = () => setOpenState(false)

  const {
    headerText = 'Are you sure?',
    bodyText = '',
    confirmColor = 'danger',
    confirmText = 'Confirm',
    onConfirm = () => closeModal(),
    onCancel = () => closeModal(),
  } = confirmModal

  return (
    <Modal
      aria-labelledby="alert-dialog-modal-title"
      aria-describedby="alert-dialog-modal-description"
      open={openState || false}
      sx={{ alignItems: 'normal' }}
      onClose={() => closeModal()}
      disableEnforceFocus={true}
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
          <Button variant="plain" color="neutral" onClick={() => onCancel()}>
            Cancel
          </Button>
          <Button
            variant="solid"
            color={confirmColor}
            onClick={() => onConfirm()}
          >
            {confirmText}
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  )
}

export { ConfirmModal as default, confirmModalState }
