import { Client } from 'appwrite'

export const SSR_HOSTNAME: string = 'mixpoint.dev'
export const APPWRITE_HOSTNAME: string = `appwrite.${SSR_HOSTNAME}`

export const APPWRITE_ENDPOINT = `https://${APPWRITE_HOSTNAME}/v1`
export const APPWRITE_PROJECT = window.ENV.APPWRITE_PROJECT

const client = new Client()
client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT)

// const account = new Account(client)
// const avatars = new Avatars(client)

export const AppwriteService = {
	// signOut: async () => {
	// 	await account.deleteSession('current')
	// },
	// getAccount: async () => {
	// 	return await account.get<any>()
	// },
	// getAccountPicture: (name: string) => {
	// 	return avatars
	// 		.getInitials(name.split('').reverse().join(''), 256, 256)
	// 		.toString()
	// },
	setSession: (hash: string) => {
		const authCookies: any = {}
		authCookies[`a_session_${APPWRITE_PROJECT}`] = hash
		client.headers['X-Fallback-Cookies'] = JSON.stringify(authCookies)
	}
}
