import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Copy, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { toast } from "sonner";

// Exemplos de seeds populares com descrições
const POPULAR_SEEDS = [
  {
    seed: "12107",
    name: "Vila no Spawn",
    description: "Vila próxima ao ponto de aparecimento com várias casas",
    image: null,
    terrain: "Vilas",
    version: "1.20+",
    imageUrl: "https://cuberight.com/screenshots/seed-12107.png"
  },
  {
    seed: "2151901553968352745",
    name: "Vilas Múltiplas",
    description: "4 vilas visíveis perto do spawn, perfeito para comércio",
    image: null,
    terrain: "Vilas",
    version: "1.20+",
    imageUrl: "https://cuberight.com/screenshots/seed-2151901553968352745.png"
  },
  {
    seed: "-8387848378968758",
    name: "Vila com Montanha",
    description: "Vila ao pé de uma montanha com muitos recursos",
    image: null,
    terrain: "Vilas",
    version: "1.20+",
    imageUrl: "https://cuberight.com/screenshots/seed-8387848378968758.png"
  },
  {
    seed: "7826307256900313850",
    name: "Vila Costeira",
    description: "Vila próxima a um oceano com acesso a naufrágios",
    image: null,
    terrain: "Vilas",
    version: "1.20+",
    imageUrl: "https://cuberight.com/screenshots/seed-7826307256900313850.png"
  },
  {
    seed: "109",
    name: "Mansão + Vila",
    description: "Mansão florestal perto de vila no mesmo bioma",
    image: null,
    terrain: "Vilas",
    version: "1.20+",
    imageUrl: "https://cuberight.com/screenshots/seed-109.png"
  }
];

export default function SeedsExplorer({ onSelectSeed }) {
  const { t } = useTranslation();
  const [seeds, setSeeds] = useState(POPULAR_SEEDS);
  const [search, setSearch] = useState("");
  const [copiedSeed, setCopiedSeed] = useState(null);
  const [loadingImages, setLoadingImages] = useState(false);

  // Carregar imagens das seeds usando API gratuita
  useEffect(() => {
    loadSeedImages();
  }, []);

  const loadSeedImages = async () => {
    setLoadingImages(true);
    try {
      // Usar URLs reais das imagens do cuberight.com
      const updatedSeeds = seeds.map(seed => ({
        ...seed,
        image: seed.imageUrl || getTerrainColor(seed.terrain)
      }));
      setSeeds(updatedSeeds);
    } catch (error) {
      console.error("Erro ao carregar imagens:", error);
    } finally {
      setLoadingImages(false);
    }
  };

  const getTerrainColor = (terrain) => {
    // Fallback: retorna um gradiente SVG baseado no tipo de terreno
    const colors = {
      'Vilas': 'linear-gradient(135deg, #8B4513 0%, #D2B48C 100%)',
      'Montanhoso': 'linear-gradient(135deg, #8B7355 0%, #D3D3D3 100%)',
      'Oceano': 'linear-gradient(135deg, #1E90FF 0%, #00BFFF 100%)',
      'Selva': 'linear-gradient(135deg, #228B22 0%, #90EE90 100%)',
      'Deserto': 'linear-gradient(135deg, #FFD700 0%, #FFDAB9 100%)',
      'Variado': 'linear-gradient(135deg, #2d5016 0%, #90EE90 100%)'
    };
    return colors[terrain] || colors['Variado'];
  };

  const handleCopySeed = (seed) => {
    navigator.clipboard.writeText(seed);
    setCopiedSeed(seed);
    toast.success("Seed copiada!");
    setTimeout(() => setCopiedSeed(null), 2000);
  };

  const handleUseSeed = (seed) => {
    onSelectSeed(seed.seed);
    toast.success(`Seed "${seed.name}" selecionada!`);
  };

  const filteredSeeds = seeds.filter(seed =>
    seed.name.toLowerCase().includes(search.toLowerCase()) ||
    seed.description.toLowerCase().includes(search.toLowerCase()) ||
    seed.seed.includes(search)
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading font-bold text-lg mb-3">🌍 Explorar Seeds Populares</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Procurar por nome, descrição ou seed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
        {filteredSeeds.map((seed) => (
          <Card
            key={seed.seed}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Imagem/Preview */}
            <div className="h-32 w-full bg-secondary overflow-hidden flex items-center justify-center text-white text-center p-2 text-sm font-semibold relative">
              {seed.imageUrl ? (
                <img
                  src={seed.imageUrl}
                  alt={seed.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                style={{ background: seed.image }}
                className="w-full h-full flex items-center justify-center"
              >
                {!seed.imageUrl && seed.terrain}
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-3 space-y-2">
              <div>
                <h4 className="font-bold text-sm">{seed.name}</h4>
                <p className="text-xs text-muted-foreground">{seed.description}</p>
              </div>

              {/* Seed */}
              <div className="bg-secondary rounded p-2 flex items-center justify-between">
                <code className="text-xs font-mono truncate">{seed.seed}</code>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopySeed(seed.seed)}
                      >
                        {copiedSeed === seed.seed ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copiar seed</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Versão e Botão */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{seed.version}</span>
              </div>

              <Button
                size="sm"
                onClick={() => handleUseSeed(seed)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Usar esta Seed
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredSeeds.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma seed encontrada
        </div>
      )}

      {/* Info sobre Custom Seed */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-sm mb-2">💡 Seed Customizada</h4>
        <p className="text-sm text-muted-foreground">
          Você também pode inserir manualmente qualquer seed que desejar.
          As seeds podem ser números ou texto.
        </p>
      </Card>
    </div>
  );
}
