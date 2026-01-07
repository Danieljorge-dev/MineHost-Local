import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Download, Trash2, RefreshCw, ExternalLink, Package, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ModsTab({ serverId, serverVersion, serverType }) {
  const { t } = useTranslation();
  const [installedMods, setInstalledMods] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [installing, setInstalling] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mod: null });

  useEffect(() => {
    fetchInstalledMods();
    const interval = setInterval(fetchInstalledMods, 5000);
    return () => clearInterval(interval);
  }, [serverId]);

  const fetchInstalledMods = async () => {
    try {
      const res = await axios.get(`${API}/servers/${serverId}/mods`);
      setInstalledMods(res.data.mods || []);
    } catch (err) {
      console.error("Failed to fetch mods:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const loader = serverType === "forge" ? "forge" : "fabric";
      const res = await axios.get(`${API}/mods/search`, {
        params: {
          query: searchQuery,
          loader,
          version: serverVersion,
          limit: 20,
        },
      });
      setSearchResults(res.data.mods || []);
    } catch (err) {
      toast.error(t("error"));
    } finally {
      setSearching(false);
    }
  };

  const handleInstall = async (mod) => {
    setInstalling(mod.project_id);
    try {
      // Get versions for this mod
      const loader = serverType === "forge" ? "forge" : "fabric";
      const versionsRes = await axios.get(`${API}/mods/${mod.project_id}/versions`, {
        params: {
          loader,
          game_version: serverVersion,
        },
      });

      const versions = versionsRes.data.versions || [];
      if (versions.length === 0) {
        toast.error("No compatible version found");
        return;
      }

      // Install the first compatible version
      const installRes = await axios.post(`${API}/servers/${serverId}/mods`, null, {
        params: {
          mod_id: mod.project_id,
          version_id: versions[0].id,
        },
      });

      const installed = installRes.data.installed || [];
      const depCount = installed.filter(i => i.is_dependency).length;
      
      toast.success(
        depCount > 0 
          ? `${t("mods_install_success")} + ${depCount} dependencies`
          : t("mods_install_success")
      );
      
      fetchInstalledMods();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setInstalling(null);
    }
  };

  const handleRemove = async () => {
    if (!deleteDialog.mod) return;

    try {
      await axios.delete(`${API}/servers/${serverId}/mods/${deleteDialog.mod.filename}`);
      toast.success(t("success"));
      fetchInstalledMods();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setDeleteDialog({ open: false, mod: null });
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="p-6" data-testid="mods-tab">
      <Tabs defaultValue="installed">
        <TabsList className="mb-6">
          <TabsTrigger value="installed">
            {t("mods_installed")} ({installedMods.length})
          </TabsTrigger>
          <TabsTrigger value="browse">{t("mods_browse")}</TabsTrigger>
        </TabsList>

        {/* Installed Mods */}
        <TabsContent value="installed">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-secondary rounded-lg" />
              ))}
            </div>
          ) : installedMods.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">{t("mods_no_installed")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {installedMods.map((mod) => (
                <div
                  key={mod.filename}
                  className="flex items-start justify-between p-4 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">{mod.mod_name || mod.filename}</p>
                      {mod.mod_version && (
                        <Badge variant="outline" className="text-xs">
                          v{mod.mod_version}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{mod.filename}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatBytes(mod.size)}</p>

                    {/* Dependencies */}
                    {mod.dependencies && mod.dependencies.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                            Dependencies ({mod.dependencies.length})
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {mod.dependencies.map((dep, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {dep.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteDialog({ open: true, mod })}
                    data-testid={`remove-mod-${mod.filename}`}
                    className="ml-4"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Browse Mods */}
        <TabsContent value="browse">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("mods_search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                  data-testid="mods-search-input"
                />
              </div>
              <Button onClick={handleSearch} disabled={searching} data-testid="mods-search-btn">
                {searching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  t("search")
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Powered by Modrinth • {serverType} {serverVersion}
            </p>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("search")}...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {searchResults.map((mod) => {
                const isInstalled = installedMods.some(
                  m => m.mod_name?.toLowerCase() === mod.title.toLowerCase() ||
                       m.filename?.toLowerCase() === mod.title.toLowerCase()
                );
                return (
                  <div
                    key={mod.project_id}
                    className="mod-card p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {mod.icon_url ? (
                        <img
                          src={mod.icon_url}
                          alt={mod.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-muted-foreground">
                            {mod.title?.[0] || "?"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{mod.title}</h4>
                          {isInstalled && (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                          <a
                            href={`https://modrinth.com/mod/${mod.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {(mod.downloads / 1000).toFixed(1)}k
                      </Badge>
                    </div>

                    <Button
                      className="w-full"
                      size="sm"
                      disabled={isInstalled || installing === mod.project_id}
                      onClick={() => handleInstall(mod)}
                      data-testid={`install-mod-${mod.project_id}`}
                      variant={isInstalled ? "secondary" : "default"}
                    >
                      {installing === mod.project_id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Installing...
                        </>
                      ) : isInstalled ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Installed
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          {t("install")}
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("remove")} {deleteDialog.mod?.mod_name || deleteDialog.mod?.filename}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm_delete_mod")}
              {deleteDialog.mod?.dependencies && deleteDialog.mod.dependencies.length > 0 && (
                <p className="mt-2 text-amber-600 dark:text-amber-400 text-sm">
                  ⚠️ This mod has dependencies
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive">
              {t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
