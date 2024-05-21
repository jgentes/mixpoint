import {
  Button,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip
} from '@nextui-org/react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useSnapshot } from 'valtio'
import { Appwrite } from '~/AppwriteService'
import { uiState } from '~/api/models/appState.client'
import { GithubIcon, GoogleIcon } from '~/components/icons'
import { errorHandler } from '~/utils/notifications'

const LoginButton = () => {
  const { userEmail } = useSnapshot(uiState)
  const [email, setEmail] = useState('')
  const [modalState, setModalState] = useState(false)

  const buttonText = userEmail ? 'Log Out' : 'Log In'

  const useOAuth = (provider: 'google' | 'github') => {
    try {
      Appwrite.createOAuth2Session(provider)
    } catch (err) {
      errorHandler('Login failed')
    }
  }

  const sendMagicLink = async () => {
    try {
      await Appwrite.createMagicLink(email)
      setModalState(false)
      toast.success('Please check your email for the link to log in')
    } catch (err) {
      errorHandler('Magic Link failed')
    }
  }

  const deleteSession = async () => {
    try {
      await Appwrite.signOut()
      uiState.userEmail = ''
    } catch (err) {
      errorHandler('Logout failed')
    }
  }

  return (
    <>
      <Tooltip color="default" size="sm" content={userEmail || ''}>
        <Button
          id="auth-button"
          size="sm"
          radius="sm"
          className="border-1 border-primary-300 rounded text-primary-700 font-semibold"
          variant="light"
          color="primary"
          aria-label={buttonText}
          onClick={async () => {
            userEmail ? deleteSession() : setModalState(true)
          }}
        >
          {buttonText}
        </Button>
      </Tooltip>
      <Modal isOpen={modalState} size="lg" onClose={() => setModalState(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Log in</ModalHeader>
          <ModalBody>
            <div className="flex justify-between items-center">
              <Button
                className="flex-1 mr-6 border-1 border-primary-300"
                radius="sm"
                variant="ghost"
                color="default"
                size="md"
                startContent={<GoogleIcon />}
                onPress={() => useOAuth('google')}
              >
                Log in with Google
              </Button>
              <Button
                className="flex-1 ml-6 border-1 border-primary-300"
                radius="sm"
                variant="ghost"
                color="default"
                size="md"
                startContent={<GithubIcon />}
                onPress={() => useOAuth('github')}
              >
                Log in with GitHub
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <Divider className="flex-1" />
              <div className="px-4">OR</div>
              <Divider className="flex-1" />
            </div>
            <Input
              autoFocus
              label="Email"
              placeholder="Enter your email to receive a link to log in"
              variant="bordered"
              radius="sm"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {/* <Input
							label="Password"
							placeholder="Enter your password"
							type="password"
							variant="bordered"
							radius="sm"
						/> */}
            {/* <div className="flex py-2 px-1 justify-between">
							<Checkbox
								radius="sm"
								classNames={{
									label: 'text-small'
								}}
							>
								Remember me
							</Checkbox>
							<Link color="primary" href="#" size="sm">
								Forgot password?
							</Link>
						</div> */}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="faded"
              color="default"
              size="sm"
              radius="sm"
              onPress={() => setModalState(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              radius="sm"
              variant="flat"
              color="success"
              className="border-1 border-success-500"
              isDisabled={!email}
              onPress={sendMagicLink}
            >
              Log in
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default LoginButton
