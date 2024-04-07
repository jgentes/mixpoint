import { Button, Progress } from '@nextui-org/react'
import { WarningIcon } from '~/components/icons'
import Logo from '~/components/layout/MixpointLogo'

const ProgressBar = ({ message }: { message?: string }) => (
  <Progress
    size="sm"
    radius="sm"
    aria-label={message || 'Loading...'}
    isIndeterminate={!message}
    value={100}
    classNames={{
      indicator: 'bg-gradient-to-r from-pink-500 to-yellow-500'
    }}
  />
)

const InitialLoader = ({ message }: { message?: string }) => {
  return (
    <div
      aria-busy={!message}
      className="fixed top-0 left-0 w-screen h-screen flex justify-center items-center text-xs z-50"
    >
      {!message ? null : (
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-12"
          onClick={() => {
            window.location.href = '/'
          }}
        >
          Go Back
        </Button>
      )}
      <div style={{ minWidth: '190px', maxWidth: '30%' }}>
        <div className="flex pb-1">
          <Logo />
          {!message ? null : <WarningIcon className="self-center text-xl" />}
        </div>
        <ProgressBar message={message} />
        <p className="pt-1">{message || 'Loading...'}</p>
      </div>
    </div>
  )
}

export { InitialLoader, ProgressBar }
