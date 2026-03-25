import { useReducer, useCallback } from 'react'

const initialState = {
  link: { open: false, data: null },
  image: { open: false, data: null },
  table: { open: false, data: null },
  embed: { open: false, data: null },
  findReplace: { open: false, data: null },
  source: { open: false, data: null },
  attachment: { open: false, data: null },
  importDocument: { open: false, data: null },
  export: { open: false, data: null },
}

// Task 254: Replace useState object with useReducer for more efficient updates
function modalReducer(state, action) {
  switch (action.type) {
    case 'OPEN':
      return { ...state, [action.name]: { open: true, data: action.data } }
    case 'CLOSE':
      return { ...state, [action.name]: { open: false, data: null } }
    default:
      return state
  }
}

export function useModal() {
  const [modals, dispatch] = useReducer(modalReducer, initialState)

  const openModal = useCallback((name, data = null) => {
    dispatch({ type: 'OPEN', name, data })
  }, [])

  const closeModal = useCallback((name) => {
    dispatch({ type: 'CLOSE', name })
  }, [])

  const isOpen = useCallback((name) => modals[name]?.open || false, [modals])
  const getData = useCallback((name) => modals[name]?.data || null, [modals])

  return { modals, openModal, closeModal, isOpen, getData }
}
