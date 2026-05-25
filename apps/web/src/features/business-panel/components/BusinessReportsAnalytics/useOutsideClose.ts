import { useEffect, type RefObject } from 'react'

export function useOutsideClose(
  isOpen: boolean,
  ref: RefObject<HTMLElement>,
  onClose: () => void,
) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }

    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, ref])
}
