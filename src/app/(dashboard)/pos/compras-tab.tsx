"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Package, Plus, Search, Loader2, X, Truck, Phone, Mail, User, MapPin,
  ShoppingCart, FileText, CheckCircle, Ban, ChevronRight,
} from "lucide-react";
import { formatCLP, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getSuppliers, createSupplier, updateSupplier,
  getPurchases, getPurchaseById, createPurchase, receivePurchase, cancelPurchase,
} from "@/lib/actions/suppliers";
import { getProducts } from "@/lib/actions/products";
import { getWarehouses } from "@/lib/actions/warehouses";

type Supplier = { id: string; name: string; contactName: string | null; phone: string | null; email: string | null; address: string | null; _count?: { purchases: number } };
type Product = { id: string; name: string; priceCost: number; totalStock: number; unit: string };
type Warehouse = { id: string; name: string };
type Purchase = {
  id: string; supplier: { name: string }; warehouse: { name: string };
  total: number; status: string; notes: string | null;
  createdAt: string; _count?: { items: number };
};
type PurchaseDetail = Purchase & {
  supplier: { name: string; contactName: string | null; phone: string | null };
  warehouse: { name: string };
  items: { id: string; product: { name: string; unit: string }; quantity: number; unitCost: number; subtotal: number }[];
};

type SubTab = "ordenes" | "nueva" | "proveedores";

const SUB_TABS: { id: SubTab; label: string; icon: typeof Package }[] = [
  { id: "ordenes", label: "Órdenes", icon: FileText },
  { id: "nueva", label: "Nueva compra", icon: Plus },
  { id: "proveedores", label: "Proveedores", icon: Truck },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pendiente", cls: "bg-orange-500/10 text-orange-700" },
  RECEIVED: { label: "Recibida", cls: "bg-green-500/10 text-green-700" },
  CANCELLED: { label: "Cancelada", cls: "bg-muted" },
};

export function ComprasTab() {
  const [subTab, setSubTab] = useState<SubTab>("ordenes");

  return (
    <div className="h-full flex flex-col bg-muted/20">
      <div className="flex items-center border-b border-border bg-card overflow-x-auto shrink-0">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)} className={cn(
              "py-2 px-3 text-xs font-semibold transition-colors relative whitespace-nowrap border-r border-border flex items-center gap-1.5",
              subTab === t.id ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}>
              <Icon className="h-3.5 w-3.5" />{t.label}
              {subTab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {subTab === "ordenes" && <OrdenesPanel />}
        {subTab === "nueva" && <NuevaCompraPanel />}
        {subTab === "proveedores" && <ProveedoresPanel />}
      </div>
    </div>
  );
}

