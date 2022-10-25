const Events = {
  on(event: string, callback: Function) {
    window.addEventListener(event, (e: CustomEventInit) => callback(e.detail))
  },
  emit(event: string, data?: any) {
    window.dispatchEvent(new CustomEvent(event, { detail: data }))
  },
  off(event: string, callback: any) {
    window.removeEventListener(event, callback)
  },
}

export { Events }
