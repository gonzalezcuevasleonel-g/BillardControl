import { useState } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../context/AppContext";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Pencil, Trash, Plus, ArrowLeft } from "lucide-react";

const TABLE_TYPES = [
  { label: "Billar", rate: 50 },
  { label: "Snorkel", rate: 60 },
  { label: "Carambola", rate: 70 },
];

function getTypeByRate(rate: number) {
  return TABLE_TYPES.find((t) => t.rate === rate)?.label || "Mesa";
}

export function TablesEdit() {
  const navigate = useNavigate();
  const { tables, addTable, updateTable, deleteTable } = useApp();

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const handleAdd = () => {
    if (!newName.trim() || !newPrice) return;
    addTable(newName, parseFloat(newPrice));
    setNewName("");
    setNewPrice("");
  };

  const handleUpdate = (id: number) => {
    if (!editName.trim() || !editPrice) return;
    updateTable(id, editName, parseFloat(editPrice));
    setEditingId(null);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => navigate('/tables')}
            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Mesas
          </Button>
          <h1 className="text-2xl font-bold text-white">Editar Mesas</h1>
        </div>

        <div className="flex flex-wrap gap-2 items-end bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-lg">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Nombre de Mesa</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Mesa x"
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700 focus:border-green-500 outline-none transition-colors"
            />
          </div>
          <div className="w-[150px]">
            <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Precio/Hora</label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="$0.00"
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700 focus:border-green-500 outline-none transition-colors"
            />
          </div>
          <div className="w-[200px]">
            <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Tipo de mesa</label>
            <select
              onChange={(e) => {
                const type = TABLE_TYPES.find(t => t.label === e.target.value);
                if (type) setNewPrice(type.rate.toString());
              }}
              className="w-full px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700 outline-none"
            >
              <option value="">Seleccionar tipo...</option>
              {TABLE_TYPES.map((t) => (
                <option key={t.label} >
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!newName.trim() || !newPrice}
            className="bg-green-500 hover:bg-green-600 text-black font-bold h-10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-800"
            >
              <div className="flex gap-3 items-center min-w-0 flex-1">
                {editingId === table.id ? (
                  <div className="flex gap-2 items-end w-full">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-2 py-1 bg-zinc-800 text-white border border-zinc-700 rounded flex-1 min-w-0"
                    />
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-24 px-2 py-1 bg-zinc-800 text-white border border-zinc-700 rounded"
                      placeholder="Precio"
                    />
                    <select
                      onChange={(e) => {
                        const type = TABLE_TYPES.find(t => t.label === e.target.value);
                        if (type) setEditPrice(type.rate.toString());
                      }}
                      className="w-32 px-2 py-1 bg-zinc-800 text-white border border-zinc-700 rounded text-xs"
                    >
                      <option value="">Tipo...</option>
                      {TABLE_TYPES.map((t) => (
                        <option key={t.label} value={t.label}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{table.name}</span>
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20 font-bold">
                      ${table.hourly_rate}/hr
                    </span>
                    <span className="px-2 py-1 bg-zinc-700 text-[10px] rounded text-zinc-300">
                      {getTypeByRate(table.hourly_rate)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {editingId === table.id ? (
                  <Button onClick={() => handleUpdate(table.id)} disabled={!editName.trim() || !editPrice} size="sm">
                    Guardar
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setEditingId(table.id);
                      setEditName(table.name);
                      setEditPrice(table.hourly_rate.toString());
                    }}
                    size="sm"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  onClick={() => deleteTable(table.id)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

