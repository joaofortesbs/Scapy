import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PanicButton() {
  const handlePanicClick = () => {
    alert("Botão de Pânico acionado! Procure ajuda imediata.");
  };

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 max-w-md w-full px-4">
      <Button
        className="w-full bg-red-600 hover:bg-red-700 text-white border-0 h-12 rounded-lg transition-colors shadow-lg"
        onClick={handlePanicClick}
        data-testid="panic-button"
      >
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">Botão de Pânico</span>
        </div>
      </Button>
    </div>
  );
}