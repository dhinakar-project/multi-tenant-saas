import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import { useTicketStore } from '../store/useTicketStore'
import { notify } from '../utils/toast'

export function useTicketSocket(tenantId) {
  const clientRef = useRef(null)
  const { updateTicketStatus } = useTicketStore()

  useEffect(() => {
    if (!tenantId) return

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'

    const client = new Client({
      webSocketFactory: () => new SockJS(`${apiBase}/ws`),
      onConnect: () => {
        console.log('[WebSocket] Connected to tenant channel:', tenantId)
        client.subscribe(`/topic/tenant/${tenantId}/tickets`, (msg) => {
          try {
            const data = JSON.parse(msg.body)
            if (data.type === 'STATUS_CHANGE') {
              updateTicketStatus(data.ticketId, data.newStatus)
              notify.success(`🔄 Ticket #${data.ticketId?.substring(0, 8)} → ${data.newStatus}`)
            }
          } catch (e) {
            console.error('[WebSocket] Failed to parse message:', e)
          }
        })
      },
      onDisconnect: () => console.log('[WebSocket] Disconnected'),
      onStompError: (frame) => console.error('[WebSocket] STOMP error:', frame),
      reconnectDelay: 5000,
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [tenantId])
}
