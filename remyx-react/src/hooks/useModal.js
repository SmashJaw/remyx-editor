import { useState, useCallback } from 'react'

export function useModal() {
  const [modals, setModals] = useState({
    link: { open: false, data: null },
    image: { open: false, data: null },
    table: { open: false, data: null },
    embed: { open: false, data: null },
    findReplace: { open: false, data: null },
    source: { open: false, data: null },
    attachment: { open: false, data: null },
    importDocument: { open: false, data: null },
    export: { open: false, data: null },
  })

  const openModal = useCallback((name, data = null) => {
    setModals((prev) => ({
      ...prev,
      [name]: { open: true, data },
    }))
  }, [])

  const closeModal = useCallback((name) => {
    setModals((prev) => ({
      ...prev,
      [name]: { open: false, data: null },
    }))
  }, [])

  const isOpen = useCallback((name) => modals[name]?.open || false, [modals])
  const getData = useCallback((name) => modals[name]?.data || null, [modals])

  return { modals, openModal, closeModal, isOpen, getData }
}
