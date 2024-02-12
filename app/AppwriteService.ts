import { Account, Client } from 'appwrite'

const isProd =
	typeof document === 'undefined'
		? process.env.VERCEL_ENV === 'production'
		: window?.ENV?.ENVIRONMENT === 'production'

const APPWRITE_ENDPOINT = `https://${
	isProd ? 'appwrite.mixpoint.dev' : 'cloud.appwrite.io'
}/v1`
const APPWRITE_PROJECT_ID =
	(typeof document === 'undefined'
		? process.env.APPWRITE_PROJECT_ID
		: window?.ENV?.APPWRITE_PROJECT_ID) || 'appwrite-project-id'

// create a single instance of the appwrite client
const client = new Client()
client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID)

const account = new Account(client)

const AppwriteService = {
	signOut: async () => {
		await account.deleteSession('current')
	},
	getAccount: async () => {
		return await account.get()
	},
	setSession: (hash: string) => {
		const authCookies: { [key: string]: string } = {}
		authCookies[`a_session_${APPWRITE_PROJECT_ID}`] = hash
		client.headers['X-Fallback-Cookies'] = JSON.stringify(authCookies)
	}
}

export { AppwriteService, account }
