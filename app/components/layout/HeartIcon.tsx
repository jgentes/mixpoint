import { useState } from 'react'
import { HeartIcon } from '~/components/icons'

const Heart: React.FunctionComponent = () => {
  const [isHovered, setIsHovered] = useState(false)

  const hideStyle = `inline-block text-xs ${
    isHovered ? 'max-w-full' : 'max-w-0'
  } align-bottom overflow-hidden whitespace-nowrap transition-max-width duration-500 ease-in-out`

  return (
    <div
      className="fixed bottom-2 right-2 cursor-default flex justify-end items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={hideStyle}>Made with&nbsp;</div>
      <HeartIcon
        className={isHovered ? 'text-red-500 text-lg' : 'text-gray-500 text-lg'}
      />
      <div className={hideStyle}>&nbsp;in Oregon</div>
    </div>
  )
}

export { Heart as default }
