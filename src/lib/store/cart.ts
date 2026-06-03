"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  stock: number;
  taxRate: number;
  categoryName?: string;
  sku?: string;
  discount: number;
};

type CustomerSummary = {
  id: string;
  name: string;
  balance?: number;
};

type Ticket = {
  id: string;
  items: CartItem[];
  discount: number;
  customer: CustomerSummary | null;
};

type CartStore = {
  tickets: Ticket[];
  activeTicketId: string;
  items: CartItem[];
  discount: number;
  customer: CustomerSummary | null;
  addTicket: () => void;
  removeTicket: (id: string) => void;
  switchTicket: (id: string) => void;
  addItem: (product: Omit<CartItem, "quantity" | "discount"> & { quantity?: number; discount?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  setItemDiscount: (productId: string, amount: number) => void;
  setDiscount: (amount: number) => void;
  setCustomer: (customer: CustomerSummary | null) => void;
  clear: () => void;
  getSubtotal: () => number;
  getItemsDiscount: () => number;
  getTotal: () => number;
  getTax: () => number;
  getItemCount: () => number;
};

let ticketCounter = 0;

function newTicket(id?: string): Ticket {
  return { id: id || `t${++ticketCounter}`, items: [], discount: 0, customer: null };
}

function calcItemNet(item: CartItem): number {
  if (item.taxRate <= 0) return item.price * item.quantity;
  return Math.round(item.price * item.quantity / (1 + item.taxRate / 100));
}

function calcItemTax(item: CartItem): number {
  if (item.taxRate <= 0) return 0;
  return Math.round(item.price * item.quantity - calcItemNet(item));
}

function syncFromTicket(ticket: Ticket): Pick<CartStore, "items" | "discount" | "customer"> {
  return {
    items: ticket.items,
    discount: ticket.discount,
    customer: ticket.customer,
  };
}

function activeTicket(state: CartStore): Ticket {
  return state.tickets.find((t) => t.id === state.activeTicketId) || state.tickets[0];
}

const initialTickets = [newTicket("1")];

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      tickets: initialTickets,
      activeTicketId: "1",
      ...syncFromTicket(initialTickets[0]),

      addTicket: () => {
        const t = newTicket();
        set((s) => {
          ticketCounter = Math.max(
            ticketCounter,
            ...s.tickets.map((tk) => {
              const n = parseInt(tk.id.replace(/\D/g, ""));
              return isNaN(n) ? 0 : n;
            })
          );
          return {
            tickets: [...s.tickets, t],
            activeTicketId: t.id,
            ...syncFromTicket(t),
          };
        });
      },

      removeTicket: (id) => {
        const state = get();
        if (state.tickets.length <= 1) return;
        const idx = state.tickets.findIndex((t) => t.id === id);
        const newTickets = state.tickets.filter((t) => t.id !== id);
        let nextActive = state.activeTicketId;
        if (id === state.activeTicketId) {
          const newIdx = Math.min(idx, newTickets.length - 1);
          nextActive = newTickets[newIdx].id;
        }
        const nextTicket = newTickets.find((t) => t.id === nextActive) || newTickets[0];
        set({
          tickets: newTickets,
          activeTicketId: nextActive,
          ...syncFromTicket(nextTicket),
        });
      },

      switchTicket: (id) => {
        const state = get();
        const ticket = state.tickets.find((t) => t.id === id);
        if (!ticket) return;
        set({ activeTicketId: id, ...syncFromTicket(ticket) });
      },

      addItem: (product) => {
        const state = get();
        const ticket = { ...activeTicket(state) };
        const existing = ticket.items.find((i) => i.productId === product.productId);
        if (existing) {
          const newQty = existing.quantity + (product.quantity || 1);
          if (newQty > product.stock) return;
          ticket.items = ticket.items.map((i) =>
            i.productId === product.productId ? { ...i, quantity: newQty } : i
          );
        } else {
          if ((product.quantity || 1) > product.stock) return;
          ticket.items = [
            ...ticket.items,
            {
              productId: product.productId,
              name: product.name,
              price: product.price,
              unit: product.unit,
              stock: product.stock,
              quantity: product.quantity || 1,
              taxRate: product.taxRate,
              categoryName: product.categoryName,
              sku: product.sku,
              discount: product.discount || 0,
            },
          ];
        }
        set({
          tickets: state.tickets.map((t) => (t.id === state.activeTicketId ? ticket : t)),
          ...syncFromTicket(ticket),
        });
      },

      removeItem: (productId) => {
        const state = get();
        const ticket = { ...activeTicket(state) };
        ticket.items = ticket.items.filter((i) => i.productId !== productId);
        set({
          tickets: state.tickets.map((t) => (t.id === state.activeTicketId ? ticket : t)),
          ...syncFromTicket(ticket),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const state = get();
        const ticket = { ...activeTicket(state) };
        const item = ticket.items.find((i) => i.productId === productId);
        if (item && quantity > item.stock) return;
        ticket.items = ticket.items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        );
        set({
          tickets: state.tickets.map((t) => (t.id === state.activeTicketId ? ticket : t)),
          ...syncFromTicket(ticket),
        });
      },

      incrementItem: (productId) => {
        const state = get();
        const ticket = { ...activeTicket(state) };
        const item = ticket.items.find((i) => i.productId === productId);
        if (item) {
          if (item.quantity + 1 > item.stock) return;
          ticket.items = ticket.items.map((i) =>
            i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
          );
          set({
            tickets: state.tickets.map((t) => (t.id === state.activeTicketId ? ticket : t)),
            ...syncFromTicket(ticket),
          });
        }
      },

      decrementItem: (productId) => {
        const state = get();
        const ticket = { ...activeTicket(state) };
        const item = ticket.items.find((i) => i.productId === productId);
        if (item) {
          if (item.quantity <= 1) {
            ticket.items = ticket.items.filter((i) => i.productId !== productId);
          } else {
            ticket.items = ticket.items.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
            );
          }
          set({
            tickets: state.tickets.map((t) => (t.id === state.activeTicketId ? ticket : t)),
            ...syncFromTicket(ticket),
          });
        }
      },

      setItemDiscount: (productId, amount) => {
        const state = get();
        const ticket = { ...activeTicket(state) };
        ticket.items = ticket.items.map((i) =>
          i.productId === productId ? { ...i, discount: Math.max(0, amount) } : i
        );
        set({
          tickets: state.tickets.map((t) => (t.id === state.activeTicketId ? ticket : t)),
          ...syncFromTicket(ticket),
        });
      },

      setDiscount: (amount) => {
        const state = get();
        const ticket = { ...activeTicket(state) };
        ticket.discount = Math.max(0, amount);
        set({
          tickets: state.tickets.map((t) => (t.id === state.activeTicketId ? ticket : t)),
          ...syncFromTicket(ticket),
        });
      },

      setCustomer: (customer) => {
        const state = get();
        const ticket = { ...activeTicket(state) };
        ticket.customer = customer;
        set({
          tickets: state.tickets.map((t) => (t.id === state.activeTicketId ? ticket : t)),
          ...syncFromTicket(ticket),
        });
      },

      clear: () => {
        const state = get();
        const ticket = newTicket(state.activeTicketId);
        set({
          tickets: state.tickets.map((t) => (t.id === state.activeTicketId ? ticket : t)),
          ...syncFromTicket(ticket),
        });
      },

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + calcItemNet(i), 0),

      getItemsDiscount: () =>
        get().items.reduce((sum, i) => sum + i.discount, 0),

      getTax: () =>
        get().items.reduce((sum, i) => sum + calcItemTax(i), 0),

      getTotal: () => {
        const st = get();
        const subtotal = st.items.reduce((sum, i) => sum + calcItemNet(i), 0);
        const itemsDiscount = st.items.reduce((sum, i) => sum + i.discount, 0);
        const tax = st.items.reduce((sum, i) => sum + calcItemTax(i), 0);
        const base = subtotal - itemsDiscount;
        return Math.max(0, base + tax - st.discount);
      },

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "fruteria-cart",
      partialize: (state) => ({
        tickets: state.tickets,
        activeTicketId: state.activeTicketId,
        items: state.items,
        discount: state.discount,
        customer: state.customer,
      }),
    }
  )
);
