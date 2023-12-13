import { argosScreenshot } from '@argos-ci/playwright'
import { test } from '@playwright/test'

const baseUrl = 'http://localhost:8788'
const pages = [{ name: 'homepage', path: '/' }] // add more pages here as needed

test('screenshot pages', async ({ page }, workerInfo) => {
	for (const { name, path } of pages) {
		const browserName = workerInfo.project.name
		await page.goto(`${baseUrl}${path}`)
		await page.waitForTimeout(2500) // wait for loader screen
		await argosScreenshot(page, `${name}-${browserName}`)
	}
})
