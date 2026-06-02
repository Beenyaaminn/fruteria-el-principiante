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
  categoryName?: string;
  sku?: string;
  discount: number;
};

type CustomerSummary = {
  id: string;
  name: string;
  balance?: number;
};

type CartStore = {
  items: CartItem[];
  discount: number;
  customer: CustomerSummary | null;
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

const IVA_RATE = 0.19; // Chile

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,
      customer: null,

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === product.productId);

        if (existing) {
          const newQty = existing.quantity + (product.quantity || 1);
          if (newQty > product.stock) return;
          set({
            items: items.map((i) =>
              i.productId === product.productId ? { ...i, quantity: newQty } : i
            ),
          });
        } else {
          if ((product.quantity || 1) > product.stock) return;
          set({
            items: [
              ...items,
              {
                productId: product.productId,
                name: product.name,
                price: product.price,
                unit: product.unit,
                stock: product.stock,
                quantity: product.quantity || 1,
                categoryName: product.categoryName,
                sku: product.sku,
                discount: product.discount || 0,
              },
            ],
          });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const item = get().items.find((i) => i.productId === productId);
        if (item && quantity > item.stock) return;

        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },

      incrementItem: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        if (item) get().updateQuantity(productId, item.quantity + 1);
      },

      decrementItem: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        if (item) get().updateQuantity(productId, item.quantity - 1);
      },

      setItemDiscount: (productId, amount) => {
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, discount: Math.max(0, amount) } : i
          ),
        });
      },

      setDiscount: (amount) => {
        set({ discount: Math.max(0, amount) });
      },

      setCustomer: (customer) => {
        set({ customer });
      },

      clear: () => set({ items: [], discount: 0, customer: null }),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemsDiscount: () =>
        get().items.reduce((sum, i) => sum + i.discount, 0),

      getTax: () => {
        const subtotal = get().getSubtotal() - get().getItemsDiscount() - get().discount;
        return Math.max(0, Math.round(subtotal * IVA_RATE));
      },

      getTotal: () => {
        const subtotal = get().getSubtotal() - get().getItemsDiscount() - get().discount;
        return Math.max(0, subtotal + get().getTax());
      },

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "fruteria-cart",
      partialize: (state) => ({ items: state.items, discount: state.discount }),
    }
  )
);