function OrdenesPanel() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadData(); }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getPurchases({ status: statusFilter || undefined, pageSize: 50 });
      const data = result.purchases || [];
      setPurchases(data.map((p: any) => ({
        id: p.id, total: p.total, status: p.status, notes: p.notes,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
        supplier: p.supplier, warehouse: p.warehouse, _count: p._count,
      })));
    } catch (err: any) { toast.error("Error al cargar"); }
    finally { setLoading(false); }
  }

  async function loadDetail(id: string) {
    setDetailLoading(true);
    try {
      const data = await getPurchaseById(id);
      if (!data) { setDetail(null); return; }
      setDetail({
        id: data.id, total: data.total, status: data.status, notes: data.notes,
        createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : data.createdAt,
        supplier: data.supplier as any, warehouse: data.warehouse as any,
        items: (data as any).items?.map((it: any) => ({
          id: it.id, quantity: it.quantity, unitCost: it.unitCost, subtotal: it.subtotal,
          product: it.product,
        })) || [],
      });
    } catch {
      setDetail(null);
    }
    finally { setDetailLoading(false); }
  }

  async function handleReceive() {
    if (!selectedId) return;
    if (!confirm("¿Recibir mercadería? Se agregará al stock de la bodega.")) return;
    setActionLoading(true);
    try { await receivePurchase(selectedId); toast.success("Compra recibida"); loadData(); setDetail(null); }
    catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(false); }
  }

  async function handleCancel() {
    if (!selectedId) return;
    if (!confirm("¿Cancelar esta orden?")) return;
    setActionLoading(true);
    try { await cancelPurchase(selectedId); toast.success("Compra cancelada"); loadData(); setDetail(null); }
    catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(false); }
  }

  if (loading || actionLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="font-semibold">Órdenes de compra</h2>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-7 px-2 rounded-md border border-input bg-background text-xs">
          <option value="">Todos</option>
          <option value="PENDING">Pendientes</option>
          <option value="RECEIVED">Recibidas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </div>
      {purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><ShoppingCart className="h-10 w-10 mb-2" /><p className="text-sm">Sin órdenes</p></div>
      ) : (
        <Table><TableHeader><TableRow>
          <TableHead>OC #</TableHead><TableHead>Proveedor</TableHead><TableHead>Bodega</TableHead>
          <TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Items</TableHead>
          <TableHead className="hidden md:table-cell">Fecha</TableHead>
        </TableRow></TableHeader><TableBody>
          {purchases.map((p) => (
            <TableRow key={p.id} className={cn("cursor-pointer", selectedId === p.id && "bg-primary/5")} onClick={() => { setSelectedId(selectedId === p.id ? null : p.id); if (selectedId !== p.id) loadDetail(p.id); else setDetail(null); }}>
              <TableCell className="font-mono text-xs">#{p.id.substring(0, 8)}</TableCell>
              <TableCell className="text-sm">{p.supplier?.name}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.warehouse?.name}</TableCell>
              <TableCell className="text-right font-semibold text-sm">{formatCLP(p.total)}</TableCell>
              <TableCell><Badge className={cn("text-xs", STATUS_MAP[p.status]?.cls)}>{STATUS_MAP[p.status]?.label || p.status}</Badge></TableCell>
              <TableCell className="text-right text-xs text-muted-foreground hidden sm:table-cell">{p._count?.items || 0}</TableCell>
              <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{formatDateTime(p.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      {detailLoading && <Loader2 className="h-4 w-4 animate-spin mt-4" />}
      {detail && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Detalle OC #{detail.id.substring(0, 8)}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Proveedor</p><p className="font-medium">{detail.supplier.name}</p>{detail.supplier.phone && <p className="text-xs text-muted-foreground">{detail.supplier.phone}</p>}</div>
              <div><p className="text-xs text-muted-foreground">Bodega</p><p className="font-medium">{detail.warehouse.name}</p></div>
              <div><p className="text-xs text-muted-foreground">Total</p><p className="font-bold text-primary">{formatCLP(detail.total)}</p></div>
            </div>
            <Table><TableHeader><TableRow>
              <TableHead>Producto</TableHead><TableHead className="text-right">Cant</TableHead><TableHead className="text-right">Costo un.</TableHead><TableHead className="text-right">Subtotal</TableHead>
            </TableRow></TableHeader><TableBody>
              {detail.items.map((item) => (
                <TableRow key={item.id}><TableCell className="text-sm">{item.product.name}</TableCell><TableCell className="text-right text-sm">{item.quantity}</TableCell><TableCell className="text-right text-sm">{formatCLP(item.unitCost)}</TableCell><TableCell className="text-right font-semibold text-sm">{formatCLP(item.subtotal)}</TableCell></TableRow>
              ))}
            </TableBody></Table>
            {detail.status === "PENDING" && (
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={handleCancel}><Ban className="h-3.5 w-3.5 mr-1" />Cancelar</Button>
                <Button size="sm" onClick={handleReceive} className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-3.5 w-3.5 mr-1" />Recibir mercadería</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NuevaCompraPanel() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: string; unitCost: string }[]>([]);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, w, p] = await Promise.all([getSuppliers(), getWarehouses(), getProducts()]);
      setSuppliers(s.map((sup: any) => ({ id: sup.id, name: sup.name, contactName: sup.contactName, phone: sup.phone, email: sup.email, address: sup.address, _count: sup._count })));
      setWarehouses(w.map((wh: any) => ({ id: wh.id, name: wh.name })));
      setProducts(p.map((pr: any) => ({ id: pr.id, name: pr.name, priceCost: pr.priceCost, totalStock: pr.totalStock, unit: pr.unit })));
    } catch (err: any) { toast.error("Error al cargar"); }
    finally { setLoading(false); }
  }

  const filteredProducts = productSearch ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 15) : [];

  function addItem(productId: string) {
    const p = products.find((pr) => pr.id === productId);
    if (!p || items.find((i) => i.productId === productId)) return;
    setItems([...items, { productId: p.id, productName: p.name, quantity: "1", unitCost: p.priceCost.toString() }]);
    setProductSearch("");
  }

  function updateItem(idx: number, field: string, value: string) {
    const newItems = [...items];
    (newItems[idx] as any)[field] = value;
    setItems(newItems);
  }

  function removeItem(idx: number) { setItems(items.filter((_, i) => i !== idx)); }

  const total = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitCost) || 0), 0);

  async function handleSubmit() {
    if (!selectedSupplier) { toast.error("Selecciona un proveedor"); return; }
    if (!selectedWarehouse) { toast.error("Selecciona una bodega"); return; }
    if (items.length === 0) { toast.error("Agrega al menos un producto"); return; }
    setSubmitting(true);
    try {
      await createPurchase({
        supplierId: selectedSupplier, warehouseId: selectedWarehouse,
        notes: notes || null,
        items: items.map((i) => ({ productId: i.productId, quantity: parseFloat(i.quantity), unitCost: parseFloat(i.unitCost) })),
      });
      toast.success("Orden de compra creada");
      setSelectedSupplier(""); setSelectedWarehouse(""); setNotes(""); setItems([]);
      router.refresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-4 max-w-2xl space-y-4">
      <h2 className="font-semibold">Nueva orden de compra</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Proveedor *</Label>
          <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="">Seleccionar...</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Bodega *</Label>
          <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="">Seleccionar...</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notas</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Factura, número de guía..." className="h-9 text-sm" />
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Buscar producto para agregar..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        {productSearch && filteredProducts.length > 0 && (
          <div className="absolute z-10 top-full mt-1 w-full border border-border bg-popover rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filteredProducts.map((p) => (
              <button key={p.id} onClick={() => addItem(p.id)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex justify-between">
                <span>{p.name}</span>
                <span className="text-xs text-muted-foreground">Costo: {formatCLP(p.priceCost)} · Stock: {p.totalStock}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <>
          <Table><TableHeader><TableRow>
            <TableHead>Producto</TableHead><TableHead className="w-16">Cant</TableHead><TableHead className="w-24">Costo un.</TableHead><TableHead className="w-24">Subtotal</TableHead><TableHead className="w-8"></TableHead>
          </TableRow></TableHeader><TableBody>
            {items.map((item, idx) => {
              const qty = parseFloat(item.quantity || "0"), cost = parseFloat(item.unitCost || "0");
              return (
                <TableRow key={item.productId}>
                  <TableCell className="text-sm">{item.productName}</TableCell>
                  <TableCell><Input type="number" min="0.1" step="any" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} className="h-7 text-sm" /></TableCell>
                  <TableCell><Input type="number" min="0" step="any" value={item.unitCost} onChange={(e) => updateItem(idx, "unitCost", e.target.value)} className="h-7 text-sm" /></TableCell>
                  <TableCell className="text-sm font-semibold">{formatCLP(qty * cost)}</TableCell>
                  <TableCell><Button size="icon-xs" variant="ghost" onClick={() => removeItem(idx)}><X className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody></Table>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{items.length} productos</span>
            <span className="text-lg font-bold text-primary">{formatCLP(total)}</span>
          </div>
        </>
      )}
      <Button onClick={handleSubmit} disabled={submitting || items.length === 0} className="w-full" size="lg">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Crear orden de compra
      </Button>
    </div>
  );
}

function ProveedoresPanel() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", contactName: "", phone: "", email: "", address: "" });
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data.map((s: any) => ({ id: s.id, name: s.name, contactName: s.contactName, phone: s.phone, email: s.email, address: s.address, _count: s._count })));
    } catch (err: any) { toast.error("Error al cargar"); }
    finally { setLoading(false); }
  }

  function handleNew() { setForm({ name: "", contactName: "", phone: "", email: "", address: "" }); setEditId(null); setShowForm(true); }
  function handleEdit(s: Supplier) { setForm({ name: s.name, contactName: s.contactName || "", phone: s.phone || "", email: s.email || "", address: s.address || "" }); setEditId(s.id); setShowForm(true); }

  async function handleSubmit() {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSubmitting(true);
    try {
      if (editId) { await updateSupplier(editId, form); toast.success("Proveedor actualizado"); }
      else { await createSupplier(form); toast.success("Proveedor creado"); }
      setShowForm(false); router.refresh(); loadData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  }

  const filtered = search ? suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())) : suppliers;

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold">Proveedores ({suppliers.length})</h2>
        <Button size="sm" onClick={handleNew}><Plus className="h-3.5 w-3.5 mr-1" />Nuevo</Button>
      </div>
      <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Buscar proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" /></div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Truck className="h-10 w-10 mb-2" /><p className="text-sm">Sin proveedores</p></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((s) => (
            <Card key={s.id} className="shadow-none">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-sm flex items-center justify-between">
                {s.name}
                <Badge variant="outline" className="text-xs">{s._count?.purchases || 0} compras</Badge>
              </CardTitle></CardHeader>
              <CardContent className="p-3 pt-0 space-y-1">
                {s.contactName && <p className="text-xs flex items-center gap-1 text-muted-foreground"><User className="h-3 w-3" />{s.contactName}</p>}
                {s.phone && <p className="text-xs flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{s.phone}</p>}
                {s.email && <p className="text-xs flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{s.email}</p>}
                {s.address && <p className="text-xs flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" />{s.address}</p>}
                <Button size="xs" variant="ghost" onClick={() => handleEdit(s)} className="mt-1 text-xs">Editar</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>{editId ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></div>
            <div className="space-y-1.5"><Label>Persona de contacto</Label><Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>Cancelar</Button><Button onClick={handleSubmit} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editId ? "Guardar" : "Crear"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
