import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Entidad } from "@/types/entidad";
import { Building2 } from "lucide-react";

interface EntitySelectorListProps {
  entities: Entidad[];
  activeEntityId?: string;
  onSelect: (id: string) => void;
}

export const EntitySelectorList = ({ entities, activeEntityId, onSelect }: EntitySelectorListProps) => {
  if (entities.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-muted/40 bg-card/60 p-6 text-center text-sm text-muted-foreground">
        No hay entidades registradas aún.
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {entities.map((entity) => {
        const active = entity._id === activeEntityId;
        return (
          <article
            key={entity._id}
            className={cn(
              "flex min-w-[220px] flex-col justify-between gap-3 rounded-3xl border bg-card/80 p-4 transition-shadow",
              active ? "border-primary/80 bg-gradient-to-b from-primary/10 to-card shadow-[0_0_40px_rgba(59,130,246,0.15)]" : "border-border hover:border-primary/60 hover:shadow-lg"
            )}
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
              <span>Entidad</span>
              <span className="text-[10px]">{entity.sedes?.length ?? 0} sedes</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold leading-tight text-foreground line-clamp-2" title={entity.name}>
                {entity.name}
              </h3>
              <p className="text-[13px] text-muted-foreground mt-1">
                NIT {entity.nit}-{entity.verif}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Building2 size={14} className="text-primary" />
                <span>{entity.phone ? "Con contacto" : "Sin contacto"}</span>
              </div>
              <Button
                size="xs"
                variant={active ? "secondary" : "ghost"}
                onClick={() => onSelect(entity._id)}
                aria-pressed={active}
              >
                {active ? "Seleccionada" : "Ver sensores"}
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
};
