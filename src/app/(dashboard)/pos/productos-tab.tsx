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
  Loader2, X, Package, AlertTriangle, Download, FileUp, FileSpreadsheet,
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
import { importProducts } from "@/lib/actions/import-products";
import * as XLSX from "xlsx";

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
  initialStock: 0,
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
  const [importOpen, setImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

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
      initialStock: selected.totalStock,
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
        initialStock: form.initialStock || 0,
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

  function parseCSV(text: string): any[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: any = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
      if (row.nombre || row.name || row.codigo || row.sku) rows.push(row);
    }
    return rows;
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  }

  function parseXLSXToRows(data: Uint8Array): any[] {
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (json.length < 2) return [];
    const headers = json[0].map((h: string) => String(h || "").trim().toLowerCase());
    const rows: any[] = [];
    for (let i = 1; i < json.length; i++) {
      const row: any = {};
      headers.forEach((h: string, idx: number) => {
        row[h] = json[i]?.[idx] !== undefined ? String(json[i][idx]).trim() : "";
      });
      if (row.nombre || row.name || row.codigo || row.sku) rows.push(row);
    }
    return rows;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    const reader = new FileReader();
    reader.onload = (ev) => {
      let parsed: any[] = [];
      if (ext === "xlsx" || ext === "xls") {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        parsed = parseXLSXToRows(data);
      } else {
        const text = ev.target?.result as string;
        parsed = parseCSV(text);
      }
      setImportPreview(parsed);
      setImportResult(null);
      if (parsed.length === 0) {
        toast.error("No se detectaron productos en el archivo. Revisa el formato.");
      } else {
        toast.success(`${parsed.length} productos detectados`);
      }
    };
    if (ext === "xlsx" || ext === "xls") {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
    e.target.value = "";
  }

  async function handleImport() {
    if (importPreview.length === 0) {
      toast.error("Carga un archivo CSV primero");
      return;
    }
    setSubmitting(true);
    try {
      const mapped = importPreview.map((r: any) => ({
        name: r.nombre || r.name || "",
        sku: r.sku || r.codigo || null,
        barcode: r.barcode || r["codigo de barras"] || r["codigo_barras"] || null,
        categoryName: r.categoria || r["categoría"] || r.category || null,
        unit: r.unidad || r.unit || "UNIDAD",
        priceCost: parseFloat(r["precio costo"] || r["precio_costo"] || r.priceCost || r.costo || 0),
        priceSale: parseFloat(r["precio venta"] || r["precio_venta"] || r.priceSale || r.precio || r.price || 0),
        priceWholesale: parseFloat(r["precio mayorista"] || r["precio_mayorista"] || r.priceWholesale || 0) || null,
        wholesaleMinQty: parseInt(r["cantidad min mayorista"] || r["cantidad_min_mayorista"] || r.wholesaleMinQty || 0) || null,
        taxRate: parseFloat(r.iva || r.tax || r["tasa iva"] || r.taxRate || 0),
        minStock: parseFloat(r["stock minimo"] || r["stock_minimo"] || r.minStock || 0),
        maxStock: parseFloat(r["stock maximo"] || r["stock_maximo"] || r.maxStock || 0) || null,
      }));
      const result = await importProducts({ rows: mapped });
      setImportResult(result);
      setImportPreview([]);
      if (result.created > 0) toast.success(`${result.created} productos importados`);
      if (result.skipped > 0) toast.info(`${result.skipped} omitidos (ya existen)`);
      if (result.errors.length > 0) result.errors.forEach((e) => toast.error(e));
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al importar");
    } finally {
      setSubmitting(false);
    }
  }

  function handleExport() {
    const headers = [
      "Nombre", "SKU", "Código de Barras", "Categoría", "Unidad",
      "Precio Costo", "Precio Venta", "Precio Mayorista", "Cant Min Mayorista",
      "IVA", "Stock Mínimo", "Stock Máximo", "Stock Actual",
    ];
    const rows = initialProducts.map((p) => [
      p.name, p.sku || "", p.barcode || "", p.categoryName, UNIT_LABELS[p.unit] || p.unit,
      p.priceCost, p.priceSale, p.priceWholesale || "", p.wholesaleMinQty || "",
      p.taxRate, p.minStock, p.maxStock || "", p.totalStock,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, `productos_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Catálogo exportado");
  }

  function handleDownloadTemplate() {
    const headers = ["Nombre", "SKU", "Código de Barras", "Categoría", "Unidad", "Precio Costo", "Precio Venta", "Precio Mayorista", "Cant Min Mayorista", "IVA", "Stock Mínimo", "Stock Máximo"];
    const example = ["Manzana Roja", "MANZ-001", "7801234567890", "Frutas", "UNIDAD", 500, 800, "", "", 19, 10, ""];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, "plantilla_productos.xlsx");
    toast.success("Plantilla descargada");
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
        <Button size="sm" variant="ghost" onClick={() => { setImportPreview([]); setImportResult(null); setImportOpen(true); }} className="shrink-0">
          <Upload className="h-4 w-4 mr-1" /> Importar
        </Button>
        <Button size="sm" variant="ghost" onClick={handleExport} className="shrink-0">
          <Download className="h-4 w-4 mr-1" /> Exportar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCatalogOpen(true)} className="shrink-0">
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

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Importar productos</DialogTitle>
            <DialogDescription>
              Carga un archivo Excel (.xlsx) o CSV con los productos. Descarga la plantilla para ver el formato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 flex-1 overflow-y-auto">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadTemplate}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Plantilla Excel
              </Button>
              <label className="flex-1">
                <Button size="sm" variant="default" className="w-full" asChild>
                  <span>
                    <FileUp className="h-3.5 w-3.5 mr-1" /> Cargar Excel / CSV
                  </span>
                </Button>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Columnas esperadas:</p>
              <p><strong>Nombre</strong> (obligatorio) · SKU · Código de Barras · Categoría · Unidad (UNIDAD, KILO, GRAMO, etc)</p>
              <p>Precio Costo · <strong>Precio Venta</strong> (obligatorio) · Precio Mayorista · Cant Min Mayorista · IVA · Stock Mínimo · Stock Máximo</p>
            </div>

            {importPreview.length > 0 && (
              <>
                <p className="text-sm font-medium">{importPreview.length} filas detectadas</p>
                <div className="text-xs max-h-48 overflow-y-auto border border-border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        {Object.keys(importPreview[0]).slice(0, 6).map((k) => (
                          <th key={k} className="p-1.5 text-left font-medium">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          {Object.values(row).slice(0, 6).map((v: any, j) => (
                            <td key={j} className="p-1.5 truncate max-w-[120px]">{String(v).substring(0, 30)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importPreview.length > 10 && <p className="text-xs text-muted-foreground">+ {importPreview.length - 10} filas más</p>}
              </>
            )}

            {importResult && (
              <div className="rounded-lg border border-border p-3 text-sm space-y-1">
                <p className="text-green-600 font-medium">{importResult.created} productos creados</p>
                {importResult.skipped > 0 && <p className="text-muted-foreground">{importResult.skipped} omitidos (ya existen)</p>}
                {importResult.errors.map((e, i) => (
                  <p key={i} className="text-red-600 text-xs">{e}</p>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cerrar</Button>
            <Button onClick={handleImport} disabled={importPreview.length === 0 || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar {importPreview.length > 0 ? `(${importPreview.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Catalog dialog */}
      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Catálogo de productos</DialogTitle>
            <DialogDescription>
              Lista de precios · {initialProducts.length} productos · {initialCategories.length} categorías
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            {initialCategories.map((cat) => {
              const catProducts = initialProducts.filter((p) => p.categoryId === cat.id);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h3 className="font-semibold text-sm bg-muted px-3 py-1.5 rounded-md sticky top-0">
                    {cat.name} ({catProducts.length})
                  </h3>
                  <div className="mt-1 space-y-0.5">
                    {catProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-1.5 rounded hover:bg-muted/50 text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            /{UNIT_LABELS[p.unit] || p.unit}
                          </span>
                        </div>
                        <span className="font-bold text-primary ml-4 shrink-0">{formatCLP(p.priceSale)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatalogOpen(false)}>Cerrar</Button>
            <Button onClick={() => window.print()}>Imprimir</Button>
          </DialogFooter>
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
            <div className="space-y-1.5">
              <Label>Stock inicial</Label>
              <Input type="number" min="0" step="any" value={form.initialStock || 0} onChange={(e) => setForm({ ...form, initialStock: parseFloat(e.target.value) || 0 })} />
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
