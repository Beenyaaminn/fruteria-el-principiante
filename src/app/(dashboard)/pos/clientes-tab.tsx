"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Search, Users, Phone, Mail, CreditCard, Eye, Loader2, Pencil,
} from "lucide-react";
import { formatCLP } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getCustomers, createCustomer, updateCustomer } from "@/lib/actions/customers";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  creditLimit: number | null;
  creditDays: number | null;
  balance: number;
  notes: string | null;
  _count: { sales: number };
};

export function ClientesTab() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "",
    creditLimit: "", creditDays: "", notes: "",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err: any) {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ name: "", email: "", phone: "", address: "", creditLimit: "", creditDays: "", notes: "" });
    setEditId(null);
  }

  function handleNew() {
    resetForm();
    setShowForm(true);
  }

  function handleEdit(c: Customer) {
    setForm({
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      creditLimit: c.creditLimit?.toString() || "",
      creditDays: c.creditDays?.toString() || "",
      notes: c.notes || "",
    });
    setEditId(c.id);
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await updateCustomer(editId, {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : null,
          creditDays: form.creditDays ? parseInt(form.creditDays) : null,
          notes: form.notes || null,
        });
        toast.success("Cliente actualizado");
      } else {
        await createCustomer({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : null,
          creditDays: form.creditDays ? parseInt(form.creditDays) : null,
          notes: form.notes || null,
        });
        toast.success("Cliente creado");
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = search
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  const totalDebt = filtered.reduce((s, c) => s + c.balance, 0);
  const withDebt = filtered.filter((c) => c.balance > 0).length;
  const overLimit = filtered.filter((c) => c.creditLimit && c.balance > c.creditLimit).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Header + KPIs */}
      <div className="border-b border-border bg-card p-3 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-semibold">{filtered.length} clientes</span>
            {withDebt > 0 && <Badge className="bg-orange-500/10 text-orange-700">{withDebt} con deuda</Badge>}
            {overLimit > 0 && <Badge variant="destructive">{overLimit} excedidos</Badge>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => {}} disabled className="text-xs">
              <Pencil className="h-3.5 w-3.5 mr-1" /> Importar
            </Button>
            <Button size="sm" onClick={handleNew}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo
            </Button>
          </div>
        </div>
        {totalDebt > 0 && (
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>Deuda total: <strong className="text-red-600">{formatCLP(totalDebt)}</strong></span>
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm">No se encontraron clientes</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Contacto</TableHead>
                <TableHead className="text-right">Límite</TableHead>
                <TableHead className="text-right">Deuda</TableHead>
                <TableHead className="text-center hidden md:table-cell">Ventas</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const isOver = c.creditLimit && c.balance > (c.creditLimit || 0);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{c.name}</p>
                      {c.notes && <p className="text-[10px] text-muted-foreground line-clamp-1">{c.notes}</p>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {c.phone && <p className="text-xs flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{c.phone}</p>}
                      {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                    </TableCell>
                    <TableCell className="text-right text-xs">{c.creditLimit ? formatCLP(c.creditLimit) : "—"}</TableCell>
                    <TableCell className="text-right">
                      {c.balance > 0 ? (
                        <Badge variant={isOver ? "destructive" : "default"} className={cn("text-xs", !isOver && "bg-orange-500/10 text-orange-700")}>
                          {formatCLP(c.balance)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">$0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{c._count.sales}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button size="icon-xs" variant="ghost" onClick={() => router.push(`/clientes/${c.id}`)} title="Ver detalle">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon-xs" variant="ghost" onClick={() => handleEdit(c)} title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
            <DialogDescription>
              {editId ? "Modifica los datos del cliente" : "Registra un nuevo cliente en el sistema"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Límite de crédito</Label>
                <Input type="number" min="0" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Días de crédito</Label>
                <Input type="number" min="0" value={form.creditDays} onChange={(e) => setForm({ ...form, creditDays: e.target.value })} placeholder="30" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
