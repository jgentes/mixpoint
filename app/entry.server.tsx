import { type EntryContext } from '@remix-run/cloudflare'
import { RemixServer } from '@remix-run/react'
import * as Sentry from '@sentry/remix'
import { renderHeadToString } from 'remix-island'
import { Head } from './root'

import { renderToReadableStream } from 'react-dom/server'

Sentry.init({
	dsn: 'https://6ea05bb5dd89aae9f5695090ecbee8bc@o4506276018192384.ingest.sentry.io/4506276020092928',
	tracesSampleRate: 0.1
})

export const handleError = Sentry.wrapRemixHandleError

export default function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext
) {
	return handleBrowserRequest(
		request,
		responseStatusCode,
		responseHeaders,
		remixContext
	)
}

async function handleBrowserRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext
) {
	const didError = false
	const readable = await renderToReadableStream(
		<RemixServer context={remixContext} url={request.url} />
	)

	responseHeaders.set('Content-Type', 'text/html')
	const stream = new ReadableStream({
		start(controller) {
			// Add the HTML head to the response
			const head = renderHeadToString({ request, remixContext, Head })
			controller.enqueue(
				new Uint8Array(
					new TextEncoder().encode(
						`<!DOCTYPE html><html><head>${head}</head><body><div id="root">`
					)
				)
			)

			const reader = readable.getReader()
			function read() {
				reader
					.read()
					.then(({ done, value }) => {
						if (done) {
							controller.enqueue(
								new Uint8Array(new TextEncoder().encode('</div></body></html>'))
							)
							controller.close()
							return
						}
						controller.enqueue(value)
						read()
					})
					.catch(error => {
						controller.error(error)
						readable.cancel()
					})
			}
			read()
		},
		cancel() {
			readable.cancel()
		}
	})

	return new Response(stream, {
		headers: responseHeaders,
		status: didError ? 500 : responseStatusCode
	})
}
