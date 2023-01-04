const eventHandler = <T>() => ({
  on(event: number | string, callback: Function) {
    window.addEventListener(String(event), (e: CustomEventInit) =>
      callback(e.detail)
    )
  },
  emit(event: number | string, type: T, args?: any) {
    window.dispatchEvent(
      new CustomEvent(String(event), { detail: { type, args } })
    )
  },
  off(event: number | string, callback: any) {
    window.removeEventListener(String(event), callback)
  },
})

export { eventHandler }
