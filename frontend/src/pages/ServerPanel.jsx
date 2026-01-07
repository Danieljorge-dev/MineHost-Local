import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Play,
  Square,
  RefreshCw,
  Terminal,
  Settings,
  Puzzle,
  Blocks,
  Globe,
  User,
  Download,
  Send,
  Trash2,
  ExternalLink,
  ChevronLeft,
  Check,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";

// Import sub-components
import ConsoleTab from "../components/server/ConsoleTab";
import PropertiesTab from "../components/server/PropertiesTab";
import ModsTab from "../components/server/ModsTab";
import PluginsTab from "../components/server/PluginsTab";
import WorldsTab from "../components/server/WorldsTab";
import IdentityTab from "../components/server/IdentityTab";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ServerPanel() {
  const { id, tab: urlTab } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [eulaDialog, setEulaDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(urlTab || "console");

  useEffect(() => {
    if (urlTab) setActiveTab(urlTab);
  }, [urlTab]);

  useEffect(() => {
    fetchServer();
    const interval = setInterval(fetchServer, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchServer = async () => {
    try {
      const res = await axios.get(`${API}/servers/${id}`);
      setServer(res.data);
      
      // Check if EULA needs to be accepted
      if (res.data.status === "stopped" && !res.data.eula_accepted) {
        setEulaDialog(true);
      }
    } catch (err) {
      toast.error(t("error_server_not_found"));
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!server.eula_accepted) {
      setEulaDialog(true);
      return;
    }
    
    setActionLoading("start");
    try {
      await axios.post(`${API}/servers/${id}/start`);
      toast.success(t("success"));
      fetchServer();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async () => {
    setActionLoading("stop");
    try {
      await axios.post(`${API}/servers/${id}/stop`);
      toast.success(t("success"));
      fetchServer();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async () => {
    setActionLoading("restart");
    try {
      await axios.post(`${API}/servers/${id}/restart`);
      toast.success(t("success"));
      fetchServer();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptEula = async () => {
    try {
      await axios.post(`${API}/servers/${id}/eula`, { accepted: true });
      toast.success(t("success"));
      setEulaDialog(false);
      fetchServer();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    }
  };

  const handleExport = () => {
    window.open(`${API}/servers/${id}/export`, "_blank");
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    navigate(`/server/${id}/${value}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!server) {
    return null;
  }

  const getStatusColor = () => {
    switch (server.status) {
      case "running":
        return "bg-emerald-500";
      case "stopped":
        return "bg-zinc-500";
      case "downloading":
        return "bg-amber-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-zinc-500";
    }
  };

  return (
    <div data-testid="server-panel-page">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t("nav_dashboard")}
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${server.status === "running" ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold">{server.name}</h1>
              <p className="text-muted-foreground">
                {server.server_type} {server.version} • Port {server.port}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport} data-testid="export-server-btn">
              <Download className="w-4 h-4 mr-2" />
              {t("export")}
            </Button>

            {server.status === "running" ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleRestart}
                  disabled={actionLoading}
                  data-testid="restart-server-btn"
                >
                  {actionLoading === "restart" ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleStop}
                  disabled={actionLoading}
                  data-testid="stop-server-btn"
                >
                  {actionLoading === "stop" ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  {t("control_stop")}
                </Button>
              </>
            ) : server.status === "stopped" ? (
              <Button
                onClick={handleStart}
                disabled={actionLoading}
                data-testid="start-server-btn"
              >
                {actionLoading === "start" ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {t("control_start")}
              </Button>
            ) : (
              <Badge variant="secondary">{t(`server_${server.status}`)}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="console" data-testid="tab-console">
            <Terminal className="w-4 h-4 mr-2" />
            {t("panel_console")}
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="w-4 h-4 mr-2" />
            {t("panel_settings")}
          </TabsTrigger>
          {(server.server_type === "fabric" || server.server_type === "forge") && (
            <TabsTrigger value="mods" data-testid="tab-mods">
              <Puzzle className="w-4 h-4 mr-2" />
              {t("panel_mods")}
            </TabsTrigger>
          )}
          {server.server_type === "paper" && (
            <TabsTrigger value="plugins" data-testid="tab-plugins">
              <Blocks className="w-4 h-4 mr-2" />
              {t("panel_plugins")}
            </TabsTrigger>
          )}
          <TabsTrigger value="worlds" data-testid="tab-worlds">
            <Globe className="w-4 h-4 mr-2" />
            {t("panel_worlds")}
          </TabsTrigger>
          <TabsTrigger value="identity" data-testid="tab-identity">
            <User className="w-4 h-4 mr-2" />
            {t("panel_identity")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="console">
          <ConsoleTab serverId={id} serverStatus={server.status} />
        </TabsContent>

        <TabsContent value="settings">
          <PropertiesTab serverId={id} />
        </TabsContent>

        <TabsContent value="mods">
          <ModsTab serverId={id} serverVersion={server.version} serverType={server.server_type} />
        </TabsContent>

        <TabsContent value="plugins">
          <PluginsTab serverId={id} serverVersion={server.version} />
        </TabsContent>

        <TabsContent value="worlds">
          <WorldsTab serverId={id} />
        </TabsContent>

        <TabsContent value="identity">
          <IdentityTab serverId={id} server={server} onUpdate={fetchServer} />
        </TabsContent>
      </Tabs>

      {/* EULA Dialog */}
      <Dialog open={eulaDialog} onOpenChange={setEulaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("eula_title")}</DialogTitle>
            <DialogDescription>{t("eula_description")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <a
              href="https://www.minecraft.net/en-us/eula"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary hover:underline"
            >
              {t("eula_read")}
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEulaDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              {t("eula_decline")}
            </Button>
            <Button onClick={handleAcceptEula} data-testid="accept-eula-btn">
              <Check className="w-4 h-4 mr-2" />
              {t("eula_accept")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
