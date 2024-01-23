/// <reference types="@remix-run/dev" />
/// <reference types="@vercel/remix" />

declare module '@remix-run/server-runtime' {
	export interface AppLoadContext {
		env: {
			SUPABASE_URL: string
			SUPABASE_ANON_KEY: string
		}
	}
}
