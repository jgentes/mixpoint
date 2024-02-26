type Environments = 'development' | 'preview' | 'production'

declare global {
	interface Window {
		ENV: {
			HIGHLIGHT_PROJECT_ID: string
			APPWRITE_PROJECT_ID: string
			ENVIRONMENT: Environments
		}
	}
}

const Env =
	typeof document === 'undefined'
		? (process.env.VERCEL_ENV as Environments) || 'development'
		: window?.ENV?.ENVIRONMENT || 'development'

export { Env }
