"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Wrench, AlertTriangle, FileText, History, BookOpen,
  Loader2, Search, Package, ArrowDown, ArrowUp, X,
} from "lucide-react";
import { formatCLP, formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getStockMovements, getWarehouses, createStockEntry, createStockAdjustment } from "@/lib/actions/warehouses";
import { getProducts } from "@/lib/actions/products";
import { getProductKardex, type KardexRow } from "@/lib/actions/kardex";

type SubTab = "agregar" | "ajustes" | "bajo-stock" | "reporte" | "movimientos" | "kardex";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  categoryName: string;
  unit: string;
  priceCost: number;
  priceSale: number;
  totalStock: number;
  minStock: number;
};

type Warehouse = { id: string; name: string };

type Movement = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  product: { name: string };
  warehouse: { name: string };
  user: { name: string };
};

type InventoryItem = {
  productId: string; name: string; unit: string;
  categoryName: string; priceCost: number; priceSale: number;
  quantity: number; value: number; minStock: number;
  warehouse: string;
};

type InventoryReport = {
  totalProducts: number; totalUnits: number;
  totalCost: number; totalSale: number; potentialProfit: number;
  byCategory: { name: string; productCount: number; totalUnits: number; valueCost: number; valueSale: number }[];
  items: InventoryItem[];
};

const SUB_TABS: { id: SubTab; label: string; icon: typeof Plus }[] = [
  { id: "agregar", label: "Agregar stock", icon: Plus },
  { id: "ajustes", label: "Ajustes", icon: Wrench },
  { id: "bajo-stock", label: "Bajo stock", icon: AlertTriangle },
  { id: "reporte", label: "Reporte", icon: FileText },
  { id: "movimientos", label: "Movimientos", icon: History },
  { id: "kardex", label: "Kardex", icon: BookOpen },
];

const UNIT_LABELS: Record<string, string> = {
  UNIDAD: "un", KILO: "kg", GRAMO: "g", LITRO: "L", PACK: "pack", CAJA: "cja", MANOJO: "manojo", MALLA: "malla",
};

const MOVEMENT_LABELS: Record<string, string> = {
  ENTRADA: "Entrada", SALIDA: "Venta", MERMA: "Merma", TRASPASO: "Traspaso", AJUSTE: "Ajuste", DEVOLUCION: "Devolución",
};

export function InventarioTab() {
  const router = useRouter();
  const [subTab, setSubTab] = useState<SubTab>("agregar");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => { loadBaseData(); }, []);

  async function loadBaseData() {
    setLoading(true);
    try {
      const [p, w] = await Promise.all([getProducts(), getWarehouses()]);
      setProducts(p.map((pr: any) => ({
        id: pr.id, name: pr.name, sku: pr.sku, barcode: pr.barcode,
        categoryName: pr.categoryName, unit: pr.unit,
        priceCost: pr.priceCost, priceSale: pr.priceSale,
        totalStock: pr.totalStock, minStock: pr.minStock,
      })));
      setWarehouses(w.map((wh: any) => ({ id: wh.id, name: wh.name })));
    } catch (err: any) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Sub-tabs */}
      <div className="flex items-center border-b border-border bg-card overflow-x-auto shrink-0">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={cn(
                "py-2 px-3 text-xs font-semibold transition-colors relative whitespace-nowrap border-r border-border flex items-center gap-1.5",
                subTab === t.id ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {subTab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {subTab === "agregar" && <EntradaSection products={products} warehouses={warehouses} />}
            {subTab === "ajustes" && <AjusteSection products={products} warehouses={warehouses} />}
            {subTab === "bajo-stock" && <BajoStockSection products={products} />}
            {subTab === "reporte" && <ReporteSection products={products} />}
            {subTab === "movimientos" && <MovimientosSection products={products} warehouses={warehouses} />}
            {subTab === "kardex" && <KardexSection products={products} warehouses={warehouses} />}
          </>
        )}
      </div>
    </div>
  );
}

