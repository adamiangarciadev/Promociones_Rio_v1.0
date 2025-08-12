import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, Trash2, PlusCircle, Store, Tag, Package, Shirt, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// =============================================
//  RÍO – Generador de pedidos por PROMOCIÓN (v2)
//  ➜ Carga promociones desde "/promociones.json" (raíz /public)
// =============================================

const SUCURSALES = [
  "CASA CENTRAL",
  "SAN JUSTO",
  "ITUZAINGÓ",
  "CIUDADELA",
  "MORENO",
  "MORENO II",
  "SAN MIGUEL",
  "MORÓN",
  "MERLO",
];

function downloadTxt(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function fuzzyIncludes(haystack, needle) {
  return haystack?.toLowerCase?.().normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(
    needle?.toLowerCase?.().normalize("NFD").replace(/\p{Diacritic}/gu, "")
  );
}

export default function App() {
  const [data, setData] = useState([]); // promociones desde /promociones.json
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estado UI
  const [sucursal, setSucursal] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [promoId, setPromoId] = useState("");
  const [tallesSeleccionados, setTallesSeleccionados] = useState([]);
  const [todosTalles, setTodosTalles] = useState(false);
  const [articulosSeleccionados, setArticulosSeleccionados] = useState([]);
  const [todosArticulos, setTodosArticulos] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [items, setItems] = useState([]);

  // ======= Cargar JSON base desde RAÍZ =======
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/promociones.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("promociones.json debe ser un array");
        setData(json);
      } catch (e) {
        console.error(e);
        setError(`No se pudo cargar promociones desde /promociones.json: ${e.message}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ======= Derivados =======
  const promo = useMemo(() => data.find(p => p.id === promoId) || null, [promoId, data]);

  const promosFiltradas = useMemo(() => {
    if (!busqueda.trim()) return data;
    return data.filter(p => {
      const enNombre = fuzzyIncludes(p.nombre, busqueda) || fuzzyIncludes(p.marca, busqueda);
      const enArticulos = (p.articulos||[]).some(a => fuzzyIncludes(a.codigo, busqueda) || fuzzyIncludes(a.desc, busqueda));
      return enNombre || enArticulos;
    });
  }, [busqueda, data]);

  const tallesDisponibles = useMemo(() => promo?.talles || [], [promo]);
  const articulosDisponibles = useMemo(() => promo?.articulos || [], [promo]);

  // ======= Acciones =======
  function toggleArticulo(codigo) {
    setArticulosSeleccionados(prev => prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]);
  }

  function toggleTalle(talle) {
    setTallesSeleccionados(prev => prev.includes(talle) ? prev.filter(t => t !== talle) : [...prev, talle]);
  }

  function handleAgregar() {
    if (!sucursal) return alert("Elegí una sucursal");
    if (!promo) return alert("Elegí una promoción");

    const arts = todosArticulos ? articulosDisponibles.map(a => a.codigo) : articulosSeleccionados;
    const tlls = todosTalles ? tallesDisponibles : tallesSeleccionados;

    if (!arts.length) return alert("Seleccioná al menos un artículo (o activá 'Todos los artículos')");
    if (!tlls.length) return alert("Seleccioná al menos un talle (o activá 'Todos los talles')");

    const nuevos = [];
    for (const art of arts) {
      for (const talle of tlls) {
        nuevos.push({ id: crypto.randomUUID(), sucursal, promo: promo.nombre, promoId: promo.id, art, talle, cantidad: Number(cantidad) || 1 });
      }
    }
    setItems(prev => [...prev, ...nuevos]);
  }

  function handleDescargar() {
    if (!items.length) return alert("No hay nada para descargar aún");
    const lineas = items.map(i => `${i.sucursal};${i.promoId};${i.art};${i.talle};${i.cantidad}`);
    const cabecera = `# SUCURSAL;PROMO_ID;ARTICULO;TALLE;CANTIDAD\n`;
    const txt = cabecera + lineas.join("\n") + "\n";
    const fecha = new Date().toISOString().slice(0,10);
    const nombre = `pedido_promos_${fecha}.txt`;
    downloadTxt(nombre, txt);
  }

  function limpiarFormulario() {
    setPromoId("");
    setTallesSeleccionados([]);
    setTodosTalles(false);
    setArticulosSeleccionados([]);
    setTodosArticulos(false);
    setCantidad(1);
  }

  function quitarItem(id) { setItems(prev => prev.filter(i => i.id !== id)); }

  // ======= Render =======
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto grid gap-6">
        <header className="flex items-center gap-3">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Badge className="text-sm px-3 py-1 rounded-2xl">RÍO – Pedidos por Promoción</Badge>
          </motion.div>
          <h1 className="text-2xl font-semibold">Generador súper intuitivo</h1>
        </header>

        {/* Estado de carga / error */}
        {loading && (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 text-sm">Cargando promociones desde <code>/promociones.json</code>…</CardContent>
          </Card>
        )}
        {!!error && (
          <Card className="rounded-2xl shadow-sm border-red-200">
            <CardContent className="p-4 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5"/>
              <div>
                <div className="font-semibold">No se pudo cargar el archivo.</div>
                <div>{error}</div>
                <div className="mt-2 opacity-75">Colocá <code>promociones.json</code> en la carpeta <code>/public</code> del proyecto (o en la raíz del deploy), con el formato acordado.</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form principal */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2"><Store className="w-5 h-5"/> Datos del pedido</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="text-sm font-medium">Sucursal</label>
              <Select value={sucursal} onValueChange={setSucursal}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Elegí sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {SUCURSALES.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3">
              <label className="text-sm font-medium">Buscar promoción o artículo</label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60"/>
                  <Input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Ej: BOXER, 03-3200, KAURY, SIGRY…" className="pl-9"/>
                </div>
              </div>
              <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                {promosFiltradas.slice(0,6).map(p => (
                  <button key={p.id} onClick={()=>setPromoId(p.id)} className={`text-left px-3 py-2 rounded-xl border transition ${promoId===p.id?"bg-blue-50 border-blue-300":"hover:bg-slate-50"}`}>
                    <div className="text-xs uppercase tracking-wide opacity-60">{p.marca}</div>
                    <div className="text-sm font-medium line-clamp-1">{p.nombre}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {promo && (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Tag className="w-5 h-5"/> {promo.nombre}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              {/* Columna Artículos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><Package className="w-4 h-4"/> Artículos</h3>
                  <div className="flex items-center gap-2">
                    <Checkbox id="todosArt" checked={todosArticulos} onCheckedChange={(v)=>{setTodosArticulos(Boolean(v)); if (v) setArticulosSeleccionados([]);}}/>
                    <label htmlFor="todosArt" className="text-sm">Todos</label>
                  </div>
                </div>
                <div className="max-h-64 overflow-auto rounded-xl border p-2 bg-white">
                  {articulosDisponibles.map(a => (
                    <label key={a.codigo} className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg ${articulosSeleccionados.includes(a.codigo)?"bg-blue-50":"hover:bg-slate-50"}`}>
                      <div className="flex items-center gap-2">
                        {!todosArticulos && (
                          <Checkbox checked={articulosSeleccionados.includes(a.codigo)} onCheckedChange={()=>toggleArticulo(a.codigo)} />
                        )}
                        <span className="font-mono text-sm">{a.codigo}</span>
                      </div>
                      <span className="text-xs opacity-70">{a.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Columna Talles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><Shirt className="w-4 h-4"/> Talles</h3>
                  <div className="flex items-center gap-2">
                    <Checkbox id="todosTalles" checked={todosTalles} onCheckedChange={(v)=>{setTodosTalles(Boolean(v)); if (v) setTallesSeleccionados([]);}}/>
                    <label htmlFor="todosTalles" className="text-sm">Todos</label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tallesDisponibles.map(t => (
                    <button key={t} disabled={todosTalles} onClick={()=>toggleTalle(t)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition ${tallesSeleccionados.includes(t)?"bg-blue-600 text-white border-blue-600":"hover:bg-slate-50"}`}>
                      {t}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Cantidad</label>
                    <Input type="number" min={1} value={cantidad} onChange={e=>setCantidad(e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAgregar} className="w-full gap-2"><PlusCircle className="w-4 h-4"/> Agregar a la lista</Button>
                  </div>
                </div>

                {promo.precios?.length ? (
                  <div className="mt-4 text-xs bg-slate-50 border rounded-xl p-3">
                    <div className="font-semibold mb-1">Referencia de precios (informativo)</div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {promo.precios.map((p, i) => (
                        <li key={i} className="flex items-center justify-between"><span>{p.label}</span><Badge variant="secondary" className="ml-2">$ {Number(p.valor).toLocaleString("es-AR")}</Badge></li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              {/* Ayuda / Acciones */}
              <div>
                <div className="text-sm bg-blue-50 border border-blue-200 rounded-2xl p-3">
                  <div className="font-semibold mb-1">Cómo funciona</div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Elegí la <strong>sucursal</strong>.</li>
                    <li>Buscá y seleccioná la <strong>promoción</strong>.</li>
                    <li>Elegí <strong>artículos</strong> o activá <em>Todos</em>.</li>
                    <li>Elegí <strong>talles</strong> o activá <em>Todos</em>.</li>
                    <li>Indicá <strong>cantidad</strong> y presioná <em>Agregar</em>.</li>
                  </ol>
                </div>
                <div className="mt-4 text-xs opacity-70">El archivo <code>promociones.json</code> se toma automáticamente desde la raíz. Actualizalo cuando cambien las promos.</div>
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" onClick={limpiarFormulario}>Limpiar selección</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de items armados */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2"><Package className="w-5 h-5"/> Lista del pedido ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-sm opacity-70">Todavía no agregaste combinaciones. Armá el pedido y aparecerá acá.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">Sucursal</th>
                      <th>Promo</th>
                      <th>Artículo</th>
                      <th>Talle</th>
                      <th className="text-center">Cant.</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(i => (
                      <tr key={i.id} className="border-b">
                        <td className="py-2">{i.sucursal}</td>
                        <td>{i.promo}</td>
                        <td className="font-mono">{i.art}</td>
                        <td>{i.talle}</td>
                        <td className="text-center">{i.cantidad}</td>
                        <td className="text-right">
                          <Button size="icon" variant="ghost" onClick={()=>quitarItem(i.id)}>
                            <Trash2 className="w-4 h-4"/>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3 justify-end">
              <Button variant="outline" onClick={()=>setItems([])} disabled={!items.length}><Trash2 className="w-4 h-4 mr-2"/> Vaciar</Button>
              <Button onClick={handleDescargar} disabled={!items.length}><Download className="w-4 h-4 mr-2"/> Descargar TXT</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
