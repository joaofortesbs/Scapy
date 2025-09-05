import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PanicButton() {
  const handlePanicClick = () => {
    alert("Botão de Pânico acionado! Procure ajuda imediata.");
  };

  return (
    <div className="px-4 py-3">
      <Button
        className="w-full panic-button text-white border-0 h-12 rounded-full transition-all duration-300 shadow-lg"
        onClick={handlePanicClick}
        data-testid="panic-button"
      >
        <div className="flex items-center justify-center space-x-3">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">Botão de Pânico</span>
        </div>
      </Button>
    </div>
  );
}