"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Package,
  X,
  Receipt,
  CreditCard,
  Banknote,
  Apple,
  Loader2,
  User,
  Tag,
  Percent,
} from "lucide-react";
import { formatCLP } from "@/lib/format";
import { toast } from "sonner";
import { createSale } from "@/lib/actions/sales";
import { PaymentDialog } from "./payment-dialog";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  categoryId: string;
  categoryName: string;
  unit: string;
  price: number;
  taxRate: number;
  totalStock: number;
};

type Category = { id: string; name: string };
type Customer = { id: string; name: string; balance: number };

const unitLabels: Record<string, string> = {
  UNIDAD: "un", KILO: "kg", GRAMO: "g", LITRO: "L",
  PACK: "pack", CAJA: "cja", MANOJO: "manojo", MALLA: "malla",
};

export function POSClient({
  products,
  categories,
  customers,
  cashSession,
}: {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  cashSession: { openAmount: number; openedAt: string } | null;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [mobileView, setMobileView] = useState<"products" | "cart">("products");
  const searchRef = useRef<HTMLInputElement>(null);

  const {
    items,
    discount,
    customer,
    activeTicketId,
    tickets,
    switchTicket,
    addTicket,
    removeTicket,
    addItem,
    removeItem,
    updateQuantity,
    incrementItem,
    decrementItem,
    setItemDiscount,
    setDiscount,
    setCustomer,
    clear,
    getSubtotal,
    getItemsDiscount,
    getTax,
    getTotal,
    getItemCount,
  } = useCartStore();

  const ticketCounts = useMemo(
    () => tickets.map((t) => t.items.reduce((sum, i) => sum + i.quantity, 0)),
    [tickets]
  );

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F1") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setSearch("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }
    if (search.trim()) {
      const s = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.sku?.toLowerCase().includes(s) ||
          p.barcode?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [products, selectedCategory, search]);

  const filteredCustomers = useMemo(
    () => customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase())),
    [customers, customerSearch]
  );

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && search.trim()) {
      const term = search.toLowerCase().trim();
      const exact = products.find(
        (p) =>
          p.barcode?.toLowerCase() === term ||
          p.sku?.toLowerCase() === term ||
          p.name.toLowerCase() === term
      );
      if (exact) {
        handleAddToCart(exact);
        setSearch("");
      }
    }
  }

  function handleAddToCart(product: Product) {
    if (product.totalStock <= 0) {
      toast.error(`${product.name} sin stock`);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      stock: product.totalStock,
      taxRate: product.taxRate,
      categoryName: product.categoryName,
      sku: product.sku || undefined,
    });
  }

  async function handleCompleteSale(
    method: "EFECTIVO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA" | "CREDITO_CLIENTE",
    cashReceived?: number,
    cashChange?: number
  ) {
    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    // Si es crédito a cliente, debe haber cliente seleccionado
    if (method === "CREDITO_CLIENTE" && !customer) {
      toast.error("Selecciona un cliente para venta a crédito");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createSale({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.price,
          discount: i.discount,
        })),
        paymentMethod: method,
        cashReceived: cashReceived || null,
        cashChange: cashChange || null,
        discountTotal: discount,
        taxTotal: getTax(),
        customerId: customer?.id || null,
        customerName: customer?.name || null,
      });

      toast.success(`Venta #${result.ticketNumber} registrada`, {
        description: `Total: ${formatCLP(result.total)}`,
        action: {
          label: "Ver ticket",
          onClick: () => window.open(`/ventas/${result.id}`, "_blank"),
        },
      });

      clear();
      setPaymentOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al registrar la venta");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="h-full flex flex-col lg:flex-row bg-muted/20 relative">
      {/* Bloqueo si no hay caja abierta */}
      {!cashSession && (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-6 mb-2">
            <svg className="h-16 w-16 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Caja cerrada</h2>
          <p className="text-muted-foreground max-w-sm">
            Debes abrir la caja antes de poder realizar ventas. Ingresa el monto inicial para comenzar el turno.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Volver al dashboard
              </Link>
            </Button>
            <Button asChild size="lg" className="shadow-lg shadow-primary/20">
              <Link href="/cierre-caja/abrir">
                Abrir caja
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* IZQUIERDA: PRODUCTOS */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        !cashSession && "pointer-events-none opacity-40",
        "lg:flex",
        mobileView !== "products" ? "hidden" : "flex"
      )}>
        <div className="border-b border-border bg-card p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                type="search"
                placeholder="Buscar producto, SKU o escanear código de barras (F1)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 h-11 text-base"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="font-medium">{filteredProducts.length}</span>
              <span>productos</span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <Button size="sm" variant={selectedCategory === "all" ? "default" : "outline"} onClick={() => setSelectedCategory("all")} className="shrink-0">
              Todas
            </Button>
            {categories.map((cat) => (
              <Button key={cat.id} size="sm" variant={selectedCategory === cat.id ? "default" : "outline"} onClick={() => setSelectedCategory(cat.id)} className="shrink-0">
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 sm:p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {filteredProducts.map((product) => {
                  const inCart = items.find((i) => i.productId === product.id);
                  const outOfStock = product.totalStock <= 0;
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleAddToCart(product)}
                      disabled={outOfStock}
                      className={cn(
                        "group relative flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left transition-all",
                        "hover:border-primary hover:shadow-md hover:shadow-primary/5",
                        inCart && "border-primary bg-primary/5 ring-1 ring-primary/20",
                        outOfStock && "opacity-50 cursor-not-allowed hover:border-border hover:shadow-none"
                      )}
                    >
                      {inCart && (
                        <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          {inCart.quantity}
                        </Badge>
                      )}
                      <div className="flex w-full items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{product.categoryName}</p>
                        </div>
                        <Apple className="h-4 w-4 text-primary/40 shrink-0" />
                      </div>
                      <div className="flex w-full items-end justify-between mt-1">
                        <p className="text-base font-bold text-primary">{formatCLP(product.price)}</p>
                        <p className="text-[10px] text-muted-foreground">/{unitLabels[product.unit] || product.unit}</p>
                      </div>
                      <p className={cn(
                        "text-[10px]",
                        outOfStock ? "text-destructive font-medium" : product.totalStock <= 5 ? "text-orange-600" : "text-muted-foreground"
                      )}>
                        Stock: {product.totalStock} {outOfStock && "— Agotado"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* DERECHA: CARRITO */}
      <div className={cn(
        "lg:w-96 border-t lg:border-t-0 lg:border-l border-border bg-card flex-col",
        "lg:flex",
        mobileView !== "cart" ? "hidden" : "flex",
        "flex-1 lg:flex-initial"
      )}>
        {/* Tickets tabs */}
        <div className="flex items-center border-b border-border overflow-x-auto shrink-0">
          {tickets.map((t, i) => {
            const active = t.id === activeTicketId;
            return (
              <div key={t.id} className="flex items-center shrink-0">
                <button
                  onClick={() => switchTicket(t.id)}
                  className={cn(
                    "py-2.5 px-3 text-sm font-semibold transition-colors relative whitespace-nowrap",
                    active
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    T{i + 1}
                    {ticketCounts[i] > 0 && (
                      <Badge variant={active ? "default" : "outline"} className="rounded-full text-[10px] h-4 min-w-4 px-1">
                        {ticketCounts[i]}
                      </Badge>
                    )}
                  </span>
                  {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
                {tickets.length > 1 && (
                  <button
                    onClick={() => removeTicket(t.id)}
                    className="mr-1 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                    title={`Cerrar Ticket ${i + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={addTicket}
            className="shrink-0 py-2.5 px-2 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border-l border-border"
            title="Nuevo ticket"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Carrito</h2>
            {getItemCount() > 0 && <Badge variant="default" className="rounded-full">{getItemCount()}</Badge>}
          </div>
          {items.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clear} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Vaciar</span>
            </Button>
          )}
        </div>

        {/* Cliente */}
        <div className="px-4 py-2 border-b border-border bg-muted/20">
          {customer ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{customer.name}</p>
                  {(customer.balance || 0) > 0 && (
                    <p className="text-xs text-orange-600">Deuda: {formatCLP(customer.balance || 0)}</p>
                  )}
                </div>
              </div>
              <Button size="icon-xs" variant="ghost" onClick={() => setCustomer(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setCustomerDialogOpen(true)} className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              Asignar cliente (opcional)
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="rounded-full bg-muted p-4 mb-3">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">Carrito vacío</p>
              <p className="text-xs text-muted-foreground mt-1">Toca un producto para agregarlo</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {items.map((item) => (
                <Card key={item.productId} className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight line-clamp-2">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCLP(item.price)} / {unitLabels[item.unit] || item.unit}
                      </p>
                    </div>
                    <Button size="icon-xs" variant="ghost" onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 border border-border rounded-md">
                      <Button size="icon-xs" variant="ghost" onClick={() => decrementItem(item.productId)} className="h-7 w-7">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v) && v > 0) updateQuantity(item.productId, v);
                        }}
                        className="h-7 w-12 text-center text-sm border-0 p-0 focus-visible:ring-0"
                      />
                      <Button size="icon-xs" variant="ghost" onClick={() => incrementItem(item.productId)} disabled={item.quantity >= item.stock} className="h-7 w-7">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-semibold text-sm">
                      {formatCLP(item.price * item.quantity - item.discount)}
                    </p>
                  </div>
                  {item.discount > 0 && (
                    <p className="text-[10px] text-green-600 mt-1">Desc: -{formatCLP(item.discount)}</p>
                  )}
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      const v = prompt("Descuento en $:", item.discount.toString());
                      if (v !== null) setItemDiscount(item.productId, parseFloat(v) || 0);
                    }}
                    className="text-[10px] h-5 mt-1 px-1"
                  >
                    <Tag className="h-2.5 w-2.5 mr-0.5" /> Aplicar descuento
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totales */}
        <div className="border-t border-border p-4 space-y-3 bg-muted/30">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCLP(getSubtotal())}</span>
            </div>
            {getItemsDiscount() > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desc. ítems</span>
                <span>-{formatCLP(getItemsDiscount())}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desc. global</span>
                <span>-{formatCLP(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA (19%)</span>
              <span>{formatCLP(getTax())}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL</span>
              <span className="text-primary">{formatCLP(getTotal())}</span>
            </div>
          </div>

          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setDiscountDialogOpen(true)} className="flex-1">
              <Percent className="h-3 w-3 mr-1" />
              {discount > 0 ? formatCLP(discount) : "Descuento"}
            </Button>
          </div>

          <Button
            size="lg"
            disabled={items.length === 0 || isSubmitting}
            onClick={() => setPaymentOpen(true)}
            className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...</>
            ) : (
              <><Receipt className="mr-2 h-5 w-5" /> COBRAR {getTotal() > 0 && formatCLP(getTotal())}</>
            )}
          </Button>
        </div>
      </div>

      {/* Diálogo selección de cliente */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar cliente</DialogTitle>
            <DialogDescription>Para ventas a crédito o registro de cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="Buscar cliente..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              autoFocus
            />
            <div className="border border-border rounded-md max-h-64 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No se encontraron clientes</p>
              ) : (
                filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setCustomer(c); setCustomerDialogOpen(false); setCustomerSearch(""); }}
                    className="w-full text-left p-2 hover:bg-muted flex justify-between items-center"
                  >
                    <p className="font-medium text-sm">{c.name}</p>
                    {c.balance > 0 && (
                      <Badge variant="outline" className="text-xs">Deuda: {formatCLP(c.balance)}</Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerDialogOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo descuento global */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Descuento global</DialogTitle>
            <DialogDescription>Aplica un descuento al total de la venta</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Monto del descuento</Label>
            <Input
              type="number"
              min="0"
              step="any"
              defaultValue={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              autoFocus
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Subtotal actual: {formatCLP(getSubtotal() - getItemsDiscount())}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDiscount(0); setDiscountDialogOpen(false); }}>Quitar</Button>
            <Button onClick={() => setDiscountDialogOpen(false)}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={getTotal()}
        onConfirm={handleCompleteSale}
        isSubmitting={isSubmitting}
        requireCustomer={!customer}
      />

      {/* Mobile toggle bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card">
        <button
          onClick={() => setMobileView("products")}
          className={cn(
            "flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2",
            mobileView === "products"
              ? "text-primary bg-primary/5 border-t-2 border-primary"
              : "text-muted-foreground"
          )}
        >
          <Package className="h-4 w-4" />
          Productos
        </button>
        <button
          onClick={() => setMobileView("cart")}
          className={cn(
            "flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2",
            mobileView === "cart"
              ? "text-primary bg-primary/5 border-t-2 border-primary"
              : "text-muted-foreground"
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          Carrito
          {getItemCount() > 0 && (
            <Badge variant="default" className="rounded-full text-[10px] h-4 min-w-4 px-1">
              {getItemCount()}
            </Badge>
          )}
        </button>
      </div>
    </div>
  );
}
