import { IconButton, Modal, ModalDialog } from '@mui/joy'
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
			<IconButton
				id="login-button"
				size="sm"
				sx={{ px: 1 }}
				variant="outlined"
				color="primary"
				title={loggedIn || buttonText}
				onClick={async () => {
					loggedIn ? await supabase.auth.signOut() : setOpenAuth(true)
				}}
			>
				{buttonText}
			</IconButton>
			<Modal open={openAuth} onClose={() => setOpenAuth(false)}>
				<ModalDialog sx={{ backgroundColor: 'background.surface' }}>
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
				</ModalDialog>
			</Modal>
		</>
	)
}

export default LoginButton
