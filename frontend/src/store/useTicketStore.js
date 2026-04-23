import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useTicketStore = create(devtools((set, get) => ({
  tickets: [],
  isLoading: false,
  error: null,
  filters: { status: 'all', priority: 'all', search: '' },

  setTickets: (tickets) => set({ tickets }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),

  get filteredTickets() {
    const { tickets, filters } = get()
    return tickets
      .filter(t => filters.status === 'all' || t.status === filters.status)
      .filter(t => filters.priority === 'all' || t.priority === filters.priority)
      .filter(t => !filters.search || t.title?.toLowerCase().includes(filters.search.toLowerCase()))
  },

  updateTicketStatus: (id, status) => set((s) => ({
    tickets: s.tickets.map(t => t.id === id ? { ...t, status } : t)
  })),

  addTicket: (ticket) => set((s) => ({ tickets: [ticket, ...s.tickets] })),
}), { name: 'TicketStore' }))
