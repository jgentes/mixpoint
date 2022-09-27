import { useEffect } from 'react'

type Props = {
  [key in keyof WindowEventMap]?: EventListenerOrEventListenerObject
}

// for keyboard shortcuts
export function useGlobalDOMEvents(props: Props) {
  useEffect(() => {
    for (let [key, func] of Object.entries(props)) {
      window.addEventListener(key, func, false)
    }
    return () => {
      for (let [key, func] of Object.entries(props)) {
        window.removeEventListener(key, func, false)
      }
    }
  }, [])
}

// ^^^ usage:
// export default function Drawer(props: DrawerProps) {
//   const { children, open, title, onClose } = props;
//   useGlobalDOMEvents({
//     keyup(ev: KeyboardEvent) {
//       if (ev.key === "Escape") {
//         onClose();
//       }
//     },
//   });

//   [...]
// }
