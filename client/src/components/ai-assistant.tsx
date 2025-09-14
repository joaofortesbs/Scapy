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

    const handleNewDayDetected = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (user && customEvent.detail?.userId === user.id) {
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

    const handleMoodReset = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (user && customEvent.detail?.userId === user.id) {
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

  // Sistema robusto de detecção de mudança de dia e reinicialização às 00:00
  useEffect(() => {
    if (!user) return;

    let lastKnownDate = new Date().toISOString().split('T')[0];
    
    const performMidnightReset = () => {
      console.log('🌅 [AIAssistant] REINICIALIZAÇÃO TOTAL INICIADA - Novo dia detectado!');
      
      const newDate = new Date().toISOString().split('T')[0];
      const oldDate = lastKnownDate;
      
      // 1. Limpar estado React completamente
      setTodayMood(null);
      setSelectedMood(null);
      setIsGenerating(false);
      
      // 2. Limpar dados antigos do localStorage para evitar conflitos
      const keysToRemove = [
        `scapy_mood_${user.id}_${oldDate}`,
        `scapy_daily_mood_${user.id}_${oldDate}`,
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
      
      // 3. Resetar dados gerais de humor se necessário
      try {
        const allMoods = JSON.parse(localStorage.getItem('scapy_all_moods') || '{}');
        if (allMoods[user.id.toString()] && allMoods[user.id.toString()][oldDate]) {
          // Manter histórico, mas não interferir no novo dia
          console.log(`📚 [AIAssistant] Mantendo histórico do dia ${oldDate}`);
        }
      } catch (error) {
        console.error('❌ [AIAssistant] Erro ao processar histórico:', error);
      }
      
      // 4. Atualizar referência de data
      lastKnownDate = newDate;
      
      // 5. Disparar eventos de sincronização
      window.dispatchEvent(new CustomEvent('newDayDetected', {
        detail: {
          userId: user.id,
          oldDate: oldDate,
          newDate: newDate,
          timestamp: Date.now(),
          source: 'ai-assistant-midnight-reset'
        }
      }));
      
      window.dispatchEvent(new CustomEvent('moodResetComplete', {
        detail: {
          userId: user.id,
          date: newDate,
          resetType: 'midnight'
        }
      }));
      
      console.log(`🔄 [AIAssistant] REINICIALIZAÇÃO COMPLETA! ${oldDate} → ${newDate}`);
    };

    const checkNewDay = () => {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      
      // Detectar mudança de data
      if (currentDate !== lastKnownDate) {
        console.log(`📅 [AIAssistant] Mudança de data detectada: ${lastKnownDate} → ${currentDate}`);
        performMidnightReset();
        return;
      }
      
      // Verificar se há humor salvo para hoje quando não deveria haver
      const currentMoodKey = `scapy_mood_${user.id}_${currentDate}`;
      const savedMood = localStorage.getItem(currentMoodKey);
      
      // Se é um novo dia e ainda há estado de humor anterior, limpar
      if (todayMood && !savedMood) {
        console.log('🧹 [AIAssistant] Estado inconsistente detectado, limpando...');
        setTodayMood(null);
      }
    };

    // Verificação inicial
    checkNewDay();

    // Verificação a cada 30 segundos para detecção rápida
    const frequentCheck = setInterval(checkNewDay, 30000);

    // Verificação específica à meia-noite
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 5, 0); // 5 segundos após meia-noite para garantir
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const midnightTimeout = setTimeout(() => {
      console.log('🕛 [AIAssistant] MEIA-NOITE EXATA DETECTADA!');
      performMidnightReset();
      
      // Configurar timer diário para próximas meia-noites
      const dailyTimer = setInterval(() => {
        console.log('🕛 [AIAssistant] Timer diário ativado - Nova meia-noite!');
        performMidnightReset();
      }, 24 * 60 * 60 * 1000);

      // Cleanup será feito quando o componente desmontar
      return () => clearInterval(dailyTimer);
    }, msUntilMidnight);

    console.log(`⏰ [AIAssistant] Timer configurado - Próxima verificação em ${Math.round(msUntilMidnight / 1000)} segundos`);

    return () => {
      clearInterval(frequentCheck);
      clearTimeout(midnightTimeout);
    };
  }, [user]); // Remover dependência de todayMood para evitar loops

  const checkTodayMood = async (userId: number) => {
    try {
      // Obter data atual sempre atualizada
      const now = new Date();
      const todayKey = now.toISOString().split('T')[0];
      
      console.log(`🕒 [AIAssistant] Verificando humor para: ${todayKey} às ${now.toLocaleTimeString()}`);
      
      let foundMood = null;
      
      // 1. PRIMEIRA PRIORIDADE: Verificar OptimizedMoodStorage (usado pelo WeeklyTracker)
      try {
        const weeklyMoodsData = JSON.parse(localStorage.getItem('scapy_weekly_moods_v3') || '{}');
        const userWeeklyData = weeklyMoodsData[userId.toString()];
        
        if (userWeeklyData) {
          // Calcular chave da semana atual
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const weekKey = startOfWeek.toISOString().split('T')[0];
          
          const weekData = userWeeklyData[weekKey];
          if (weekData && weekData.moodByDay) {
            // Verificar humor para hoje (domingo = 0, segunda = 1, etc.)
            const dayOfWeek = new Date().getDay();
            const todayMoodFromWeekly = weekData.moodByDay[dayOfWeek];
            
            if (todayMoodFromWeekly) {
              foundMood = todayMoodFromWeekly;
              console.log(`💿 [AIAssistant] HUMOR ENCONTRADO NO OPTIMIZED STORAGE: ${foundMood} para ${todayKey} (dia ${dayOfWeek})`);
              
              // Sincronizar para todos os sistemas para garantir consistência
              const moodData = {
                userId: userId.toString(),
                mood: foundMood,
                date: todayKey,
                timestamp: Date.now(),
                source: 'sync-from-optimized'
              };
              
              // Sincronizar para chave individual
              localStorage.setItem(`scapy_mood_${userId}_${todayKey}`, JSON.stringify(moodData));
              
              // Sincronizar para sistema geral
              const allMoods = JSON.parse(localStorage.getItem('scapy_all_moods') || '{}');
              if (!allMoods[userId.toString()]) {
                allMoods[userId.toString()] = {};
              }
              allMoods[userId.toString()][todayKey] = foundMood;
              localStorage.setItem('scapy_all_moods', JSON.stringify(allMoods));
              
              // Sincronizar para chave diária
              localStorage.setItem(`scapy_daily_mood_${userId}_${todayKey}`, JSON.stringify(moodData));
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar OptimizedMoodStorage:', error);
      }
      
      // 2. SEGUNDA PRIORIDADE: Verificar sistema geral compartilhado (scapy_all_moods)
      if (!foundMood) {
        try {
          const allMoods = JSON.parse(localStorage.getItem('scapy_all_moods') || '{}');
          const userMoods = allMoods[userId.toString()] || {};
          
          // Verificar humor de hoje no sistema geral
          const todayMoodFromGeneral = userMoods[todayKey];
          if (todayMoodFromGeneral) {
            foundMood = todayMoodFromGeneral;
            console.log(`💿 [AIAssistant] HUMOR ENCONTRADO NO SISTEMA GERAL: ${foundMood} para ${todayKey}`);
            
            // Sincronizar de volta para a chave individual para consistência
            const moodData = {
              userId: userId.toString(),
              mood: foundMood,
              date: todayKey,
              timestamp: Date.now(),
              source: 'sync-from-general'
            };
            localStorage.setItem(`scapy_mood_${userId}_${todayKey}`, JSON.stringify(moodData));
          }
          
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
        } catch (error) {
          console.error('❌ Erro ao processar sistema geral:', error);
        }
      }
      
      // 2. SEGUNDA PRIORIDADE: Verificar chave individual se não encontrou no geral
      if (!foundMood) {
        const individualMoodKey = `scapy_mood_${userId}_${todayKey}`;
        const savedIndividualMood = localStorage.getItem(individualMoodKey);
        
        if (savedIndividualMood) {
          try {
            const moodData = JSON.parse(savedIndividualMood);
            
            // Verificação mais tolerante de data
            if (moodData.date === todayKey && moodData.mood) {
              foundMood = moodData.mood;
              console.log(`💿 [AIAssistant] Humor encontrado na chave individual: ${foundMood} para ${todayKey}`);
            } else {
              // Humor é de outro dia, limpar
              console.log(`🗑️ [AIAssistant] Humor de data diferente (${moodData.date}), removendo...`);
              localStorage.removeItem(individualMoodKey);
            }
          } catch (error) {
            console.error('❌ Erro ao parsear humor individual, removendo:', error);
            localStorage.removeItem(individualMoodKey);
          }
        }
      }
      
      // 3. TERCEIRA PRIORIDADE: Verificar chave de compatibilidade
      if (!foundMood) {
        const dailyMoodKey = `scapy_daily_mood_${userId}_${todayKey}`;
        const savedDailyMood = localStorage.getItem(dailyMoodKey);
        
        if (savedDailyMood) {
          try {
            const moodData = JSON.parse(savedDailyMood);
            if (moodData.mood && moodData.date === todayKey) {
              foundMood = moodData.mood;
              console.log(`💿 [AIAssistant] Humor encontrado na chave diária: ${foundMood}`);
              
              // Sincronizar para chave principal
              const syncData = {
                userId: userId.toString(),
                mood: foundMood,
                date: todayKey,
                timestamp: Date.now(),
                source: 'sync-from-daily'
              };
              const mainMoodKey = `scapy_mood_${userId}_${todayKey}`;
              localStorage.setItem(mainMoodKey, JSON.stringify(syncData));
            }
          } catch (error) {
            console.error('❌ Erro ao parsear humor da chave diária:', error);
          }
        }
      }
      
      // 4. Definir o estado final
      if (foundMood) {
        setTodayMood(foundMood);
        console.log(`✅ [AIAssistant] HUMOR CONFIRMADO PARA HOJE: ${foundMood} (${todayKey})`);
      } else {
        setTodayMood(null);
        console.log(`📋 [AIAssistant] Nenhum humor encontrado para hoje (${todayKey})`);
      }
      
      // 5. QUARTA PRIORIDADE: Verificar API e sincronizar (opcional)
      try {
        const response = await apiRequest('GET', `/api/today-mood/${userId}`);
        const apiData = await response.json();
        
        if (apiData && apiData.mood && apiData.date === todayKey) {
          // Se a API tem um humor e não temos local, ou se é diferente, sincronizar
          if (!foundMood || foundMood !== apiData.mood) {
            setTodayMood(apiData.mood);
            
            // Sincronizar localStorage com dados da API
            const moodData = {
              userId: userId.toString(),
              mood: apiData.mood,
              date: todayKey,
              timestamp: Date.now(),
              source: 'api-sync'
            };
            
            const apiSyncMoodKey = `scapy_mood_${userId}_${todayKey}`;
            localStorage.setItem(apiSyncMoodKey, JSON.stringify(moodData));
            
            const allMoods = JSON.parse(localStorage.getItem('scapy_all_moods') || '{}');
            if (!allMoods[userId.toString()]) {
              allMoods[userId.toString()] = {};
            }
            allMoods[userId.toString()][todayKey] = apiData.mood;
            localStorage.setItem('scapy_all_moods', JSON.stringify(allMoods));
            
            console.log(`🌐 [AIAssistant] Humor sincronizado da API: ${apiData.mood} para ${todayKey}`);
          }
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

    setIsGenerating(true);
    setSelectedMood(mood);

    try {
      console.log(`🎯 Selecionando humor: ${mood} para usuário ${user.id}`);

      // Definir chave do dia atual
      const todayKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // 1. Registrar seleção de humor (normalizado sem acentos)
      const normalizedMood = mood.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
        
      await apiRequest('POST', '/api/mood-selection', {
        userId: user.id.toString(),
        mood: normalizedMood
      });

      console.log(`💭 Humor registrado com sucesso`);

      // 2. Atualizar estado do humor imediatamente para feedback instantâneo
      setTodayMood(normalizedMood);
      console.log(`🎯 Estado todayMood atualizado INSTANTANEAMENTE para: ${normalizedMood}`);

      // 3. Gerar sugestões personalizadas de forma otimizada
      toast({
        title: "🚀 Processando instantaneamente...",
        description: "Nossa IA Gemini está gerando suas metas personalizadas!",
      });

      // Processar geração de metas com tratamento otimizado
      const suggestionResponse = await apiRequest('POST', '/api/generate-suggestions', {
        userId: user.id.toString(),
        mood: normalizedMood
      });

      const suggestionData = await suggestionResponse.json();
      
      console.log(`✅ [GEMINI] Metas geradas instantaneamente:`, suggestionData);

      // 4. Persistir metas geradas com sistema robusto
      if (suggestionData && suggestionData.tasks && suggestionData.tasks.length > 0) {
        const tasksData = {
          userId: user.id.toString(),
          tasks: suggestionData.tasks,
          mood: normalizedMood,
          date: todayKey,
          timestamp: Date.now(),
          source: 'gemini-ai-assistant',
          version: '2.0'
        };

        // === SISTEMA DE PERSISTÊNCIA DE METAS ULTRA-ROBUSTO ===
        
        // 1. Salvar metas principais
        const tasksKey = `scapy_ai_tasks_${user.id}_${todayKey}`;
        localStorage.setItem(tasksKey, JSON.stringify(tasksData));
        
        // 2. Backup das metas
        const tasksBackupKey = `scapy_ai_tasks_backup_${user.id}_${todayKey}_${Date.now()}`;
        localStorage.setItem(tasksBackupKey, JSON.stringify(tasksData));
        
        // 3. Sincronização com sistema geral
        const allTasks = JSON.parse(localStorage.getItem('scapy_all_ai_tasks') || '{}');
        if (!allTasks[user.id.toString()]) {
          allTasks[user.id.toString()] = {};
        }
        allTasks[user.id.toString()][todayKey] = suggestionData.tasks;
        localStorage.setItem('scapy_all_ai_tasks', JSON.stringify(allTasks));
        
        // 4. Sincronizar com OptimizedMoodStorage para WeeklyTracker
        try {
          const weeklyMoodsData = JSON.parse(localStorage.getItem('scapy_weekly_moods_v3') || '{}');
          const userId = user.id.toString();
          
          if (!weeklyMoodsData[userId]) {
            weeklyMoodsData[userId] = {};
          }
          
          // Calcular chave da semana atual
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const weekKey = startOfWeek.toISOString().split('T')[0];
          
          // Inicializar dados da semana se não existir
          if (!weeklyMoodsData[userId][weekKey]) {
            weeklyMoodsData[userId][weekKey] = {
              userId: userId,
              weekStart: startOfWeek.toISOString(),
              weekEnd: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
              moodByDay: [null, null, null, null, null, null, null],
              timestamp: Date.now(),
              version: '3.0.0'
            };
          }
          
          // Atualizar humor do dia atual
          const dayOfWeek = new Date().getDay();
          weeklyMoodsData[userId][weekKey].moodByDay[dayOfWeek] = normalizedMood;
          
          localStorage.setItem('scapy_weekly_moods_v3', JSON.stringify(weeklyMoodsData));
          console.log(`🔄 [GEMINI] Sincronizado com OptimizedMoodStorage para dia ${dayOfWeek}`);
        } catch (error) {
          console.error('❌ Erro ao sincronizar com OptimizedMoodStorage:', error);
        }

        // 5. Disparar eventos de sincronização para metas
        const tasksEvent = new CustomEvent('tasksGenerated', {
          detail: {
            userId: user.id.toString(),
            tasks: suggestionData.tasks,
            mood: normalizedMood,
            date: todayKey,
            timestamp: Date.now(),
            source: 'gemini-ai-assistant'
          }
        });
        window.dispatchEvent(tasksEvent);
        
        console.log(`💾 [GEMINI] Metas salvas com ULTRA-PERSISTÊNCIA para ${todayKey}`);
      }
      
      toast({
        title: "✅ Metas criadas instantaneamente!",
        description: `${suggestionData.tasks.length} atividades personalizadas foram geradas e salvas!`,
      });

      // 5. Salvar humor imediatamente no localStorage ULTRA-PERSISTENTE
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
              } ${isCurrentlySelecting ? 'animate-pulse' : ''}`}
              style={{ opacity: isSelected ? 1 : todayMood ? 0.3 : 0.73 }}
              onClick={() => handleMoodSelect(label)}
              data-testid={`mood-${id}`}
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