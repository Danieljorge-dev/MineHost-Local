import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Download, Trash2, RefreshCw, ExternalLink } from "lucide-react";
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

export default function PluginsTab({ serverId, serverVersion }) {
  const { t } = useTranslation();
  const [installedPlugins, setInstalledPlugins] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [installing, setInstalling] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, plugin: null });

  useEffect(() => {
    fetchInstalledPlugins();
  }, [serverId]);

  const fetchInstalledPlugins = async () => {
    try {
      const res = await axios.get(`${API}/servers/${serverId}/plugins`);
      setInstalledPlugins(res.data.plugins || []);
    } catch (err) {
      console.error("Failed to fetch plugins:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await axios.get(`${API}/plugins/search`, {
        params: {
          query: searchQuery,
          limit: 20,
        },
      });
      setSearchResults(res.data.plugins || []);
    } catch (err) {
      toast.error(t("error"));
    } finally {
      setSearching(false);
    }
  };

  const handleInstall = async (plugin) => {
    setInstalling(plugin.project_id);
    try {
      // Get versions for this plugin
      const versionsRes = await axios.get(`${API}/mods/${plugin.project_id}/versions`, {
        params: {
          loader: "paper",
          game_version: serverVersion,
        },
      });

      const versions = versionsRes.data.versions || [];
      if (versions.length === 0) {
        toast.error("No compatible version found");
        return;
      }

      // Install the first compatible version
      await axios.post(`${API}/servers/${serverId}/plugins`, null, {
        params: {
          plugin_id: plugin.project_id,
          version_id: versions[0].id,
        },
      });

      toast.success(t("plugins_install_success"));
      fetchInstalledPlugins();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setInstalling(null);
    }
  };

  const handleRemove = async () => {
    if (!deleteDialog.plugin) return;

    try {
      await axios.delete(`${API}/servers/${serverId}/mods/${deleteDialog.plugin.filename}`);
      toast.success(t("success"));
      fetchInstalledPlugins();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setDeleteDialog({ open: false, plugin: null });
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
    <Card className="p-6" data-testid="plugins-tab">
      <Tabs defaultValue="installed">
        <TabsList className="mb-6">
          <TabsTrigger value="installed">{t("plugins_installed")}</TabsTrigger>
          <TabsTrigger value="browse">{t("plugins_browse")}</TabsTrigger>
        </TabsList>

        {/* Installed Plugins */}
        <TabsContent value="installed">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-secondary rounded-lg" />
              ))}
            </div>
          ) : installedPlugins.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("plugins_no_installed")}
            </div>
          ) : (
            <div className="space-y-3">
              {installedPlugins.map((plugin) => (
                <div
                  key={plugin.filename}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium font-mono">{plugin.filename}</p>
                    <p className="text-sm text-muted-foreground">{formatBytes(plugin.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteDialog({ open: true, plugin })}
                    data-testid={`remove-plugin-${plugin.filename}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Browse Plugins */}
        <TabsContent value="browse">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("plugins_search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                  data-testid="plugins-search-input"
                />
              </div>
              <Button onClick={handleSearch} disabled={searching} data-testid="plugins-search-btn">
                {searching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  t("search")
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Powered by Modrinth • Paper {serverVersion}
            </p>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("search")}...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {searchResults.map((plugin) => (
                <div key={plugin.project_id} className="mod-card">
                  <div className="flex items-start gap-3">
                    {plugin.icon_url ? (
                      <img
                        src={plugin.icon_url}
                        alt={plugin.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        <span className="text-lg font-bold text-muted-foreground">
                          {plugin.title?.[0] || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{plugin.title}</h4>
                        <a
                          href={`https://modrinth.com/plugin/${plugin.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {plugin.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {plugin.downloads?.toLocaleString() || 0} downloads
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-3"
                    size="sm"
                    onClick={() => handleInstall(plugin)}
                    disabled={installing === plugin.project_id}
                    data-testid={`install-plugin-${plugin.project_id}`}
                  >
                    {installing === plugin.project_id ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {t("install")}
                  </Button>
                </div>
              ))}
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
            <AlertDialogTitle>{t("remove")} {deleteDialog.plugin?.filename}?</AlertDialogTitle>
            <AlertDialogDescription>{t("confirm_delete_mod")}</AlertDialogDescription>
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
