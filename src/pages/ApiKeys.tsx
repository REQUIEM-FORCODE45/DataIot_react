import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUsuarios } from "@/api/Users";
import type { ApiKey } from "@/api/Users";
import { KeyRound, Plus, Trash2, Copy, Check, TriangleAlert } from "lucide-react";

type KeyStatus = "activa" | "expirada" | "revocada";

function getKeyStatus(key: ApiKey): KeyStatus {
  if (!key.is_active) return "revocada";
  if (new Date(key.expires_at).getTime() <= Date.now()) return "expirada";
  return "activa";
}

const STATUS_STYLES: Record<KeyStatus, { label: string; className: string }> = {
  activa: { label: "Activa", className: "bg-emerald-100 text-emerald-700" },
  expirada: { label: "Expirada", className: "bg-amber-100 text-amber-700" },
  revocada: { label: "Revocada", className: "bg-slate-100 text-slate-500" },
};

function formatDate(iso?: string | null): string {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function tomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export const ApiKeys = () => {
  const [apikeys, setApikeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealedExpires, setRevealedExpires] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiUsuarios.getMyApiKeys();
      if (data.ok) {
        setApikeys(data.apikeys ?? []);
      } else {
        setError("No se pudieron cargar las API keys");
      }
    } catch {
      setError("Error de conexión al cargar las API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setCreateError("El nombre es requerido");
      return;
    }
    if (!expiresAt) {
      setCreateError("La fecha de expiración es requerida");
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      const expiresISO = new Date(`${expiresAt}T23:59:59.000Z`).toISOString();
      const data = await apiUsuarios.createApiKey(name.trim(), expiresISO);

      if (data.ok && data.key) {
        setRevealedKey(data.key);
        setRevealedExpires(data.apikey?.expires_at ?? expiresISO);
        setShowCreate(false);
        setName("");
        setExpiresAt("");
        fetchApiKeys();
      } else {
        setCreateError(data.message || "Error al crear la API key");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setCreateError(axiosErr.response?.data?.message || "Error al crear la API key");
      } else {
        setCreateError("Error de conexión al crear la API key");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (key: ApiKey) => {
    if (!window.confirm(`¿Revocar la API key "${key.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const data = await apiUsuarios.revokeApiKey(key._id);
      if (data.ok) {
        fetchApiKeys();
      } else {
        setError(data.message || "Error al revocar la API key");
      }
    } catch {
      setError("Error de conexión al revocar la API key");
    }
  };

  const handleCopy = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard no disponible
    }
  };

  const handleCloseReveal = () => {
    setRevealedKey(null);
    setRevealedExpires("");
    setCopied(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Integraciones</p>
          <h1 className="text-xl font-semibold text-[#1e293b]">API Keys</h1>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#00554f] hover:bg-[#004a45] text-white rounded-[10px]"
        >
          <Plus size={16} className="mr-2" />
          Nueva key
        </Button>
      </div>

      <Card className="rounded-[12px] border border-black/10 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound size={20} className="text-[#00554f]" />
            Mis API keys
          </CardTitle>
          <p className="text-sm text-[#64748b]">
            Cada key hereda automáticamente tu rol y tus sedes/áreas asignadas.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2 mb-4">{error}</p>
          )}

          {loading ? (
            <p className="text-sm text-[#64748b] text-center py-8">Cargando API keys...</p>
          ) : apikeys.length === 0 ? (
            <p className="text-sm text-[#64748b] text-center py-8">
              No tienes API keys. Crea una para integrar sistemas externos.
            </p>
          ) : (
            <div className="divide-y divide-black/5">
              {apikeys.map((key) => {
                const status = getKeyStatus(key);
                const style = STATUS_STYLES[status];
                return (
                  <div key={key._id} className="flex items-center gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#1e293b]">{key.name}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.className}`}>
                          {style.label}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748b] mt-1 font-mono">{key.prefix}…</div>
                      <div className="text-xs text-[#94a3b8] mt-1 flex flex-wrap gap-x-4">
                        <span>Expira: {formatDate(key.expires_at)}</span>
                        <span>Último uso: {formatDate(key.last_used_at)}</span>
                      </div>
                    </div>
                    {key.is_active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevoke(key)}
                        className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        title="Revocar"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { setName(""); setExpiresAt(""); setCreateError(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva API key</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="keyName" className="text-[#64748b]">Nombre *</Label>
              <Input
                id="keyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Ej: "Integración ERP"'
                className="rounded-[10px] border border-black/10"
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyExpires" className="text-[#64748b]">Fecha de expiración *</Label>
              <Input
                id="keyExpires"
                type="date"
                value={expiresAt}
                min={tomorrowDateString()}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="rounded-[10px] border border-black/10"
                disabled={creating}
              />
            </div>

            {createError && (
              <p className="text-sm text-red-500">{createError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-[#00554f] hover:bg-[#004a45] text-white"
            >
              {creating ? "Creando..." : "Crear key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(revealedKey)} onOpenChange={(open) => { if (!open) handleCloseReveal(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tu API key fue creada</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-slate-100 rounded-lg px-3 py-2.5 break-all select-all">
                {revealedKey}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="h-9 w-9 shrink-0"
                title="Copiar"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </Button>
            </div>
            {copied && <p className="text-xs text-emerald-600">Copiada al portapapeles</p>}

            <div className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2.5">
              <TriangleAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Guárdala ahora. Por seguridad no se volverá a mostrar.
              </p>
            </div>

            <p className="text-xs text-[#64748b]">
              Expira: {formatDate(revealedExpires)}
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCloseReveal}
              className="bg-[#00554f] hover:bg-[#004a45] text-white"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
