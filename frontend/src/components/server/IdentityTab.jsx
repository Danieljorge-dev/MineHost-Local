import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Trash2, Save, Image as ImageIcon, RefreshCw } from "lucide-react";

// Separate component for icon preview to avoid innerHTML issues
function IconPreview({ serverId }) {
  const [hasError, setHasError] = useState(false);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
  
  if (hasError) {
    return <ImageIcon className="w-8 h-8 text-muted-foreground" />;
  }
  
  return (
    <img
      src={`${API}/servers/${serverId}/icon?t=${Date.now()}`}
      alt="Server Icon"
      className="server-icon w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Minecraft color codes
const MC_COLORS = {
  "§0": "#000000",
  "§1": "#0000AA",
  "§2": "#00AA00",
  "§3": "#00AAAA",
  "§4": "#AA0000",
  "§5": "#AA00AA",
  "§6": "#FFAA00",
  "§7": "#AAAAAA",
  "§8": "#555555",
  "§9": "#5555FF",
  "§a": "#55FF55",
  "§b": "#55FFFF",
  "§c": "#FF5555",
  "§d": "#FF55FF",
  "§e": "#FFFF55",
  "§f": "#FFFFFF",
};

export default function IdentityTab({ serverId, server, onUpdate }) {
  const { t } = useTranslation();
  const [name, setName] = useState(server?.name || "");
  const [motd, setMotd] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("normal");
  const [gameMode, setGameMode] = useState("survival");
  const [pvp, setPvp] = useState("on");
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: name || undefined,
        motd: motd || undefined,
      };
      
      await axios.put(`${API}/servers/${serverId}`, payload);
      
      // Salvar configurações adicionais em server.properties
      const configPayload = {
        difficulty: difficulty,
        gamemode: gameMode,
        pvp: pvp === "on" ? "true" : "false",
      };
      
      await axios.put(`${API}/servers/${serverId}/properties`, configPayload);
      toast.success("Servidor atualizado com sucesso!");
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleIconUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploadingIcon(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API}/servers/${serverId}/icon`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(t("success"));
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setUploadingIcon(false);
      event.target.value = "";
    }
  };

  const handleIconDelete = async () => {
    try {
      await axios.delete(`${API}/servers/${serverId}/icon`);
      toast.success(t("success"));
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    }
  };

  // Parse MOTD with Minecraft color codes
  const renderMotdPreview = (text) => {
    if (!text) return <span className="text-muted-foreground">No MOTD set</span>;

    const parts = [];
    let currentColor = "#FFFFFF";
    let currentText = "";
    let i = 0;

    while (i < text.length) {
      if (text[i] === "§" && i + 1 < text.length) {
        // Push current text
        if (currentText) {
          parts.push({ color: currentColor, text: currentText });
          currentText = "";
        }
        // Get color code
        const code = text.substring(i, i + 2);
        if (MC_COLORS[code]) {
          currentColor = MC_COLORS[code];
        }
        i += 2;
      } else {
        currentText += text[i];
        i++;
      }
    }

    if (currentText) {
      parts.push({ color: currentColor, text: currentText });
    }

    return parts.map((part, idx) => (
      <span key={idx} style={{ color: part.color }}>
        {part.text}
      </span>
    ));
  };

  return (
    <Card className="p-6" data-testid="identity-tab">
      <h3 className="font-heading font-bold text-xl mb-6">{t("identity_title")}</h3>

      <div className="grid grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Server Name */}
          <div>
            <Label htmlFor="server-name" className="text-sm mb-2 block">
              {t("identity_name")}
            </Label>
            <Input
              id="server-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Server"
              data-testid="identity-name-input"
            />
          </div>

          {/* MOTD */}
          <div>
            <Label htmlFor="motd" className="text-sm mb-2 block">
              {t("identity_motd")}
            </Label>
            <Textarea
              id="motd"
              value={motd}
              onChange={(e) => setMotd(e.target.value)}
              placeholder="Welcome to my server!"
              className="font-mono"
              rows={3}
              data-testid="identity-motd-input"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Use § followed by a color code (0-9, a-f) for colors. Example: §aGreen §cRed
            </p>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description" className="text-sm mb-2 block">
              Descrição do Servidor
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição adicional sobre seu servidor..."
              rows={2}
            />
          </div>

          {/* Dificuldade */}
          <div>
            <Label htmlFor="difficulty" className="text-sm mb-2 block">
              Dificuldade
            </Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="peaceful">Pacífico</SelectItem>
                <SelectItem value="easy">Fácil</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="hard">Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Game Mode */}
          <div>
            <Label htmlFor="gamemode" className="text-sm mb-2 block">
              Modo de Jogo
            </Label>
            <Select value={gameMode} onValueChange={setGameMode}>
              <SelectTrigger id="gamemode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="survival">Sobrevivência</SelectItem>
                <SelectItem value="creative">Criativo</SelectItem>
                <SelectItem value="adventure">Aventura</SelectItem>
                <SelectItem value="spectator">Espectador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* PvP */}
          <div>
            <Label htmlFor="pvp" className="text-sm mb-2 block">
              PvP
            </Label>
            <Select value={pvp} onValueChange={setPvp}>
              <SelectTrigger id="pvp">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on">Ativado</SelectItem>
                <SelectItem value="off">Desativado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Palette Reference */}
          <div>
            <Label className="text-sm mb-2 block">Cores do MOTD</Label>
            <div className="flex flex-wrap gap-1">
              {Object.entries(MC_COLORS).map(([code, color]) => (
                <button
                  key={code}
                  className="w-8 h-8 rounded text-xs font-mono border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color, color: color === "#000000" || color === "#0000AA" ? "#fff" : "#000" }}
                  onClick={() => setMotd((prev) => prev + code)}
                  title={code}
                >
                  {code.replace("§", "")}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} data-testid="save-identity-btn" className="w-full">
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t("save")}
          </Button>
        </div>

        {/* Right: Preview and Icon */}
        <div className="space-y-6">
          {/* Server Icon */}
          <div>
            <Label className="text-sm mb-2 block">{t("identity_icon")}</Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center">
                <IconPreview serverId={serverId} />
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png"
                  className="hidden"
                  onChange={handleIconUpload}
                  data-testid="icon-upload-input"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingIcon}
                >
                  {uploadingIcon ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {t("identity_icon_upload")}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleIconDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("identity_icon_remove")}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              PNG format, 64x64 pixels recommended
            </p>
          </div>

          {/* MOTD Preview */}
          <div>
            <Label className="text-sm mb-2 block">{t("identity_preview")}</Label>
            <div className="motd-preview">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-zinc-800 overflow-hidden">
                  <img
                    src={`${API}/servers/${serverId}/icon?t=${Date.now()}`}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.opacity = "0";
                    }}
                  />
                </div>
                <div>
                  <div className="font-bold text-white">{name || server?.name || "Server Name"}</div>
                  <div className="text-sm">{renderMotdPreview(motd)}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                localhost:{server?.port || 25565}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
