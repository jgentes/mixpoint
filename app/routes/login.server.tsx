import { createCookie } from '@remix-run/node'
import { LoaderArgs } from '@remix-run/node'
import * as setCookie from 'set-cookie-parser'

export const action = async ({ request }: any) => {
	try {
		const response = await fetch(
			`${AppwriteEndpoint}/account/sessions/anonymous`,
			{
				method: 'POST',
				headers: {
					'x-appwrite-project': AppwriteProject
				}
			}
		)

		const json = await response.json()

		if (json.code >= 400) {
			return new Response(
				JSON.stringify({
					message: json.message
				}),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
		}

		const ssrHostname =
			SsrHostname === 'localhost' ? SsrHostname : '.' + SsrHostname
		const appwriteHostname =
			AppwriteHostname === 'localhost'
				? AppwriteHostname
				: '.' + AppwriteHostname

		const cookiesStr = (response.headers.get('set-cookie') ?? '')
			.split(appwriteHostname)
			.join(ssrHostname)

		const headers = new Headers()

		headers.append('Set-Cookie', cookiesStr)
		headers.append('Content-Type', 'application/json')

		return new Response(JSON.stringify(json), {
			status: 200,
			headers
		})
	} catch (err: any) {
		return new Response(
			JSON.stringify({
				message: err.message
			}),
			{
				status: 400,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}
