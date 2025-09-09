import { Sparkles, Frown, Meh, Smile, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  fullName: string;
}

export default function AIAssistant() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const moodOptions = [
    { id: 'medo', label: 'Medo', icon: Frown, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { id: 'estavel', label: 'Estável', icon: Meh, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { id: 'feliz', label: 'Feliz', icon: Smile, color: 'bg-green-500/20 text-green-400 border-green-500/30' }
  ];

  // Carregar dados do usuário e verificar humor
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // Verificar se já selecionou humor hoje
        checkTodayMood(userData.id);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  // Escutar atualizações de humor para manter sincronizado
  useEffect(() => {
    const handleMoodUpdate = () => {
      if (user) {
        console.log('🔄 Recarregando humor após atualização...');
        checkTodayMood(user.id);
      }
    };

    window.addEventListener('moodUpdated', handleMoodUpdate);
    return () => {
      window.removeEventListener('moodUpdated', handleMoodUpdate);
    };
  }, [user]);

  const checkTodayMood = async (userId: number) => {
    try {
      const response = await apiRequest('GET', `/api/today-mood/${userId}`);
      const data = await response.json();
      if (data) {
        setTodayMood(data.mood);
        console.log(`📋 Humor de hoje carregado: ${data.mood}`);
      } else {
        setTodayMood(null);
        console.log(`📋 Nenhum humor registrado para hoje`);
      }
    } catch (error) {
      console.error('Erro ao verificar humor de hoje:', error);
      setTodayMood(null);
    }
  };

  const handleMoodSelect = async (mood: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    if (isGenerating) return; // Evitar cliques duplos

    setIsGenerating(true);
    setSelectedMood(mood);

    try {
      console.log(`🎯 Selecionando humor: ${mood} para usuário ${user.id}`);

      // 1. Registrar seleção de humor (normalizado sem acentos)
      const normalizedMood = mood.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
        
      await apiRequest('POST', '/api/mood-selection', {
        userId: user.id.toString(),
        mood: normalizedMood
      });

      console.log(`💭 Humor registrado com sucesso`);

      // 2. Gerar sugestões personalizadas
      toast({
        title: "Analisando seu perfil...",
        description: "Nossa IA está criando atividades personalizadas para você!",
      });

      const suggestionResponse = await apiRequest('POST', '/api/generate-suggestions', {
        userId: user.id.toString(),
        mood: normalizedMood
      });

      const suggestionData = await suggestionResponse.json();
      
      console.log(`✅ Sugestões geradas:`, suggestionData);

      // 3. Atualizar estado do humor imediatamente
      setTodayMood(normalizedMood);
      console.log(`🎯 Estado todayMood atualizado para: ${normalizedMood}`);
      
      toast({
        title: "Sugestões criadas!",
        description: `${suggestionData.tasks.length} atividades personalizadas foram adicionadas às suas metas do dia!`,
      });

      // 4. Salvar humor imediatamente no localStorage ultra-persistente
      const todayKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const moodData = {
        userId: user.id.toString(),
        mood: normalizedMood,
        date: todayKey,
        timestamp: Date.now()
      };
      
      // Salvar humor individual
      localStorage.setItem(`scapy_mood_${user.id}_${todayKey}`, JSON.stringify(moodData));
      
      // Salvar no registro geral de humores
      const allMoods = JSON.parse(localStorage.getItem('scapy_all_moods') || '{}');
      if (!allMoods[user.id.toString()]) {
        allMoods[user.id.toString()] = {};
      }
      allMoods[user.id.toString()][todayKey] = normalizedMood;
      localStorage.setItem('scapy_all_moods', JSON.stringify(allMoods));
      
      console.log(`💾 Humor "${mood}" salvo persistentemente para ${todayKey}`);

      // 5. Disparar evento com dados específicos para sincronização imediata
      const moodEvent = new CustomEvent('moodUpdated', {
        detail: {
          userId: user.id.toString(),
          mood: normalizedMood,
          date: todayKey,
          dayOfWeek: new Date().getDay(),
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(moodEvent);
      
      // Também disparar evento de tarefas
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
      
      console.log(`🔔 Eventos disparados com dados específicos:`, moodEvent.detail);

    } catch (error) {
      console.error('Erro ao processar seleção de humor:', error);
      toast({
        title: "Erro ao gerar sugestões",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      // Se houve erro, não atualizar o estado do humor
    } finally {
      setIsGenerating(false);
      setSelectedMood(null);
    }
  };

  return (
    <section className="mb-8">
      <Card className="border-border mb-3 rounded-full ai-assistant-card-natural-3d" style={{ backgroundColor: '#000515' }}>
        <CardContent className="p-3">
          <div className="flex items-center justify-center space-x-3">
            {isGenerating ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : todayMood ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <Sparkles className="w-6 h-6 text-primary" />
            )}
            <span className="text-base text-foreground font-medium">
              {isGenerating 
                ? "Gerando suas atividades personalizadas..." 
                : todayMood 
                ? "Suas atividades do dia foram criadas!"
                : "Como você está se sentindo hoje?"
              }
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between space-x-2">
        {moodOptions.map(({ id, label, icon: Icon, color }) => {
          const isSelected = todayMood === id;
          const isCurrentlySelecting = selectedMood === label && isGenerating;
          
          return (
            <Button
              key={id}
              variant="outline"
              disabled={isGenerating || todayMood !== null}
              className={`flex-1 h-12 border ${color} hover:opacity-80 transition-all duration-300 rounded-full ${
                isSelected ? 'opacity-100 ring-2 ring-primary' : ''
              } ${isCurrentlySelecting ? 'animate-pulse' : ''}`}
              style={{ opacity: isSelected ? 1 : todayMood ? 0.3 : 0.73 }}
              onClick={() => handleMoodSelect(label)}
              data-testid={`mood-${id}`}
            >
              <div className="flex items-center space-x-2">
                {isCurrentlySelecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSelected ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{label}</span>
              </div>
            </Button>
          );
        })}
      </div>

      {todayMood && (
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            Verifique suas "Metas do Dia" para ver as atividades geradas para você!
          </p>
        </div>
      )}
    </section>
  );
}