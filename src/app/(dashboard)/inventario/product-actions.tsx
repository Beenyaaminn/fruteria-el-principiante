"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Loader2, PackagePlus, History } from "lucide-react";
import { deleteProduct } from "@/lib/actions/products";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ProductActions({
  productId,
  productName,
}: {
  productId: string;
  productName?: string;
}) {
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProduct(productId);
      toast.success("Producto eliminado");
      setOpenDelete(false);
      setMenuOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-7 w-7 hover:bg-muted outline-none">
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setMenuOpen(false)}>
            <Link
              href={`/inventario/${productId}`}
              className="flex items-center w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Edit className="mr-2 h-4 w-4" />
              Modificar producto
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMenuOpen(false)}>
            <Link
              href={`/bodegas/entradas?producto=${encodeURIComponent(productName || "")}`}
              className="flex items-center w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              Reponer stock
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMenuOpen(false)}>
            <Link
              href={`/bodegas/movimientos`}
              className="flex items-center w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <History className="mr-2 h-4 w-4" />
              Ver movimientos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => { setOpenDelete(true); setMenuOpen(false); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              El producto se marcará como inactivo y no aparecerá en el POS.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
