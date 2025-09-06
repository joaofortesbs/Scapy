
import { Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FraseDoDia() {
  const handleFraseClick = () => {
    alert("Frase do Dia - Em desenvolvimento");
  };

  return (
    <section className="mb-8 relative">
      <div className="relative">
        {/* Ícone de salvamento no canto direito superior */}
        <div className="absolute top-0 right-0 transform translate-x-[30%] -translate-y-[30%] z-10">
          <Bookmark className="w-7 h-7 text-primary" />
        </div>

        <Card 
          className="border-border cursor-pointer hover:bg-primary/5 transition-colors duration-200 rounded-3xl pt-6" 
          style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}
          onClick={handleFraseClick}
          data-testid="frase-do-dia-card"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-center min-h-[60px]">
              {/* Conteúdo do card pode ser adicionado aqui futuramente */}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
