import { HandleError } from '@highlight-run/remix/server'
import { type EntryContext } from '@vercel/remix'
import { renderHeadToString } from 'remix-island'
import { Head } from './root'

import { PassThrough } from 'node:stream'

import { createReadableStreamFromReadable } from '@remix-run/node'
import { RemixServer } from '@remix-run/react'
import { isbot } from 'isbot'
import { PullstateProvider } from 'pullstate'
import { renderToPipeableStream } from 'react-dom/server'
import { pullState } from '~/api/db/appState'

const nodeOptions = {
  projectID: process.env.HIGHLIGHT_PROJECT_ID || 'hightlight-project-id'
}

export const handleError = HandleError(nodeOptions)

const ABORT_DELAY = 5_000

const appState = pullState.instantiate({ ssr: true })

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return isbot(request.headers.get('user-agent') || '')
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false

    const { pipe, abort } = renderToPipeableStream(
      <PullstateProvider instance={appState}>
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />
      </PullstateProvider>,
      {
        onAllReady() {
          shellRendered = true
          const head = renderHeadToString({ request, remixContext, Head })
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          )

          body.write(
            `<!DOCTYPE html><html><head>${head}</head><body><div id="root">`
          )
          pipe(body)
          body.write('</div></body></html>')
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          //biome-ignore lint/style/noParameterAssign: Remix template
          responseStatusCode = 500
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error)
          }
        }
      }
    )

    setTimeout(abort, ABORT_DELAY)
  })
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false

    const { pipe, abort } = renderToPipeableStream(
      <PullstateProvider instance={appState}>
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />
      </PullstateProvider>,
      {
        onShellReady() {
          shellRendered = true
          const head = renderHeadToString({ request, remixContext, Head })
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          )

          body.write(
            `<!DOCTYPE html><html><head>${head}</head><body><div id="root">`
          )
          pipe(body)
          body.write('</div></body></html>')
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          //biome-ignore lint/style/noParameterAssign: Remix template
          responseStatusCode = 500
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error)
          }
        }
      }
    )

    setTimeout(abort, ABORT_DELAY)
  })
}
