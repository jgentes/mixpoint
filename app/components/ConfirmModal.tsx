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
import { superstate } from '@superstate/core'
import { useSuperState } from '@superstate/react'

interface ConfirmModalProps {
  openState?: boolean
  setOpenState?: Function
  headerText?: string
  bodyText?: string
  confirmColor?: ButtonProps['color']
  confirmText?: string
  onConfirm?: Function
  onCancel?: Function
}

const confirmModalState = superstate<ConfirmModalProps>({})

const ConfirmModal = () => {
  useSuperState(confirmModalState)

  const closeModal = () =>
    confirmModalState.set(prev => ({ ...prev, openState: false }))

  const {
    openState = false,
    headerText = 'Are you sure?',
    bodyText = '',
    confirmColor = 'danger',
    confirmText = 'Confirm',
    onConfirm = () => closeModal(),
    onCancel = () => closeModal(),
  } = confirmModalState.now()

  return (
    <Modal
      aria-labelledby="alert-dialog-modal-title"
      aria-describedby="alert-dialog-modal-description"
      open={openState}
      sx={{ alignItems: 'normal' }}
      onClose={() => closeModal()}
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
