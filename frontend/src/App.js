import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "./i18n";
import Dashboard from "./pages/Dashboard";
import CreateServer from "./pages/CreateServer";
import ServerPanel from "./pages/ServerPanel";
import Layout from "./components/Layout";
import "./App.css";

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateServer />} />
            <Route path="/server/:id" element={<ServerPanel />} />
            <Route path="/server/:id/:tab" element={<ServerPanel />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster 
        position="bottom-right" 
        theme="dark"
        toastOptions={{
          className: "glass",
        }}
      />
    </div>
  );
}

export default App;
