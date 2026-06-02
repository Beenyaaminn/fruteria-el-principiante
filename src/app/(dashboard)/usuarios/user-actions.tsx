"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { MoreHorizontal, Edit, Power, Loader2 } from "lucide-react";
import { toggleUserActive } from "@/lib/actions/users";
import { toast } from "sonner";

export function UserActions({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setToggling(true);
    try {
      await toggleUserActive(userId);
      toast.success("Usuario actualizado");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setToggling(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-7 w-7 hover:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/usuarios/${userId}`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Power className="mr-2 h-4 w-4" />
            Activar / Desactivar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cambiar estado del usuario?</DialogTitle>
            <DialogDescription>
              El usuario no podrá iniciar sesión si está inactivo, pero sus datos se conservan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={toggling}>
              Cancelar
            </Button>
            <Button onClick={handleToggle} disabled={toggling}>
              {toggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
