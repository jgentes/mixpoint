import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: './tests',
	/* Run tests in files in parallel */
	fullyParallel: true,

	// Setup recording option to enable test debugging features
	use: {
		// Setting to capture screenshot only when a test fails
		screenshot: 'only-on-failure',
		// Setting to retain traces only when a test fails
		trace: 'retain-on-failure'
	},

	// Add Argos reporter only when it runs on CI
	reporter: process.env.CI
		? [['list'], ['@argos-ci/playwright/reporter']]
		: 'list'
})
