import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Save, Info, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Property definitions with descriptions and warnings
const PROPERTY_INFO = {
  "server-port": {
    description: "Port the server listens on",
    type: "number",
    default: "25565",
  },
  "gamemode": {
    description: "Default game mode for players",
    type: "select",
    options: ["survival", "creative", "adventure", "spectator"],
    default: "survival",
  },
  "difficulty": {
    description: "World difficulty level",
    type: "select",
    options: ["peaceful", "easy", "normal", "hard"],
    default: "normal",
  },
  "max-players": {
    description: "Maximum players allowed",
    type: "number",
    default: "20",
  },
  "motd": {
    description: "Message shown in server list",
    type: "text",
    default: "A Minecraft Server",
  },
  "pvp": {
    description: "Allow player vs player combat",
    type: "boolean",
    default: "true",
  },
  "spawn-protection": {
    description: "Radius of spawn protection (0 to disable)",
    type: "number",
    default: "16",
  },
  "view-distance": {
    description: "Render distance in chunks",
    type: "number",
    default: "10",
    warning: "Higher values increase server load",
  },
  "simulation-distance": {
    description: "Entity simulation distance in chunks",
    type: "number",
    default: "10",
    warning: "Higher values increase CPU usage",
  },
  "online-mode": {
    description: "Verify player accounts with Mojang",
    type: "boolean",
    default: "true",
    warning: "Disable only for offline/LAN play",
  },
  "white-list": {
    description: "Only allow whitelisted players",
    type: "boolean",
    default: "false",
  },
  "spawn-animals": {
    description: "Allow animal spawning",
    type: "boolean",
    default: "true",
  },
  "spawn-monsters": {
    description: "Allow monster spawning",
    type: "boolean",
    default: "true",
  },
  "spawn-npcs": {
    description: "Allow villager spawning",
    type: "boolean",
    default: "true",
  },
  "allow-flight": {
    description: "Allow survival flight (anti-cheat)",
    type: "boolean",
    default: "false",
  },
  "level-name": {
    description: "Name of the world folder",
    type: "text",
    default: "world",
  },
  "level-seed": {
    description: "Seed for world generation (empty = random)",
    type: "text",
    default: "",
  },
  "level-type": {
    description: "Type of world generation",
    type: "select",
    options: ["default", "flat", "large_biomes", "amplified"],
    default: "default",
  },
  "enable-command-block": {
    description: "Allow command blocks to execute commands",
    type: "boolean",
    default: "false",
    warning: "Security risk - only enable if you trust all admins",
  },
  "enable-rcon": {
    description: "Enable remote console access",
    type: "boolean",
    default: "false",
    warning: "Security risk - ensure strong rcon.password",
  },
  "rcon.password": {
    description: "Password for remote console access",
    type: "text",
    default: "",
    warning: "Use a strong password if RCON is enabled",
  },
  "query.port": {
    description: "Port for server query protocol",
    type: "number",
    default: "25565",
  },
  "enable-query": {
    description: "Enable server query protocol",
    type: "boolean",
    default: "false",
  },
  "prevent-proxy-connections": {
    description: "Disconnect players using proxy IPs",
    type: "boolean",
    default: "false",
  },
  "broadcast-console-to-ops": {
    description: "Send console messages to ops",
    type: "boolean",
    default: "true",
  },
  "broadcast-rcon-to-ops": {
    description: "Send RCON output to ops",
    type: "boolean",
    default: "true",
  },
  "op-permission-level": {
    description: "Permission level for ops (1-4)",
    type: "select",
    options: ["1", "2", "3", "4"],
    default: "4",
  },
  "function-permission-level": {
    description: "Permission level for functions",
    type: "select",
    options: ["1", "2", "3", "4"],
    default: "2",
  },
  "entity-broadcast-range-percentage": {
    description: "Percentage of entity update distance",
    type: "number",
    default: "100",
    warning: "Lower values = less server load but bigger sync issues",
  },
  "rate-limit": {
    description: "Limit packets per second per player",
    type: "number",
    default: "-1",
  },
  "sync-chunk-writes": {
    description: "Wait for chunks to save before closing",
    type: "boolean",
    default: "true",
  },
  "hide-online-players": {
    description: "Hide online player count (shows ??? players)",
    type: "boolean",
    default: "false",
  },
  "network-compression-threshold": {
    description: "Bytes to compress network data (disable = -1)",
    type: "number",
    default: "256",
  },
  "max-tick-time": {
    description: "Max milliseconds per tick before watchdog kills",
    type: "number",
    default: "60000",
    warning: "Too low may cause unnecessary crashes",
  },
  "use-native-transport": {
    description: "Use system-native networking (Linux/Windows only)",
    type: "boolean",
    default: "true",
  },
  "debug": {
    description: "Enable debug logging",
    type: "boolean",
    default: "false",
    warning: "Generates large log files - disable in production",
  },
  "enable-command-block": {
    description: "Enable command blocks",
    type: "boolean",
    default: "false",
    warning: "Can be used for griefing",
  },
  "level-name": {
    description: "World folder name",
    type: "text",
    default: "world",
  },
  "level-type": {
    description: "World generation type",
    type: "select",
    options: ["minecraft:normal", "minecraft:flat", "minecraft:large_biomes", "minecraft:amplified"],
    default: "minecraft:normal",
  },
  "level-seed": {
    description: "World seed (leave empty for random)",
    type: "text",
    default: "",
  },
  "enforce-secure-profile": {
    description: "Require signed chat messages",
    type: "boolean",
    default: "true",
    warning: "Disable for offline mode compatibility",
  },
};

