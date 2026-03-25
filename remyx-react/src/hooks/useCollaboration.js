import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * React hook for collaboration state.
 * Follows the useComments pattern — subscribes to collaboration events
 * on the engine's eventBus and provides reactive state.
 *
 * @param {Object|null} engine - EditorEngine instance (from onReady or useEditorEngine)
 * @returns {{ collaborators, connectionStatus, startCollaboration, stopCollaboration, localUser }}
 */
export function useCollaboration(engine) {
  const [collaborators, setCollaborators] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const unsubsRef = useRef([])

  useEffect(() => {
    if (!engine?.eventBus) return

    const refresh = () => {
      if (engine._collaboration) {
        setCollaborators(engine._collaboration.getCollaborators())
        setConnectionStatus(engine._collaboration.getConnectionStatus())
      }
    }

    refresh()

    const events = [
      'collab:userJoin',
      'collab:userLeave',
      'collab:connected',
      'collab:disconnected',
      'collab:sync',
    ]
    const unsubs = events.map(evt => engine.eventBus.on(evt, refresh))
    unsubsRef.current = unsubs

    return () => {
      for (const u of unsubsRef.current) u?.()
      unsubsRef.current = []
    }
  }, [engine])

  const startCollaboration = useCallback(() => {
    engine?._collaboration?.startCollaboration()
  }, [engine])

  const stopCollaboration = useCallback(() => {
    engine?._collaboration?.stopCollaboration()
  }, [engine])

  const localUser = engine?._collaboration
    ? {
        userId: engine._collaboration.userId,
        userName: engine._collaboration.userName,
        userColor: engine._collaboration.userColor,
      }
    : null

  return {
    collaborators,
    connectionStatus,
    startCollaboration,
    stopCollaboration,
    localUser,
  }
}
