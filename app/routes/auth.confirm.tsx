import { type LoaderFunctionArgs, redirect } from '@remix-run/cloudflare'
import { createServerClient, parse, serialize } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function loader({ request, context }: LoaderFunctionArgs) {
	const requestUrl = new URL(request.url)
	const token_hash = requestUrl.searchParams.get('token_hash')
	const type = requestUrl.searchParams.get('type') as EmailOtpType | null
	const next = requestUrl.searchParams.get('next') || '/'
	const headers = new Headers()

	if (token_hash && type) {
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

		const { error } = await supabase.auth.verifyOtp({
			type,
			token_hash
		})

		if (error) {
			throw new Response(error.message, { status: 500 })
		}

		return redirect(next, { headers })
	}

	// return the user to an error page with instructions
	return redirect('/', { headers })
}

// this is necessary to render the errorboundary for some reason
const nullPage = () => null

export { nullPage as default }
