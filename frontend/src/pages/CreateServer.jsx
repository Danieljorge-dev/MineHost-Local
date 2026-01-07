import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Server,
  Blocks,
  Puzzle,
  Hammer,
  RefreshCw,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Slider } from "../components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SERVER_TYPES = [
  {
    id: "vanilla",
    name: "Vanilla",
    icon: Server,
    description: "type_vanilla_desc",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "paper",
    name: "Paper",
    icon: Blocks,
    description: "type_paper_desc",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    id: "fabric",
    name: "Fabric",
    icon: Puzzle,
    description: "type_fabric_desc",
    color: "from-amber-500 to-amber-600",
  },
  {
    id: "forge",
    name: "Forge",
    icon: Hammer,
    description: "type_forge_desc",
    color: "from-red-500 to-red-600",
  },
];

export default function CreateServer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    server_type: "",
    version: "",
    port: 25565,
    ram_min: 1024,
    ram_max: 2048,
  });

  const steps = [
    { title: t("create_step_type"), completed: !!formData.server_type },
    { title: t("create_step_version"), completed: !!formData.version },
    { title: t("create_step_config"), completed: !!formData.name },
    { title: t("create_step_confirm"), completed: false },
  ];

  useEffect(() => {
    if (formData.server_type) {
      fetchVersions(formData.server_type);
    }
  }, [formData.server_type]);

  const fetchVersions = async (type) => {
    setLoadingVersions(true);
    try {
      const res = await axios.get(`${API}/versions/${type}`);
      setVersions(res.data.versions || []);
    } catch (err) {
      toast.error(t("error"));
      setVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleTypeSelect = (type) => {
    setFormData({ ...formData, server_type: type, version: "" });
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/servers`, formData);
      toast.success(t("success"));
      navigate(`/server/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || t("error"));
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!formData.server_type;
      case 1:
        return !!formData.version;
      case 2:
        return !!formData.name && formData.port > 0;
      default:
        return true;
    }
  };

  return (
    <div data-testid="create-server-page" className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold">{t("create_title")}</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-12">
        {steps.map((s, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                index < step
                  ? "bg-primary text-primary-foreground"
                  : index === step
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {index < step ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
            </div>
            <span
              className={`ml-3 font-medium ${
                index <= step ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.title}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-4 ${
                  index < step ? "bg-primary" : "bg-secondary"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 0: Server Type */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              {SERVER_TYPES.map((type) => (
                <Card
                  key={type.id}
                  className={`type-card ${
                    formData.server_type === type.id ? "selected" : ""
                  }`}
                  onClick={() => handleTypeSelect(type.id)}
                  data-testid={`type-${type.id}`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4`}
                  >
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-1">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">{t(type.description)}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Step 1: Version */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg mb-4 block">{t("server_version")}</Label>
                {loadingVersions ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto scrollbar-thin p-1">
                    {versions.map((v) => (
                      <button
                        key={v.id}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          formData.version === v.id
                            ? "border-primary bg-primary/20 text-foreground"
                            : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setFormData({ ...formData, version: v.id })}
                        data-testid={`version-${v.id}`}
                      >
                        <span className="font-mono text-sm">{v.id}</span>
                        {v.type === "release" && (
                          <span className="block text-xs text-emerald-500 mt-1">Release</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <Label htmlFor="name" className="text-lg mb-2 block">
                  {t("server_name")}
                </Label>
                <Input
                  id="name"
                  placeholder={t("server_name_placeholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-lg py-6"
                  data-testid="server-name-input"
                />
              </div>

              <div>
                <Label htmlFor="port" className="text-lg mb-2 block">
                  {t("server_port")}
                </Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) =>
                    setFormData({ ...formData, port: parseInt(e.target.value) || 25565 })
                  }
                  className="font-mono"
                  data-testid="server-port-input"
                />
              </div>

              <div>
                <Label className="text-lg mb-4 block">{t("ram_allocation")}</Label>
                <div className="space-y-6 p-6 rounded-xl bg-secondary/50">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">{t("ram_min")}</span>
                      <span className="font-mono">{formData.ram_min} MB</span>
                    </div>
                    <Slider
                      value={[formData.ram_min]}
                      onValueChange={([val]) =>
                        setFormData({ ...formData, ram_min: val })
                      }
                      min={512}
                      max={8192}
                      step={256}
                      data-testid="ram-min-slider"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">{t("ram_max")}</span>
                      <span className="font-mono">{formData.ram_max} MB</span>
                    </div>
                    <Slider
                      value={[formData.ram_max]}
                      onValueChange={([val]) =>
                        setFormData({ ...formData, ram_max: val })
                      }
                      min={1024}
                      max={16384}
                      step={256}
                      data-testid="ram-max-slider"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <Card className="p-8">
              <h3 className="font-heading font-bold text-xl mb-6">
                {t("create_step_confirm")}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">{t("server_name")}</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">{t("server_type")}</span>
                  <span className="font-medium capitalize">{formData.server_type}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">{t("server_version")}</span>
                  <span className="font-mono">{formData.version}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">{t("server_port")}</span>
                  <span className="font-mono">{formData.port}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">{t("ram_allocation")}</span>
                  <span className="font-mono">
                    {formData.ram_min}MB - {formData.ram_max}MB
                  </span>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
          data-testid="wizard-back-btn"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("cancel")}
        </Button>

        {step < steps.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()} data-testid="wizard-next-btn">
            {steps[step + 1].title}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={loading} data-testid="create-server-submit">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t("creating_server")}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t("create_server")}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
