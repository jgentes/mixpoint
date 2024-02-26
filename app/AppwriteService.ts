import { Account, Client, ID } from 'appwrite'
import { Env } from '~/utils/env'

const APPWRITE_ENDPOINT = `https://${
	Env === 'preview' || Env === 'production'
		? 'appwrite.mixpoint.dev'
		: 'cloud.appwrite.io'
}/v1`

const APPWRITE_PROJECT_ID =
	(typeof document === 'undefined'
		? process.env.APPWRITE_PROJECT_ID
		: window?.ENV?.APPWRITE_PROJECT_ID) || 'appwrite-project-id'

// create a single instance of the appwrite client
const client = new Client()
client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID)

const account = new Account(client)

const Appwrite = {
	createGuestSession: async () => {
		console.log(APPWRITE_PROJECT_ID)
		await account.createAnonymousSession()
	},
	createOAuth2Session: (provider: 'google' | 'github') =>
		account.createOAuth2Session(
			provider,
			window.location.origin,
			window.location.origin
		),
	createMagicLink: async (email: string) =>
		await account.createMagicURLSession(
			ID.unique(),
			email,
			window.location.origin
		),
	updateMagicLink: async (userId: string, secret: string) =>
		await account.updateMagicURLSession(userId, secret),
	getUser: async () => await account.get(),
	getSession: async () => await account.getSession('current'),
	setSession: (hash: string) => {
		const authCookies: { [key: string]: string } = {}
		authCookies[`a_session_${APPWRITE_PROJECT_ID}`] = hash
		client.headers['X-Fallback-Cookies'] = JSON.stringify(authCookies)
	},
	refreshSession: async () => await account.updateSession('current'),
	signOut: async () => await account.deleteSession('current')
}

export { Appwrite, account }
