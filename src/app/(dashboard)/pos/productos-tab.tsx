"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Plus, Pencil, Trash2, Tags, BarChart3, Gift, Upload, BookOpen,
  Loader2, X, Package, AlertTriangle,
} from "lucide-react";
import { formatCLP, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createProduct, updateProduct, deleteProduct,
} from "@/lib/actions/products";
import {
  createCategory, updateCategory, deleteCategory,
} from "@/lib/actions/categories";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  categoryId: string;
  categoryName: string;
  unit: string;
  priceCost: number;
  priceSale: number;
  priceWholesale?: number | null;
  wholesaleMinQty?: number | null;
  taxRate: number;
  minStock: number;
  maxStock?: number | null;
  totalStock: number;
};

type Category = {
  id: string;
  name: string;
  description?: string | null;
  _count?: { products: number };
};

const UNIT_LABELS: Record<string, string> = {
  UNIDAD: "Unidad", KILO: "Kilogramo", GRAMO: "Gramo", LITRO: "Litro",
  PACK: "Pack", CAJA: "Caja", MANOJO: "Manojo", MALLA: "Malla",
};

const UNITS = Object.entries(UNIT_LABELS).map(([value, label]) => ({ value, label }));

const EMPTY_PRODUCT_FORM = {
  name: "", description: "", sku: "", barcode: "",
  categoryId: "", unit: "UNIDAD" as string,
  priceCost: 0, priceSale: 0, priceWholesale: undefined as number | undefined,
  wholesaleMinQty: undefined as number | undefined,
  taxRate: 0, minStock: 0, maxStock: undefined as number | undefined,
};

