import { useState } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../context/AppContext";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Pencil, Trash, Plus, ArrowLeft } from "lucide-react";

export function TablesEdit() {
  const navigate = useNavigate();
  const { tables, addTable, updateTable, deleteTable } = useApp();

  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState(50);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRate, setEditRate] = useState(50);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addTable(newName, newRate);
    setNewName("");
    setNewRate(50);
  };

  const handleUpdate = (id: string) => {
    updateTable(id, editName, editRate);
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

        {/* Crear mesa */}
        <div className="flex flex-wrap gap-2 items-end">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de mesa"
            className="px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700 flex-1 min-w-[200px]"
          />
          <input
            type="number"
            value={newRate}
            onChange={(e) => setNewRate(Number(e.target.value))}
            placeholder="Tarifa/hr"
            className="px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700 w-[100px]"
          />
          <Button onClick={handleAdd} disabled={!newName.trim()}>
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
                      value={editRate}
                      onChange={(e) => setEditRate(Number(e.target.value))}
                      className="px-2 py-1 bg-zinc-800 text-white border border-zinc-700 rounded w-[80px]"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{table.name}</span>
                    <span className="px-2 py-1 bg-zinc-700 text-xs rounded-full text-zinc-300">
                      ${table.hourly_rate}/hr
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {editingId === table.id ? (
                  <Button onClick={() => handleUpdate(table.id)} disabled={!editName.trim()} size="sm">
                    Guardar
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setEditingId(table.id);
                      setEditName(table.name);
                      setEditRate(table.hourly_rate);
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

