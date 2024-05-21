import {
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader
} from '@nextui-org/react'
import { useSnapshot } from 'valtio'
import { uiState } from '~/api/models/appState.client'
import { WarningIcon } from '~/components/icons'

const ConfirmModal = () => {
  const closeModal = () => {
    uiState.modal.openState = false
  }

  const {
    headerText = 'Are you sure?',
    bodyText = '',
    confirmColor = 'danger',
    confirmText = 'Confirm',
    onConfirm = () => closeModal(),
    onCancel = () => closeModal(),
    openState
  } = useSnapshot(uiState).modal

  return (
    <Modal
      aria-labelledby="alert-dialog-modal-title"
      aria-describedby="alert-dialog-modal-description"
      isOpen={openState || false}
      className="flex items-normal border-1 border-divider"
      onClose={() => closeModal()}
      backdrop="opaque"
    >
      <ModalContent role="alertdialog">
        <ModalHeader id="alert-dialog-modal-title">
          <WarningIcon className="self-center text-xl mr-2" />
          {headerText}
        </ModalHeader>
        <Divider className="my-1" />
        <ModalBody id="alert-dialog-modal-description">{bodyText}</ModalBody>
        <div className="flex gap-2 justify-end m-3">
          <Button
            variant="faded"
            color="default"
            size="sm"
            radius="sm"
            onClick={() => onCancel()}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            radius="sm"
            variant="flat"
            color={confirmColor}
            onClick={() => onConfirm()}
          >
            {confirmText}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}

export { ConfirmModal as default }