export function ProductosTab({
  products: initialProducts,
  categories: initialCategories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(EMPTY_PRODUCT_FORM);
  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = initialProducts;
    if (categoryFilter) result = result.filter((p) => p.categoryId === categoryFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.sku?.toLowerCase().includes(s) ||
          p.barcode?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [initialProducts, categoryFilter, search]);

  const selected = selectedId ? filtered.find((p) => p.id === selectedId) : null;

  function resetForm() {
    setForm(EMPTY_PRODUCT_FORM);
  }

  function handleNew() {
    resetForm();
    setShowNewForm(true);
  }

  function handleModificar() {
    if (!selected) {
      toast.error("Selecciona un producto en la tabla para modificar");
      return;
    }
    setForm({
      name: selected.name,
      description: selected.description || "",
      sku: selected.sku || "",
      barcode: selected.barcode || "",
      categoryId: selected.categoryId,
      unit: selected.unit,
      priceCost: selected.priceCost,
      priceSale: selected.priceSale,
      priceWholesale: selected.priceWholesale ?? undefined,
      wholesaleMinQty: selected.wholesaleMinQty ?? undefined,
      taxRate: selected.taxRate,
      minStock: selected.minStock,
      maxStock: selected.maxStock ?? undefined,
    });
    setShowEditForm(true);
  }

  function handleEliminar() {
    if (!selected) {
      toast.error("Selecciona un producto en la tabla para eliminar");
      return;
    }
    setShowDeleteConfirm(true);
  }

  async function submitNew() {
    setSubmitting(true);
    try {
      await createProduct({
        name: form.name,
        description: form.description || null,
        sku: form.sku || null,
        barcode: form.barcode || null,
        categoryId: form.categoryId,
        unit: form.unit as any,
        priceCost: form.priceCost,
        priceSale: form.priceSale,
        priceWholesale: form.priceWholesale ?? null,
        wholesaleMinQty: form.wholesaleMinQty ?? null,
        taxRate: form.taxRate,
        minStock: form.minStock,
        maxStock: form.maxStock ?? null,
      });
      toast.success("Producto creado");
      setShowNewForm(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al crear producto");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitEdit() {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await updateProduct(selectedId, {
        name: form.name,
        description: form.description || null,
        sku: form.sku || null,
        barcode: form.barcode || null,
        categoryId: form.categoryId,
        unit: form.unit as any,
        priceCost: form.priceCost,
        priceSale: form.priceSale,
        priceWholesale: form.priceWholesale ?? null,
        wholesaleMinQty: form.wholesaleMinQty ?? null,
        taxRate: form.taxRate,
        minStock: form.minStock,
        maxStock: form.maxStock ?? null,
      });
      toast.success("Producto actualizado");
      setShowEditForm(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await deleteProduct(selectedId);
      toast.success("Producto eliminado");
      setShowDeleteConfirm(false);
      setSelectedId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCategory() {
    if (!catForm.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      await createCategory({
        name: catForm.name,
        description: catForm.description || null,
      });
      toast.success("Categoría creada");
      setCatForm({ name: "", description: "" });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al crear categoría");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateCategory() {
    if (!editingCatId || !catForm.name.trim()) return;
    setSubmitting(true);
    try {
      await updateCategory(editingCatId, {
        name: catForm.name,
        description: catForm.description || null,
      });
      toast.success("Categoría actualizada");
      setEditingCatId(null);
      setCatForm({ name: "", description: "" });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar categoría");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await deleteCategory(id);
      toast.success("Categoría eliminada");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar categoría");
    }
  }

  const lowStock = filtered.filter((p) => p.totalStock > 0 && p.totalStock <= p.minStock).length;
  const outOfStock = filtered.filter((p) => p.totalStock <= 0).length;

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Stats + search bar */}
      <div className="border-b border-border bg-card p-3 space-y-3 shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{initialProducts.length} productos</span>
          {lowStock > 0 && <Badge className="bg-orange-500/10 text-orange-700">{lowStock} bajo</Badge>}
          {outOfStock > 0 && <Badge variant="destructive">{outOfStock} agotados</Badge>}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto, SKU o código de barra..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">Todas</option>
            {initialCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm">No se encontraron productos</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Venta</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const isLow = p.totalStock > 0 && p.totalStock <= p.minStock;
                const isOut = p.totalStock <= 0;
                return (
                  <TableRow
                    key={p.id}
                    className={cn("cursor-pointer", selectedId === p.id && "bg-primary/5 border-primary/30")}
                    onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                  >
                    <TableCell>
                      <span className={cn(
                        "h-3 w-3 rounded-full border-2 block",
                        selectedId === p.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )} />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{p.name}</p>
                      {p.barcode && <p className="text-[10px] text-muted-foreground font-mono">{p.barcode}</p>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.sku || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.categoryName}</Badge></TableCell>
                    <TableCell className="text-right text-sm">{formatCLP(p.priceCost)}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">{formatCLP(p.priceSale)}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(isOut && "text-destructive font-semibold", isLow && "text-orange-600 font-semibold")}>
                        {formatNumber(p.totalStock, 2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isOut ? (
                        <Badge variant="destructive" className="text-xs">Agotado</Badge>
                      ) : isLow ? (
                        <Badge className="bg-orange-500/10 text-orange-700 text-xs">Bajo</Badge>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-700 text-xs">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="border-t border-border bg-card p-2 flex items-center gap-1 overflow-x-auto shrink-0">
        <Button size="sm" variant="ghost" onClick={handleNew} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Nuevo
        </Button>
        <Button size="sm" variant="ghost" onClick={handleModificar} className="shrink-0" disabled={!selected}>
          <Pencil className="h-4 w-4 mr-1" /> Modificar
        </Button>
        <Button size="sm" variant="ghost" onClick={handleEliminar} className="shrink-0 text-destructive hover:text-destructive" disabled={!selected}>
          <Trash2 className="h-4 w-4 mr-1" /> Eliminar
        </Button>
        <span className="w-px h-5 bg-border mx-1 shrink-0" />
        <Button size="sm" variant="ghost" onClick={() => setShowCategories(true)} className="shrink-0">
          <Tags className="h-4 w-4 mr-1" /> Departamentos
        </Button>
        <Button size="sm" variant="ghost" onClick={() => window.open("/reportes", "_blank")} className="shrink-0">
          <BarChart3 className="h-4 w-4 mr-1" /> Ventas por periodo
        </Button>
        <Button size="sm" variant="ghost" onClick={() => toast.info("Próximamente")} className="shrink-0">
          <Gift className="h-4 w-4 mr-1" /> Promociones
        </Button>
        <Button size="sm" variant="ghost" onClick={() => toast.info("Próximamente")} className="shrink-0">
          <Upload className="h-4 w-4 mr-1" /> Importar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => toast.info("Próximamente")} className="shrink-0">
          <BookOpen className="h-4 w-4 mr-1" /> Catálogo
        </Button>
      </div>

      {/* Dialogs */}
      <ProductFormDialog
        open={showNewForm}
        onOpenChange={setShowNewForm}
        title="Nuevo producto"
        form={form}
        setForm={setForm}
        categories={initialCategories}
        onSubmit={submitNew}
        submitting={submitting}
      />
      <ProductFormDialog
        open={showEditForm}
        onOpenChange={setShowEditForm}
        title="Modificar producto"
        form={form}
        setForm={setForm}
        categories={initialCategories}
        onSubmit={submitEdit}
        submitting={submitting}
      />
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              El producto se marcará como inactivo y no aparecerá en el POS.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={submitting}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categorías dialog */}
      <Dialog open={showCategories} onOpenChange={setShowCategories}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Departamentos / Categorías</DialogTitle>
            <DialogDescription>Administra las categorías de productos</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de categoría"
                value={catForm.name}
                onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Button size="sm" onClick={editingCatId ? handleUpdateCategory : handleCreateCategory} disabled={submitting}>
                {editingCatId ? "Guardar" : "Crear"}
              </Button>
              {editingCatId && (
                <Button size="sm" variant="ghost" onClick={() => { setEditingCatId(null); setCatForm({ name: "", description: "" }); }}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {initialCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin categorías</p>
              ) : (
                initialCategories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      {c._count && <p className="text-xs text-muted-foreground">{c._count.products} productos</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => {
                          setEditingCatId(c.id);
                          setCatForm({ name: c.name, description: c.description || "" });
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCategory(c.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductFormDialog({
  open, onOpenChange, title, form, setForm, categories, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  form: any;
  setForm: (f: any) => void;
  categories: Category[];
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Unidad *</Label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Código de barras</Label>
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Precio costo</Label>
              <Input type="number" min="0" step="any" value={form.priceCost} onChange={(e) => setForm({ ...form, priceCost: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Precio venta *</Label>
              <Input type="number" min="0" step="any" value={form.priceSale} onChange={(e) => setForm({ ...form, priceSale: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Precio mayoreo</Label>
              <Input type="number" min="0" step="any" value={form.priceWholesale || ""} onChange={(e) => setForm({ ...form, priceWholesale: e.target.value ? parseFloat(e.target.value) : undefined })} />
            </div>
            <div className="space-y-1.5">
              <Label>Cant. mín. mayoreo</Label>
              <Input type="number" min="1" value={form.wholesaleMinQty || ""} onChange={(e) => setForm({ ...form, wholesaleMinQty: e.target.value ? parseInt(e.target.value) : undefined })} />
            </div>
            <div className="space-y-1.5">
              <Label>IVA (%)</Label>
              <Input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock mín. (alerta)</Label>
              <Input type="number" min="0" step="any" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
