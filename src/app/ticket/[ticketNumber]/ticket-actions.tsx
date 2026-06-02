"use client";

import { Printer, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function TicketActions() {
  return (
    <div className="no-print max-w-xs mx-auto mb-4 flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href="/ventas">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Volver
        </Link>
      </Button>
      <Button onClick={() => window.print()} size="sm" className="flex-1">
        <Printer className="mr-1 h-3 w-3" />
        Imprimir
      </Button>
    </div>
  );
}
