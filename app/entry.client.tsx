import { RemixBrowser } from '@remix-run/react'
import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'

function hydrate() {
  startTransition(() => {
    hydrateRoot(
      // biome-ignore lint/style/noNonNullAssertion: from remix-island
      document.getElementById('root')!,
      <StrictMode>
        <RemixBrowser />
      </StrictMode>
    )
  })
}

if (typeof requestIdleCallback === 'function') {
  requestIdleCallback(hydrate)
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  setTimeout(hydrate, 1)
}
