
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DesafioPlanoBeamEstar() {
  const handleChallengeClick = () => {
    alert("Desafio plano bem-estar - Em desenvolvimento");
  };

  return (
    <section className="mb-8">
      <Card 
        className="border-border cursor-pointer hover:bg-primary/5 transition-colors duration-200 rounded-3xl" 
        style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}
        onClick={handleChallengeClick}
        data-testid="wellness-challenge-card"
      >
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                Desafio plano bem-estar
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
