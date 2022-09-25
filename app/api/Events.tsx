export const Events = {
  on(event: string, callback: Function) {
    window.addEventListener(event, (e: CustomEventInit) => callback(e.detail))
  },
  dispatch(event: string, data: any) {
    window.dispatchEvent(new CustomEvent(event, { detail: data }))
  },
  remove(event: string, callback: any) {
    window.removeEventListener(event, callback)
  },
}
