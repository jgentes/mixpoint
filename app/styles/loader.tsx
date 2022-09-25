const Loader = (props: {
  className?: string
  style?: Record<string, unknown>
}): JSX.Element => {
  return (
    <div className={`loader ${props.className}`} style={props.style}>
      <div className='bar1'></div>
      <div className='bar2'></div>
      <div className='bar3'></div>
      <div className='bar4'></div>
      <div className='bar5'></div>
      <div className='bar6'></div>
    </div>
  )
}

export default Loader