function EntradaSection({ products, warehouses }: { products: Product[]; warehouses: Warehouse[] }) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [items, setItems] = useState<{ productId: string; quantity: string; unitCost: string }[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = productSearch ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())) : [];

  function addItem(productId: string) {
    if (items.find((i) => i.productId === productId)) return;
    setItems([...items, { productId, quantity: "1", unitCost: products.find((p) => p.id === productId)?.priceCost.toString() || "0" }]);
    setProductSearch("");
  }

  function updateItem(idx: number, field: string, value: string) {
    const newItems = [...items];
    (newItems[idx] as any)[field] = value;
    setItems(newItems);
  }

  function removeItem(idx: number) { setItems(items.filter((_, i) => i !== idx)); }

  async function handleSubmit() {
    if (!selectedWarehouse) { toast.error("Selecciona una bodega"); return; }
    if (items.length === 0) { toast.error("Agrega al menos un producto"); return; }
    setSubmitting(true);
    try {
      await createStockEntry({
        warehouseId: selectedWarehouse,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: parseFloat(i.quantity),
          unitCost: parseFloat(i.unitCost) || 0,
        })),
      });
      toast.success("Entrada registrada");
      setItems([]);
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="p-4 max-w-2xl space-y-4">
      <h2 className="font-semibold">Agregar stock (entrada)</h2>
      <div className="space-y-1.5">
        <Label>Bodega</Label>
        <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
          <option value="">Seleccionar...</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Buscar producto..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        {productSearch && filtered.length > 0 && (
          <div className="absolute z-10 top-full mt-1 w-full border border-border bg-popover rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filtered.slice(0, 20).map((p) => (
              <button key={p.id} onClick={() => addItem(p.id)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex justify-between">
                <span>{p.name}</span>
                <span className="text-xs text-muted-foreground">{formatCLP(p.priceCost)} / {UNIT_LABELS[p.unit] || p.unit}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="w-20">Cant</TableHead>
              <TableHead className="w-24">Costo un.</TableHead>
              <TableHead className="w-20">Total</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => {
              const p = products.find((pr) => pr.id === item.productId);
              const qty = parseFloat(item.quantity || "0");
              const cost = parseFloat(item.unitCost || "0");
              return (
                <TableRow key={item.productId}>
                  <TableCell className="text-sm">{p?.name || item.productId}</TableCell>
                  <TableCell><Input type="number" min="0.1" step="any" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} className="h-7 text-sm" /></TableCell>
                  <TableCell><Input type="number" min="0" step="any" value={item.unitCost} onChange={(e) => updateItem(idx, "unitCost", e.target.value)} className="h-7 text-sm" /></TableCell>
                  <TableCell className="text-sm font-semibold">{formatCLP(qty * cost)}</TableCell>
                  <TableCell><Button size="icon-xs" variant="ghost" onClick={() => removeItem(idx)}><X className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      <Button onClick={handleSubmit} disabled={submitting || items.length === 0} className="w-full">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Registrar entrada ({items.length} {items.length === 1 ? "producto" : "productos"})
      </Button>
    </div>
  );
}

function AjusteSection({ products, warehouses }: { products: Product[]; warehouses: Warehouse[] }) {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [newQty, setNewQty] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const product = products.find((p) => p.id === selectedProduct);
  const filtered = search ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) : [];

  async function handleSubmit() {
    if (!selectedProduct || !selectedWarehouse) { toast.error("Selecciona producto y bodega"); return; }
    if (!reason) { toast.error("Indica el motivo"); return; }
    setSubmitting(true);
    try {
      await createStockAdjustment({
        productId: selectedProduct,
        warehouseId: selectedWarehouse,
        newQuantity: parseFloat(newQty) || 0,
        reason,
      });
      toast.success("Ajuste aplicado");
      setSelectedProduct(""); setNewQty(""); setReason(""); setSearch("");
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="p-4 max-w-xl space-y-4">
      <h2 className="font-semibold">Ajuste de inventario</h2>
      <div className="space-y-1.5">
        <Label>Producto</Label>
        <div className="relative">
          <Input placeholder="Buscar..." value={search || product?.name || ""} onChange={(e) => { setSearch(e.target.value); setSelectedProduct(""); }} className="h-9 text-sm" />
          {search && filtered.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full border border-border bg-popover rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filtered.slice(0, 15).map((p) => (
                <button key={p.id} onClick={() => { setSelectedProduct(p.id); setSearch(""); setNewQty(p.totalStock.toString()); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted">
                  {p.name} <span className="text-xs text-muted-foreground">Stock: {p.totalStock}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Bodega</Label>
        <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
          <option value="">Seleccionar...</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Nuevo stock (cantidad exacta)</Label>
        <Input type="number" min="0" step="any" value={newQty} onChange={(e) => setNewQty(e.target.value)} className="h-9" />
        {product && <p className="text-xs text-muted-foreground">Stock actual: {product.totalStock} · Diferencia: {product ? (parseFloat(newQty || "0") - product.totalStock) : 0}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Motivo *</Label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Conteo físico, producto dañado..." className="h-9" />
      </div>
      <Button onClick={handleSubmit} disabled={submitting || !product || !selectedWarehouse || !reason} className="w-full">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Aplicar ajuste
      </Button>
    </div>
  );
}

function BajoStockSection({ products }: { products: Product[] }) {
  const low = products.filter((p) => p.totalStock <= p.minStock).sort((a, b) => a.totalStock - b.totalStock);

  return (
    <div className="p-4">
      <h2 className="font-semibold mb-3">Productos con stock bajo ({low.length})</h2>
      {low.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Package className="h-10 w-10 mb-2" /><p>Todos los productos tienen stock adecuado</p></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="text-right">Faltante</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {low.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium text-sm">{p.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.categoryName}</TableCell>
                <TableCell className="text-right text-sm">{formatNumber(p.totalStock, 0)}</TableCell>
                <TableCell className="text-right text-sm">{formatNumber(p.minStock, 0)}</TableCell>
                <TableCell className="text-right text-sm text-red-600">{formatNumber(p.minStock - p.totalStock, 0)}</TableCell>
                <TableCell>
                  <Badge variant={p.totalStock <= 0 ? "destructive" : "default"} className={p.totalStock > 0 ? "bg-orange-500/10 text-orange-700" : ""}>
                    {p.totalStock <= 0 ? "Agotado" : "Bajo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ReporteSection({ products }: { products: Product[] }) {
  const byCategory: Record<string, { productCount: number; totalUnits: number; valueCost: number; valueSale: number }> = {};
  let totalCost = 0, totalSale = 0, totalUnits = 0;

  for (const p of products) {
    const cat = p.categoryName;
    if (!byCategory[cat]) byCategory[cat] = { productCount: 0, totalUnits: 0, valueCost: 0, valueSale: 0 };
    byCategory[cat].productCount++;
    byCategory[cat].totalUnits += p.totalStock;
    byCategory[cat].valueCost += p.totalStock * p.priceCost;
    byCategory[cat].valueSale += p.totalStock * p.priceSale;
    totalCost += p.totalStock * p.priceCost;
    totalSale += p.totalStock * p.priceSale;
    totalUnits += p.totalStock;
  }

  const cats = Object.entries(byCategory).sort((a, b) => b[1].valueCost - a[1].valueCost);

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-semibold">Reporte de inventario</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Productos</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold">{products.length}</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Unidades</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold">{formatNumber(totalUnits, 0)}</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Valor costo</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold text-orange-600">{formatCLP(totalCost)}</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground uppercase">Valor venta</CardTitle></CardHeader><CardContent className="p-3 pt-0"><p className="text-lg font-bold text-green-600">{formatCLP(totalSale)}</p></CardContent></Card>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Productos</TableHead>
            <TableHead className="text-right">Unidades</TableHead>
            <TableHead className="text-right">Valor costo</TableHead>
            <TableHead className="text-right">Valor venta</TableHead>
            <TableHead className="text-right">Margen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cats.map(([name, data]) => (
            <TableRow key={name}>
              <TableCell className="font-medium text-sm">{name}</TableCell>
              <TableCell className="text-right text-sm">{data.productCount}</TableCell>
              <TableCell className="text-right text-sm">{formatNumber(data.totalUnits, 0)}</TableCell>
              <TableCell className="text-right text-sm">{formatCLP(data.valueCost)}</TableCell>
              <TableCell className="text-right text-sm">{formatCLP(data.valueSale)}</TableCell>
              <TableCell className="text-right text-sm text-green-600">{formatCLP(data.valueSale - data.valueCost)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MovimientosSection({ products, warehouses }: { products: Product[]; warehouses: Warehouse[] }) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [whFilter, setWhFilter] = useState("");

  useEffect(() => { loadMovements(); }, [typeFilter, whFilter]);

  async function loadMovements() {
    setLoading(true);
    try {
      const result = await getStockMovements({
        page: 1, pageSize: 100,
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(whFilter ? { warehouseId: whFilter } : {}),
      });
      setMovements(result.movements.map((m: any) => ({ ...m, createdAt: m.createdAt.toISOString() })) || []);
    } catch (err: any) { toast.error("Error al cargar movimientos"); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="font-semibold">Movimientos de inventario</h2>
      <div className="flex gap-2 flex-wrap">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-8 px-2 rounded-md border border-input bg-background text-xs">
          <option value="">Todos los tipos</option>
          {Object.entries(MOVEMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={whFilter} onChange={(e) => setWhFilter(e.target.value)} className="h-8 px-2 rounded-md border border-input bg-background text-xs">
          <option value="">Todas las bodegas</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto mt-8" /> : movements.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground">Sin movimientos</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Bodega</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-xs">{formatDateTime(m.createdAt)}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{MOVEMENT_LABELS[m.type] || m.type}</Badge></TableCell>
                <TableCell className="text-sm">{m.product?.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.warehouse?.name}</TableCell>
                <TableCell className={cn("text-right text-sm font-semibold", m.quantity > 0 ? "text-green-600" : "text-red-600")}>
                  {m.quantity > 0 ? "+" : ""}{formatNumber(m.quantity, 0)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.user?.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function KardexSection({ products, warehouses }: { products: Product[]; warehouses: Warehouse[] }) {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [kardexData, setKardexData] = useState<{
    rows: KardexRow[]; openingQty: number; openingValue: number;
    closingQty: number; closingValue: number;
    productName: string; productUnit: string; warehouseName: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) : [];

  async function loadKardex() {
    if (!selectedProduct || !selectedWarehouse) { toast.error("Selecciona producto y bodega"); return; }
    setLoading(true);
    try {
      const product = products.find((p) => p.id === selectedProduct);
      if (!product) { toast.error("Producto no encontrado"); return; }
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 3);
      const data = await getProductKardex(selectedProduct, selectedWarehouse, startDate, endDate);
      setKardexData(data);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-semibold">Kardex de inventario</h2>
      <div className="flex gap-2 flex-wrap items-end">
        <div className="space-y-1.5 flex-1 min-w-48">
          <Label className="text-xs">Producto</Label>
          <div className="relative">
            <Input placeholder="Buscar producto..." value={search || products.find((p) => p.id === selectedProduct)?.name || ""} onChange={(e) => { setSearch(e.target.value); setSelectedProduct(""); }} className="h-8 text-sm" />
            {search && filtered.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full border border-border bg-popover rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filtered.slice(0, 15).map((p) => (
                  <button key={p.id} onClick={() => { setSelectedProduct(p.id); setSearch(""); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted">{p.name}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1.5 w-36">
          <Label className="text-xs">Bodega</Label>
          <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs">
            <option value="">Seleccionar...</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={loadKardex} disabled={!selectedProduct || !selectedWarehouse || loading}>
          {loading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          Ver kardex
        </Button>
      </div>

      {kardexData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Card className="shadow-none"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Apertura</p><p className="font-bold text-sm">{formatNumber(kardexData.openingQty, 2)}</p><p className="text-xs text-muted-foreground">{formatCLP(kardexData.openingValue)}</p></CardContent></Card>
            <Card className="shadow-none"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Cierre</p><p className="font-bold text-sm">{formatNumber(kardexData.closingQty, 2)}</p><p className="text-xs text-muted-foreground">{formatCLP(kardexData.closingValue)}</p></CardContent></Card>
            <Card className="shadow-none"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Producto</p><p className="font-bold text-sm">{kardexData.productName}</p></CardContent></Card>
            <Card className="shadow-none"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Bodega</p><p className="font-bold text-sm">{kardexData.warehouseName}</p></CardContent></Card>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Fecha</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs">Ref</TableHead>
                  <TableHead className="text-right text-xs">Entrada</TableHead>
                  <TableHead className="text-right text-xs">Salida</TableHead>
                  <TableHead className="text-right text-xs">Costo un.</TableHead>
                  <TableHead className="text-right text-xs">Saldo cant</TableHead>
                  <TableHead className="text-right text-xs">Saldo valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kardexData.rows.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Sin movimientos en el período</TableCell></TableRow>
                ) : (
                  kardexData.rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{formatDateTime(r.date)}</TableCell>
                      <TableCell className="text-xs">{r.type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">{r.reference}</TableCell>
                      <TableCell className="text-right text-xs">{r.qtyIn > 0 ? formatNumber(r.qtyIn, 0) : ""}</TableCell>
                      <TableCell className="text-right text-xs">{r.qtyOut > 0 ? formatNumber(r.qtyOut, 0) : ""}</TableCell>
                      <TableCell className="text-right text-xs">{formatCLP(r.unitCost)}</TableCell>
                      <TableCell className="text-right text-xs font-semibold">{formatNumber(r.balanceQty, 2)}</TableCell>
                      <TableCell className="text-right text-xs">{formatCLP(r.balanceValue)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
