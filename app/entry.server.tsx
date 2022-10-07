import type { EntryContext } from '@remix-run/node'
import { RemixServer } from '@remix-run/react'
import ReactDOMServer from 'react-dom/server'

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const markup = ReactDOMServer.renderToString(
    <RemixServer context={remixContext} url={request.url} />
  )

  responseHeaders.set('Content-Type', 'text/html')
  //responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp')
  //responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin')

  return new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  })
}
