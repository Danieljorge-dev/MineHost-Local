import { Outlet, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Plus,
  Settings,
  Sun,
  Moon,
  Globe,
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../components/ui/alert";
import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Layout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [systemInfo, setSystemInfo] = useState(null);
  const [javaStatus, setJavaStatus] = useState({ checked: false, installed: true, version: null });

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const res = await axios.get(`${API}/system/info`);
        setSystemInfo(res.data);
      } catch (err) {
        console.error("Failed to fetch system info:", err);
      }
    };

    const checkJava = async () => {
      try {
        const res = await axios.get(`${API}/system/java`);
        setJavaStatus({
          checked: true,
          installed: res.data.installed,
          version: res.data.version
        });
      } catch (err) {
        setJavaStatus({ checked: true, installed: false, version: null });
      }
    };

    fetchSystemInfo();
    checkJava();
    const interval = setInterval(fetchSystemInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: t("nav_dashboard") },
    { path: "/create", icon: Plus, label: t("nav_create") },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading font-bold text-xl">{t("app_name")}</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              data-testid={`nav-${item.path === "/" ? "dashboard" : item.path.slice(1)}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* System Info */}
        {systemInfo && (
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
              {t("system_info")}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${systemInfo.cpu_percent}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {systemInfo.cpu_percent.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MemoryStick className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${systemInfo.memory.percent}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {systemInfo.memory.percent.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${systemInfo.disk.percent}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {systemInfo.disk.percent.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="p-4 border-t border-border flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="theme-toggle"
            className="flex-1"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="language-selector" className="flex-1">
                <Globe className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => changeLanguage("en")}
                data-testid="lang-en"
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeLanguage("pt")}
                data-testid="lang-pt"
              >
                Português (Brasil)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-8"
        >
          {/* Java Warning Banner */}
          {javaStatus.checked && !javaStatus.installed && (
            <Alert variant="destructive" className="mb-6" data-testid="java-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t("error_java_not_found")}</AlertTitle>
              <AlertDescription className="flex items-center gap-2">
                <span>{t("error_java_download")}</span>
                <a 
                  href="https://adoptium.net/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary hover:underline"
                >
                  adoptium.net
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </AlertDescription>
            </Alert>
          )}
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
