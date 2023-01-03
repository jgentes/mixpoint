const eventHandler = <T>() => ({
  on(trackId: number, callback: Function) {
    window.addEventListener(String(trackId), (e: CustomEventInit) =>
      callback(e.detail)
    )
  },
  emit(trackId: number, event: T, args?: any) {
    window.dispatchEvent(
      new CustomEvent(String(trackId), { detail: { event, args } })
    )
  },
  off(trackId: number, callback: any) {
    window.removeEventListener(String(trackId), callback)
  },
})

export { eventHandler }
