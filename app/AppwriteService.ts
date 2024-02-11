import { Account, Client } from 'appwrite'

const APPWRITE_ENDPOINT = 'https://appwrite.mixpoint.dev/v1'
const APPWRITE_PROJECT_ID =
	(typeof document === 'undefined'
		? process.env.APPWRITE_PROJECT_ID
		: window?.ENV?.APPWRITE_PROJECT_ID) || 'appwrite-project-id'

// create a single instance of the appwrite client
const client = new Client()
client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID)
console.log('client:', APPWRITE_PROJECT_ID)
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
