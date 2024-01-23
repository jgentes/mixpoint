import { type LoaderFunctionArgs, redirect } from '@vercel/remix'
import { createServerClient, parse, serialize } from '@supabase/ssr'

export async function loader({ request, context }: LoaderFunctionArgs) {
	const requestUrl = new URL(request.url)
	const code = requestUrl.searchParams.get('code')
	const next = requestUrl.searchParams.get('next') || '/'
	const headers = new Headers()

	if (code) {
		const cookies = parse(request.headers.get('Cookie') ?? '')

		const supabase = createServerClient(
			context.env.SUPABASE_URL || '',
			context.env.SUPABASE_ANON_KEY || '',
			{
				cookies: {
					get(key) {
						return cookies[key]
					},
					set(key, value, options) {
						headers.append('Set-Cookie', serialize(key, value, options))
					},
					remove(key, options) {
						headers.append('Set-Cookie', serialize(key, '', options))
					}
				}
			}
		)

		const { error } = await supabase.auth.exchangeCodeForSession(code)

		if (error) {
			throw Error(error.message)
		}

		return redirect(next, { headers })
	}

	// return the user to an error page with instructions
	return redirect('/auth/auth-code-error', { headers })
}

// for errorboundary
const AuthCallback = () => null
export { AuthCallback as default }
