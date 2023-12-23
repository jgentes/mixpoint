import { Button, Modal, ModalContent } from '@nextui-org/react'
import { useOutletContext } from '@remix-run/react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { SupabaseClient } from '@supabase/supabase-js'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { appState } from '~/api/db/appState'

const LoginButton = () => {
	const [openAuth, setOpenAuth] = useState(false)
	const { supabase } = useOutletContext<{ supabase: SupabaseClient }>()
	const { theme } = useTheme()

	const [loggedIn] = appState.loggedIn()
	const buttonText = loggedIn ? 'Log Out' : 'Log In'

	return (
		<>
			<Button
				id="login-button"
				size="sm"
				radius="sm"
				className="border-1 border-primary-300 text-primary-700 font-semibold"
				variant="light"
				color="primary"
				title={loggedIn || buttonText}
				onClick={async () => {
					loggedIn ? await supabase.auth.signOut() : setOpenAuth(true)
				}}
			>
				{buttonText}
			</Button>
			<Modal
				isOpen={openAuth}
				className="p-6"
				size="xs"
				onClose={() => setOpenAuth(false)}
			>
				<ModalContent className="bg-background">
					<Auth
						supabaseClient={supabase}
						appearance={{
							theme: ThemeSupa,
							variables: {
								default: {
									colors: {
										brand: '#0059b2',
										brandAccent: '#003fb2'
									}
								}
							}
						}}
						providers={['google', 'github']}
						socialLayout="horizontal"
						theme={theme === 'dark' ? 'dark' : 'light'}
					/>
				</ModalContent>
			</Modal>
		</>
	)
}

export default LoginButton
