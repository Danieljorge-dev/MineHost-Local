import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Send, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://");

export default function ConsoleTab({ serverId, serverStatus }) {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Fetch initial logs
    fetchLogs();

    // Connect WebSocket if server is running
    if (serverStatus === "running") {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [serverId, serverStatus]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/servers/${serverId}/logs?lines=200`);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket(`${WS_URL}/api/ws/servers/${serverId}/logs`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        setLogs((prev) => [...prev.slice(-999), log]);
      } catch (err) {
        console.error("Failed to parse log:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    wsRef.current = ws;
  };

  const handleSendCommand = async () => {
    if (!command.trim()) return;

    setSending(true);
    try {
      await axios.post(`${API}/servers/${serverId}/command`, { command });
      setCommand("");
    } catch (err) {
      console.error("Failed to send command:", err);
    } finally {
      setSending(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const getLogClass = (message) => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("[warn]") || lowerMsg.includes("warn:")) {
      return "console-log-warn";
    }
    if (lowerMsg.includes("[error]") || lowerMsg.includes("error:") || lowerMsg.includes("exception")) {
      return "console-log-error";
    }
    if (lowerMsg.includes("[info]") || lowerMsg.includes("info:")) {
      return "console-log-info";
    }
    return "console-log-default";
  };

  const formatTimestamp = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <Card className="overflow-hidden" data-testid="console-tab">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <h3 className="font-heading font-bold">{t("console_title")}</h3>
        <Button variant="ghost" size="sm" onClick={handleClearLogs} data-testid="clear-console-btn">
          <Trash2 className="w-4 h-4 mr-2" />
          {t("console_clear")}
        </Button>
      </div>

      {/* Console Output */}
      <div
        ref={scrollRef}
        className="console-bg h-96 overflow-y-auto console-scroll font-mono text-sm"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {serverStatus === "running" ? t("loading") : t("server_stopped")}
          </div>
        ) : (
          <div className="p-4 space-y-0.5">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`console-line ${getLogClass(log.message)}`}
              >
                <span className="console-timestamp text-muted-foreground select-none">
                  [{formatTimestamp(log.time)}]
                </span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Command Input */}
      <div className="flex items-center gap-2 p-3 border-t border-border bg-card">
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={t("console_placeholder")}
          className="font-mono"
          disabled={serverStatus !== "running"}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendCommand();
          }}
          data-testid="console-command-input"
        />
        <Button
          onClick={handleSendCommand}
          disabled={serverStatus !== "running" || sending || !command.trim()}
          data-testid="send-command-btn"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
