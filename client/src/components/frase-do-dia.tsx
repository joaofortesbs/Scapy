

import { Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface DailyPhrase {
  id: string;
  phrase: string;
  date: string;
  createdAt: string;
}

export default function FraseDoDia() {
  const [phrase, setPhrase] = useState<DailyPhrase | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchDailyPhrase();
    
    // Check if phrase was saved in localStorage
    const savedPhrases = localStorage.getItem('savedPhrases');
    if (savedPhrases) {
      const parsed = JSON.parse(savedPhrases);
      const today = new Date().toISOString().split('T')[0];
      setSaved(parsed.includes(today));
    }
  }, []);

  const fetchDailyPhrase = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/daily-phrase');
      const data = await response.json();
      setPhrase(data);
    } catch (error) {
      console.error('Erro ao carregar frase do dia:', error);
      // Fallback phrase if API fails
      setPhrase({
        id: 'fallback',
        phrase: 'Sua determinação de hoje constrói a liberdade de amanhã. Continue firme!',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhrase = () => {
    if (!phrase) return;
    
    try {
      const savedPhrases = localStorage.getItem('savedPhrases');
      const existingSaved = savedPhrases ? JSON.parse(savedPhrases) : [];
      
      if (!saved) {
        // Save phrase
        existingSaved.push(phrase.date);
        localStorage.setItem('savedPhrases', JSON.stringify(existingSaved));
        
        // Also save the actual phrase content
        const savedPhrasesContent = localStorage.getItem('savedPhrasesContent');
        const existingContent = savedPhrasesContent ? JSON.parse(savedPhrasesContent) : {};
        existingContent[phrase.date] = phrase;
        localStorage.setItem('savedPhrasesContent', JSON.stringify(existingContent));
        
        setSaved(true);
        alert("Frase salva com sucesso!");
      } else {
        // Remove saved phrase
        const updatedSaved = existingSaved.filter((date: string) => date !== phrase.date);
        localStorage.setItem('savedPhrases', JSON.stringify(updatedSaved));
        
        const savedPhrasesContent = localStorage.getItem('savedPhrasesContent');
        if (savedPhrasesContent) {
          const existingContent = JSON.parse(savedPhrasesContent);
          delete existingContent[phrase.date];
          localStorage.setItem('savedPhrasesContent', JSON.stringify(existingContent));
        }
        
        setSaved(false);
        alert("Frase removida dos salvos!");
      }
    } catch (error) {
      console.error('Erro ao salvar frase:', error);
      alert("Erro ao salvar frase. Tente novamente.");
    }
  };

  const handleFraseClick = () => {
    if (loading) return;
    alert("Clique no ícone para salvar esta frase inspiradora!");
  };

  return (
    <section className="mb-8 relative">
      <div className="relative">
        {/* Ícone de salvamento no canto direito superior */}
        <div className="absolute top-0 right-10 transform translate-x-[30%] -translate-y-[30%] z-10">
          <button
            onClick={handleSavePhrase}
            disabled={loading || !phrase}
            className="p-1 rounded transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: saved ? 'rgba(0, 246, 255, 0.2)' : 'rgba(0, 5, 21, 0.73)', 
              border: saved ? '1px solid rgba(0, 246, 255, 0.3)' : '1px solid rgba(0, 5, 21, 0.5)' 
            }}
          >
            <Bookmark 
              className="w-7 h-7 text-primary transition-all duration-300" 
              fill={saved ? "rgba(0, 246, 255, 0.8)" : "rgba(0, 5, 21, 0.73)"} 
            />
          </button>
        </div>

        <Card 
          className="border-border cursor-pointer hover:bg-primary/5 transition-all duration-500 rounded-3xl pt-6 frase-do-dia-card-natural-3d" 
          style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}
          onClick={handleFraseClick}
          data-testid="frase-do-dia-card"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-center min-h-[80px]">
              {loading ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Gerando frase inspiradora...</span>
                </div>
              ) : phrase ? (
                <div className="text-center">
                  <p className="text-foreground font-medium text-base leading-relaxed px-2">
                    "{phrase.phrase}"
                  </p>
                  <div className="mt-4 flex items-center justify-center">
                    <div className="h-1 w-12 bg-gradient-to-r from-primary/30 to-primary rounded-full"></div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    Erro ao carregar frase. Tente novamente mais tarde.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

