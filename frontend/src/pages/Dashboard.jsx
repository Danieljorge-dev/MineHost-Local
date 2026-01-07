import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Plus,
  Play,
  Square,
  RefreshCw,
  Users,
  Server,
  Upload,
  MoreVertical,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SERVER_TYPE_IMAGES = {
  vanilla: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop",
  paper: "https://images.unsplash.com/photo-1656332429198-ef6adbe93857?w=400&h=200&fit=crop",
  fabric: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop",
  forge: "https://images.unsplash.com/photo-1656332429198-ef6adbe93857?w=400&h=200&fit=crop",
};

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, server: null });
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    try {
      const res = await axios.get(`${API}/servers`);
      setServers(res.data);
    } catch (err) {
      console.error("Failed to fetch servers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (serverId) => {
    setActionLoading((prev) => ({ ...prev, [serverId]: "start" }));
    try {
      await axios.post(`${API}/servers/${serverId}/start`);
      toast.success(t("success"));
      fetchServers();
    } catch (err) {
      const detail = err.response?.data?.detail || t("error");
      toast.error(detail);
    } finally {
      setActionLoading((prev) => ({ ...prev, [serverId]: null }));
    }
  };

  const handleStop = async (serverId) => {
    setActionLoading((prev) => ({ ...prev, [serverId]: "stop" }));
    try {
      await axios.post(`${API}/servers/${serverId}/stop`);
      toast.success(t("success"));
      fetchServers();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setActionLoading((prev) => ({ ...prev, [serverId]: null }));
    }
  };

  const handleRestart = async (serverId) => {
    setActionLoading((prev) => ({ ...prev, [serverId]: "restart" }));
    try {
      await axios.post(`${API}/servers/${serverId}/restart`);
      toast.success(t("success"));
      fetchServers();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setActionLoading((prev) => ({ ...prev, [serverId]: null }));
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.server) return;
    
    try {
      await axios.delete(`${API}/servers/${deleteDialog.server.id}`);
      toast.success(t("success"));
      fetchServers();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setDeleteDialog({ open: false, server: null });
    }
  };

  const handleExport = async (server) => {
    try {
      window.open(`${API}/servers/${server.id}/export`, "_blank");
    } catch (err) {
      toast.error(t("error"));
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API}/servers/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(t("success"));
      fetchServers();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    }

    event.target.value = "";
  };

  const getStatusBadge = (status) => {
    const badges = {
      running: { class: "status-badge-running", icon: <div className="w-2 h-2 rounded-full bg-emerald-500 status-indicator-running" /> },
      stopped: { class: "status-badge-stopped", icon: <div className="w-2 h-2 rounded-full bg-zinc-500" /> },
      downloading: { class: "status-badge-downloading", icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
      error: { class: "status-badge-error", icon: <div className="w-2 h-2 rounded-full bg-red-500" /> },
    };
    return badges[status] || badges.stopped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">{t("dashboard_title")}</h1>
          <p className="text-muted-foreground mt-1">
            {servers.length} {servers.length === 1 ? "server" : "servers"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label>
            <input
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleImport}
              data-testid="import-server-input"
            />
            <Button variant="outline" asChild>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {t("import")}
              </span>
            </Button>
          </label>
          <Button asChild data-testid="create-server-btn">
            <Link to="/create">
              <Plus className="w-4 h-4 mr-2" />
              {t("nav_create")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Servers Grid */}
      {servers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
            <Server className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">{t("dashboard_empty")}</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">{t("dashboard_empty_desc")}</p>
          <Button asChild data-testid="create-first-server-btn">
            <Link to="/create">
              <Plus className="w-4 h-4 mr-2" />
              {t("dashboard_create_first")}
            </Link>
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server, index) => (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="server-card overflow-hidden cursor-pointer group"
                onClick={() => navigate(`/server/${server.id}`)}
                data-testid={`server-card-${server.id}`}
              >
                <div className="server-card-border" />
                
                {/* Cover Image */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={SERVER_TYPE_IMAGES[server.server_type] || SERVER_TYPE_IMAGES.vanilla}
                    alt={server.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`status-badge ${getStatusBadge(server.status).class}`}>
                      {getStatusBadge(server.status).icon}
                      {t(`server_${server.status}`)}
                    </span>
                  </div>

                  {/* Menu */}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExport(server); }}>
                          <Download className="w-4 h-4 mr-2" />
                          {t("export")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, server }); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-bold text-lg">{server.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {server.server_type} {server.version}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{server.players_online}/{server.max_players}</span>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      :{server.port}
                    </div>
                  </div>

                  {/* e4mc Public IP */}
                  {server.e4mc_enabled && server.public_ip && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">IP Público (e4mc)</p>
                          <p className="text-sm font-mono text-blue-900 dark:text-blue-100">{server.public_ip}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(server.public_ip);
                            toast.success(t("copied_to_clipboard"));
                          }}
                          title="Copiar IP"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    {server.status === "running" ? (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => { e.stopPropagation(); handleStop(server.id); }}
                          disabled={actionLoading[server.id]}
                          data-testid={`stop-btn-${server.id}`}
                        >
                          {actionLoading[server.id] === "stop" ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => { e.stopPropagation(); handleRestart(server.id); }}
                          disabled={actionLoading[server.id]}
                          data-testid={`restart-btn-${server.id}`}
                        >
                          {actionLoading[server.id] === "restart" ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                      </>
                    ) : server.status === "stopped" ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); handleStart(server.id); }}
                        disabled={actionLoading[server.id] || !server.eula_accepted}
                        data-testid={`start-btn-${server.id}`}
                      >
                        {actionLoading[server.id] === "start" ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        {t("control_start")}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1" disabled>
                        {server.status === "downloading" ? t("server_downloading") : t("server_error")}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")} {deleteDialog.server?.name}?</AlertDialogTitle>
            <AlertDialogDescription>{t("confirm_delete_server")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
