import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Download, Trash2, Globe, FolderOpen, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { toast } from "sonner";
import axios from "axios";
import SeedsExplorer from "./SeedsExplorer";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WorldsTab({ serverId }) {
  const { t } = useTranslation();
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, world: null });
  const [newWorldName, setNewWorldName] = useState("");
  const [newWorldSeed, setNewWorldSeed] = useState("");
  const [creatingWorld, setCreatingWorld] = useState(false);

  useEffect(() => {
    fetchWorlds();
  }, [serverId]);

  const fetchWorlds = async () => {
    try {
      const res = await axios.get(`${API}/servers/${serverId}/worlds`);
      setWorlds(res.data.worlds || []);
    } catch (err) {
      console.error("Failed to fetch worlds:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API}/servers/${serverId}/worlds/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(t("success"));
      fetchWorlds();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleCreateWorld = async () => {
    if (!newWorldName.trim()) {
      toast.error("Nome do mundo é obrigatório");
      return;
    }

    setCreatingWorld(true);
    try {
      // Cria o diretório do mundo (backend)
      await axios.post(`${API}/servers/${serverId}/worlds`, {
        name: newWorldName,
        seed: newWorldSeed || undefined
      });
      toast.success("Mundo criado com sucesso!");
      setNewWorldName("");
      setNewWorldSeed("");
      fetchWorlds();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao criar mundo");
    } finally {
      setCreatingWorld(false);
    }
  };

  const handleExport = (worldName) => {
    window.open(`${API}/servers/${serverId}/worlds/${worldName}/export`, "_blank");
  };

  const handleDelete = async () => {
    if (!deleteDialog.world) return;

    try {
      await axios.delete(`${API}/servers/${serverId}/worlds/${deleteDialog.world.name}`);
      toast.success(t("success"));
      fetchWorlds();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setDeleteDialog({ open: false, world: null });
    }
  };

  const handleSelectSeed = (seed) => {
    setNewWorldSeed(seed);
    toast.success("Seed selecionada!");
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="p-6" data-testid="worlds-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-bold text-xl">{t("worlds_title")}</h3>
        <Button size="sm" onClick={fetchWorlds} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="existing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="existing">Mundos Existentes</TabsTrigger>
          <TabsTrigger value="create">Criar Mundo</TabsTrigger>
          <TabsTrigger value="import">Importar Mundo</TabsTrigger>
        </TabsList>

        {/* Mundos Existentes */}
        <TabsContent value="existing" className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-secondary rounded-lg" />
              ))}
            </div>
          ) : worlds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum mundo criado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {worlds.map((world) => (
                <div
                  key={world.name}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium">{world.name}</p>
                      <p className="text-sm text-muted-foreground">{formatBytes(world.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(world.name)}
                      data-testid={`export-world-${world.name}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t("worlds_export")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteDialog({ open: true, world })}
                      data-testid={`delete-world-${world.name}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Criar Mundo */}
        <TabsContent value="create" className="space-y-4">
          <div className="space-y-4">
            {/* Nome do Mundo */}
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Mundo</label>
              <Input
                placeholder="ex: Mundo Principal"
                value={newWorldName}
                onChange={(e) => setNewWorldName(e.target.value)}
              />
            </div>

            {/* Seed Manual */}
            <div>
              <label className="text-sm font-medium mb-2 block">Seed (Opcional)</label>
              <Input
                placeholder="Deixe vazio para aleatória"
                value={newWorldSeed}
                onChange={(e) => setNewWorldSeed(e.target.value)}
              />
            </div>

            {/* Explorer de Seeds */}
            <SeedsExplorer onSelectSeed={handleSelectSeed} />

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreateWorld}
                disabled={creatingWorld || !newWorldName.trim()}
                className="flex-1"
              >
                {creatingWorld ? "Criando..." : "Criar Mundo"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setNewWorldName("");
                  setNewWorldSeed("");
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Importar Mundo */}
        <TabsContent value="import" className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".zip"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Clique para selecionar ou arraste um arquivo</p>
                  <p className="text-sm text-muted-foreground">
                    Apenas arquivos .zip são aceitos
                  </p>
                </div>
              </div>
            </label>
            {uploading && (
              <p className="mt-4 text-sm text-muted-foreground">Enviando...</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")} {deleteDialog.world?.name}?</AlertDialogTitle>
            <AlertDialogDescription>{t("confirm_delete_world")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
