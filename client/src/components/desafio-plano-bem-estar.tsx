
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DesafioPlanoBeamEstar() {
  const handleChallengeClick = () => {
    alert("Desafio plano bem-estar - Em desenvolvimento");
  };

  return (
    <section className="mb-8">
      <div className="w-1/2">
        <Card 
          className="border-border cursor-pointer hover:bg-primary/5 transition-colors duration-200 rounded-3xl" 
          style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}
          onClick={handleChallengeClick}
          data-testid="wellness-challenge-card"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
