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

export default function AIAssistant(): JSX.Element {
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

  // Escutar atualizações de humor e eventos de reinicialização
  useEffect(() => {
    const handleMoodUpdate = () => {
      if (user) {
        console.log('🔄 [AIAssistant] Recarregando humor após atualização...');
        checkTodayMood(user.id);
      }
    };

    const handleNewDayDetected = (event: CustomEvent) => {
      if (user && event.detail?.userId === user.id) {
        console.log('🌅 [AIAssistant] Evento de novo dia recebido, reiniciando...');
        setTodayMood(null);
        setSelectedMood(null);
        setIsGenerating(false);
        
        // Verificar estado limpo após um pequeno delay
        setTimeout(() => {
          checkTodayMood(user.id);
        }, 1000);
      }
    };

    const handleMoodReset = (event: CustomEvent) => {
      if (user && event.detail?.userId === user.id) {
        console.log('🔄 [AIAssistant] Reset de humor detectado');
        setTodayMood(null);
        setSelectedMood(null);
        setIsGenerating(false);
      }
    };

    // Registrar todos os listeners
    window.addEventListener('moodUpdated', handleMoodUpdate);
    window.addEventListener('newDayDetected', handleNewDayDetected);
    window.addEventListener('moodResetComplete', handleMoodReset);
    
    return () => {
      window.removeEventListener('moodUpdated', handleMoodUpdate);
      window.removeEventListener('newDayDetected', handleNewDayDetected);
      window.removeEventListener('moodResetComplete', handleMoodReset);
    };
  }, [user]);

  // ============= SISTEMA ULTRA-ROBUSTO DE DETECÇÃO E RESET AUTOMÁTICO ÀS 00:00 =============
  useEffect(() => {
    if (!user) return;

    // Usar data local em vez de UTC
    const getLocalDateKey = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let lastKnownDate = getLocalDateKey();
    let dailyTimerRef: NodeJS.Timeout | null = null;
    
    const performMidnightReset = () => {
      console.log('🌅 [AIAssistant] REINICIALIZAÇÃO TOTAL INICIADA - Novo dia detectado!');
      
      const newDate = getLocalDateKey(); // Usar data local
      const oldDate = lastKnownDate;
      
      // 1. Limpar estado React completamente
      setTodayMood(null);
      setSelectedMood(null);
      setIsGenerating(false);
      console.log('🔄 [AIAssistant] Estados React resetados');
      
      // 2. Limpar dados específicos do dia anterior (mantendo histórico)
      const keysToRemove = [
        `scapy_mood_${user.id}_${oldDate}`,
        `scapy_daily_mood_${user.id}_${oldDate}`,
        `scapy_ai_tasks_${user.id}_${oldDate}`,
        `scapy_custom_goals_${user.id}_${oldDate}`,
        `scapy_session_mood`,
        'scapy_ai_assistant_state'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`🗑️ [AIAssistant] Removido: ${key}`);
        } catch (error) {
          console.warn(`⚠️ [AIAssistant] Erro ao remover ${key}:`, error);
        }
      });
      
      // 3. Limpar backup de humor antigo mantendo histórico
      try {
        const allMoodsStr = localStorage.getItem('scapy_all_moods') || '{}';
        const allMoods = JSON.parse(allMoodsStr);
        
        if (allMoods[user.id.toString()]) {
          // Manter histórico de até 7 dias atrás
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          Object.keys(allMoods[user.id.toString()]).forEach(dateKey => {
            const dateObj = new Date(dateKey);
            if (dateObj < sevenDaysAgo) {
              delete allMoods[user.id.toString()][dateKey];
              console.log(`🧹 [AIAssistant] Removido humor antigo: ${dateKey}`);
            }
          });
          
          localStorage.setItem('scapy_all_moods', JSON.stringify(allMoods));
        }
      } catch (error) {
        console.error('❌ [AIAssistant] Erro ao processar histórico:', error);
      }
      
      // 4. Atualizar referência de data
      lastKnownDate = newDate;
      
      // 5. Disparar eventos de sincronização para todos os componentes
      window.dispatchEvent(new CustomEvent('newDayDetected', {
        detail: {
          userId: user.id.toString(), // Corrigido: usar string
          oldDate: oldDate,
          newDate: newDate,
          timestamp: Date.now(),
          source: 'ai-assistant-midnight-reset'
        }
      }));
      
      window.dispatchEvent(new CustomEvent('moodResetComplete', {
        detail: {
          userId: user.id.toString(), // Corrigido: usar string
          date: newDate,
          resetType: 'midnight'
        }
      }));
      
      // 6. Evento específico para resetar DailyGoals
      window.dispatchEvent(new CustomEvent('dailyGoalsReset', {
        detail: {
          userId: user.id.toString(), // Corrigido: usar string
          date: newDate,
          oldDate: oldDate
        }
      }));
      
      console.log(`🔄 [AIAssistant] REINICIALIZAÇÃO COMPLETA! ${oldDate} → ${newDate}`);
      console.log('✅ [AIAssistant] Sistema pronto para nova seleção de humor!');
    };

    const checkNewDay = () => {
      const currentDate = getLocalDateKey(); // Usar data local
      
      // Detectar mudança de data
      if (currentDate !== lastKnownDate) {
        console.log(`📅 [AIAssistant] Mudança de data detectada: ${lastKnownDate} → ${currentDate}`);
        performMidnightReset();
        return;
      }
      
      // Verificação de consistência: se é um novo dia e há estado inconsistente
      const currentMoodKey = `scapy_mood_${user.id}_${currentDate}`;
      const savedMood = localStorage.getItem(currentMoodKey);
      
      if (todayMood && !savedMood) {
        console.log('🧹 [AIAssistant] Estado inconsistente detectado, sincronizando...');
        setTodayMood(null);
      } else if (!todayMood && savedMood) {
        try {
          const moodData = JSON.parse(savedMood);
          if (moodData.date === currentDate) {
            setTodayMood(moodData.mood);
            console.log(`🔄 [AIAssistant] Estado sincronizado: ${moodData.mood}`);
          }
        } catch (error) {
          console.warn('⚠️ [AIAssistant] Erro ao sincronizar estado:', error);
        }
      }
    };

    // Verificação inicial
    checkNewDay();

    // Verificação a cada 30 segundos para detecção rápida de mudanças
    const frequentCheck = setInterval(checkNewDay, 30000);

    // ======= SISTEMA DE TIMER PRECISO PARA MEIA-NOITE =======
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 5, 0); // 5 segundos após meia-noite para garantir
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const midnightTimeout = setTimeout(() => {
      console.log('🕛 [AIAssistant] MEIA-NOITE EXATA DETECTADA - EXECUTANDO RESET!');
      performMidnightReset();
      
      // Configurar timer diário para próximas meia-noites (24h)
      dailyTimerRef = setInterval(() => {
        console.log('🕛 [AIAssistant] Timer diário ativado - Nova meia-noite!');
        performMidnightReset();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    console.log(`⏰ [AIAssistant] Timer configurado - Próxima verificação em ${Math.round(msUntilMidnight / 1000)} segundos`);
    console.log(`🕛 [AIAssistant] Reset automático agendado para: ${tomorrow.toLocaleString()}`);

    return () => {
      clearInterval(frequentCheck);
      clearTimeout(midnightTimeout);
      if (dailyTimerRef) {
        clearInterval(dailyTimerRef);
      }
    };
  }, [user]); // Remover todayMood para evitar reschedule desnecessário

  const checkTodayMood = async (userId: number) => {
    try {
      // Obter data atual sempre atualizada usando hora local
      const getLocalDateKey = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const todayKey = getLocalDateKey();
      
      console.log(`🕒 [AIAssistant] Verificando humor para: ${todayKey} às ${new Date().toLocaleTimeString()}`);
      
      // Verificação robusta com limpeza automática de dados antigos
      const individualMoodKey = `scapy_mood_${userId}_${todayKey}`;
      const savedIndividualMood = localStorage.getItem(individualMoodKey);
      
      if (savedIndividualMood) {
        try {
          const moodData = JSON.parse(savedIndividualMood);
          
          // Verificação de data local
          if (moodData.date === todayKey) {
            setTodayMood(moodData.mood);
            console.log(`💿 [AIAssistant] Humor válido carregado: ${moodData.mood} para ${todayKey}`);
          } else {
            // Humor é de outro dia, limpar imediatamente
            console.log(`🗑️ [AIAssistant] Humor de data diferente (${moodData.date}), removendo...`);
            localStorage.removeItem(individualMoodKey);
            setTodayMood(null);
          }
        } catch (error) {
          console.error('❌ Erro ao parsear humor, removendo:', error);
          localStorage.removeItem(individualMoodKey);
          setTodayMood(null);
        }
      } else {
        // Verificar e limpar registros antigos do sistema geral
        try {
          const allMoods = JSON.parse(localStorage.getItem('scapy_all_moods') || '{}');
          const userMoods = allMoods[userId.toString()] || {};
          
          // Limpar automaticamente humores antigos (mais de 7 dias)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          Object.keys(userMoods).forEach(dateKey => {
            const dateObj = new Date(dateKey);
            if (dateObj < sevenDaysAgo) {
              delete userMoods[dateKey];
              console.log(`🧹 [AIAssistant] Removido humor antigo: ${dateKey}`);
            }
          });
          
          // Salvar dados limpos
          allMoods[userId.toString()] = userMoods;
          localStorage.setItem('scapy_all_moods', JSON.stringify(allMoods));
          
          // Verificar humor de hoje
          const todayMoodFromGeneral = userMoods[todayKey];
          if (todayMoodFromGeneral) {
            setTodayMood(todayMoodFromGeneral);
            console.log(`💿 [AIAssistant] Humor recuperado do sistema geral: ${todayMoodFromGeneral}`);
          } else {
            setTodayMood(null);
            console.log(`📋 [AIAssistant] Nenhum humor encontrado para hoje (${todayKey})`);
          }
        } catch (error) {
          console.error('❌ Erro ao processar sistema geral:', error);
          setTodayMood(null);
        }
      }
      
      // 2. SEGUNDO: Verificar API e sincronizar
      try {
        const response = await apiRequest('GET', `/api/today-mood/${userId}`);
        const apiData = await response.json();
        
        if (apiData && apiData.mood && apiData.date === todayKey) {
          // Se a API tem um humor válido para hoje, usar ele
          setTodayMood(apiData.mood);
          
          // Sincronizar localStorage com dados da API
          const moodData = {
            userId: userId.toString(),
            mood: apiData.mood,
            date: todayKey,
            timestamp: Date.now()
          };
          
          localStorage.setItem(individualMoodKey, JSON.stringify(moodData));
          
          const allMoods = JSON.parse(localStorage.getItem('scapy_all_moods') || '{}');
          if (!allMoods[userId.toString()]) {
            allMoods[userId.toString()] = {};
          }
          allMoods[userId.toString()][todayKey] = apiData.mood;
          localStorage.setItem('scapy_all_moods', JSON.stringify(allMoods));
          
          console.log(`🌐 [AIAssistant] Humor sincronizado da API: ${apiData.mood} para ${todayKey}`);
        } else if (!savedIndividualMood) {
          // Se nem localStorage nem API têm humor válido para hoje
          setTodayMood(null);
          console.log(`📋 [AIAssistant] Nenhum humor registrado para hoje (${todayKey})`);
        }
      } catch (apiError) {
        console.error('⚠️ Erro na API, usando dados do localStorage:', apiError);
        // Se API falhar, manter o que foi carregado do localStorage
      }
    } catch (error) {
      console.error('❌ Erro ao verificar humor de hoje:', error);
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

    // =========== SISTEMA DE VERIFICAÇÃO ROBUSTA ===========
    // Verificar se já existe humor selecionado para hoje
    if (todayMood) {
      console.log(`🚫 [AIAssistant] Humor já selecionado para hoje: ${todayMood}`);
      toast({
        title: "Humor já selecionado",
        description: `Você já escolheu seu humor para hoje: ${todayMood}. Tente novamente amanhã às 00:00!`,
        variant: "default",
      });
      return;
    }

    // Verificação adicional no localStorage para máxima segurança
    const todayKey = new Date().toISOString().split('T')[0];
    const individualMoodKey = `scapy_mood_${user.id}_${todayKey}`;
    const savedMoodData = localStorage.getItem(individualMoodKey);
    
    if (savedMoodData) {
      try {
        const moodData = JSON.parse(savedMoodData);
        if (moodData.date === todayKey) {
          console.log(`🚫 [AIAssistant] Humor encontrado no localStorage para hoje: ${moodData.mood}`);
          setTodayMood(moodData.mood); // Sincronizar estado
          toast({
            title: "Humor já registrado",
            description: `Você já registrou seu humor hoje: ${moodData.mood}. Suas metas já foram geradas!`,
            variant: "default",
          });
          return;
        }
      } catch (error) {
        console.error('❌ Erro ao verificar localStorage:', error);
      }
    }

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

      // 4. Salvar humor imediatamente no localStorage ULTRA-PERSISTENTE
      const getLocalDateKey = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const todayKey = getLocalDateKey(); // Usar data local
      const moodData = {
        userId: user.id.toString(),
        mood: normalizedMood,
        date: todayKey,
        timestamp: Date.now(),
        source: 'ai-assistant',
        version: '2.0'
      };
      
      // === SISTEMA DE SALVAMENTO TRIPLO PARA MÁXIMA ROBUSTEZ ===
      
      // 1. Salvar humor individual (chave principal)
      const individualKey = `scapy_mood_${user.id}_${todayKey}`;
      localStorage.setItem(individualKey, JSON.stringify(moodData));
      
      // 2. Salvar no registro geral de humores (backup)
      const allMoods = JSON.parse(localStorage.getItem('scapy_all_moods') || '{}');
      if (!allMoods[user.id.toString()]) {
        allMoods[user.id.toString()] = {};
      }
      allMoods[user.id.toString()][todayKey] = normalizedMood;
      localStorage.setItem('scapy_all_moods', JSON.stringify(allMoods));
      
      // 3. Salvar backup com timestamp extendido
      const backupKey = `scapy_mood_backup_${user.id}_${todayKey}_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(moodData));
      
      // 4. Salvar estado geral da sessão
      const sessionData = {
        lastMoodUpdate: Date.now(),
        currentMood: normalizedMood,
        userId: user.id.toString(),
        date: todayKey
      };
      localStorage.setItem('scapy_session_mood', JSON.stringify(sessionData));
      
      console.log(`💾 [AIAssistant] Humor "${mood}" salvo com ULTRA-PERSISTÊNCIA para ${todayKey}`);
      
      // 5. Salvar também no formato para compatibilidade com WeeklyMoodStorage
      const dailyMoodKey = `scapy_daily_mood_${user.id}_${todayKey}`;
      localStorage.setItem(dailyMoodKey, JSON.stringify(moodData));
      
      // 6. Disparar múltiplos eventos para sincronização ultra-robusta
      const eventDate = new Date();
      const dayOfWeek = eventDate.getDay(); // 0-6 (domingo a sábado)
      
      // Evento principal de atualização de humor
      const moodEvent = new CustomEvent('moodUpdated', {
        detail: {
          userId: user.id.toString(),
          mood: normalizedMood,
          date: todayKey,
          dayOfWeek: dayOfWeek,
          timestamp: Date.now(),
          source: 'ai-assistant'
        }
      });
      window.dispatchEvent(moodEvent);
      
      // Evento específico para WeeklyTracker
      const weeklyEvent = new CustomEvent('weeklyMoodUpdated', {
        detail: {
          userId: user.id.toString(),
          mood: normalizedMood,
          dayOfWeek: dayOfWeek,
          weekStart: (() => {
            const startOfWeek = new Date(eventDate);
            startOfWeek.setDate(eventDate.getDate() - eventDate.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return startOfWeek.toISOString();
          })(),
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(weeklyEvent);
      
      // Evento de tarefas para compatibilidade
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
      
      console.log(`🔔 [AIAssistant] Eventos de sincronização disparados - humor: ${normalizedMood}, dia: ${dayOfWeek}`);

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
              } ${isCurrentlySelecting ? 'animate-pulse' : ''} ${
                todayMood && !isSelected ? 'cursor-not-allowed' : ''
              }`}
              style={{ opacity: isSelected ? 1 : todayMood ? 0.3 : 0.73 }}
              onClick={() => handleMoodSelect(label)}
              data-testid={`mood-${id}`}
              title={todayMood && !isSelected ? `Humor já selecionado para hoje: ${todayMood}` : `Selecionar humor: ${label}`}
            >
              <Icon className="w-5 h-5 mr-1" />
              {label}
            </Button>
          );
        })}
      </div>
    </section>
  );
}