export default function PropertiesTab({ serverId }) {
  const { t } = useTranslation();
  const [properties, setProperties] = useState({});
  const [originalProperties, setOriginalProperties] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProperties();
  }, [serverId]);

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API}/servers/${serverId}/properties`);
      setProperties(res.data.properties || {});
      setOriginalProperties(res.data.properties || {});
    } catch (err) {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/servers/${serverId}/properties`, { properties });
      setOriginalProperties(properties);
      toast.success(t("properties_saved"));
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setProperties({ ...properties, [key]: value });
  };

  const hasChanges = JSON.stringify(properties) !== JSON.stringify(originalProperties);

  const filteredProperties = Object.entries(properties).filter(([key]) =>
    key.toLowerCase().includes(search.toLowerCase())
  );

  const renderPropertyInput = (key, value) => {
    const info = PROPERTY_INFO[key];
    const type = info?.type || "text";

    if (type === "boolean") {
      return (
        <Switch
          checked={value === "true"}
          onCheckedChange={(checked) => handleChange(key, checked ? "true" : "false")}
          data-testid={`prop-${key}`}
        />
      );
    }

    if (type === "select" && info?.options) {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-48 px-3 py-2 rounded-md bg-secondary border border-border text-sm"
          data-testid={`prop-${key}`}
        >
          {info.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (type === "number") {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-48 font-mono"
          data-testid={`prop-${key}`}
        />
      );
    }

    return (
      <Input
        type="text"
        value={value}
        onChange={(e) => handleChange(key, e.target.value)}
        className="w-64"
        data-testid={`prop-${key}`}
      />
    );
  };

  if (loading) {
    return <div className="animate-pulse h-96 bg-secondary rounded-xl" />;
  }

  return (
    <Card className="p-6" data-testid="properties-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-bold text-xl">{t("properties_title")}</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("properties_search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
              data-testid="properties-search"
            />
          </div>
          <Button onClick={handleSave} disabled={saving || !hasChanges} data-testid="save-properties-btn">
            <Save className="w-4 h-4 mr-2" />
            {t("save")}
          </Button>
        </div>
      </div>

      {/* Properties List */}
      <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin">
        <TooltipProvider>
          {filteredProperties.map(([key, value]) => {
            const info = PROPERTY_INFO[key];

            return (
              <div
                key={key}
                className="property-row flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{key}</span>
                  {info?.description && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{info.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {info?.warning && (
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-amber-500">{info.warning}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {renderPropertyInput(key, value)}
              </div>
            );
          })}
        </TooltipProvider>

        {filteredProperties.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No properties found matching "{search}"
          </div>
        )}
      </div>
    </Card>
  );
}
