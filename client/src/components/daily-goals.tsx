import { Target, Plus, CheckCircle2, Circle, Clock, Star, User, Dumbbell, Book, Coffee, Heart, Brain, ChevronDown, ChevronUp, X, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailyTask {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  prioridade: 1 | 2 | 3 | 4 | 5;
  concluida: boolean;
  date: Date;
  userId: string;
  suggestionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomGoal {
  id: string;
  userId: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  prioridade: number;
  concluida: boolean;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NewCustomGoal {
  titulo: string;
  descricao: string;
  categoria: string;
  prioridade: number;
}

interface User {
  id: number;
  email: string;
  fullName: string;
}

interface TaskProgress {
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

export default function DailyGoals() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [customGoals, setCustomGoals] = useState<CustomGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<TaskProgress>({ totalTasks: 0, completedTasks: 0, progressPercentage: 0 });
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<NewCustomGoal>({
    titulo: '',
    descricao: '',
    categoria: 'personal',
    prioridade: 3
  });
  const { toast } = useToast();

  // Ícones para diferentes categorias
  const getCategoryIcon = (categoria: string | null) => {
    switch (categoria) {
      case 'exercicio': return Dumbbell;
      case 'meditacao': return Brain;
      case 'hobby': return Book;
      case 'social': return User;
      case 'autocuidado': return Heart;
      default: return Star;
    }
  };

  // ============================================
  // SISTEMA DE PERSISTÊNCIA ROBUSTA PARA METAS DIÁRIAS
  // ============================================
  
  const saveToLocalStorage = (key: string, data: any) => {
    try {
      const timestamp = Date.now();
      const dataWithTimestamp = {
        ...data,
        timestamp,
        userId: user?.id?.toString() || 'unknown'
      };
      localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
      console.log(`💾 [DailyGoals] Dados salvos no localStorage: ${key}`, dataWithTimestamp);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  };

  const loadFromLocalStorage = (key: string) => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        console.log(`📖 [DailyGoals] Dados carregados do localStorage: ${key}`, parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
    }
    return null;
  };

  // Salvar metas personalizadas sempre que mudarem
  useEffect(() => {
    if (user && customGoals.length > 0) {
      const todayKey = new Date().toISOString().split('T')[0];
      const localGoalsKey = `scapy_custom_goals_${user.id}_${todayKey}`;
      saveToLocalStorage(localGoalsKey, { goals: customGoals });
      
      // Disparar evento para sincronização com outras abas
      const goalEvent = new CustomEvent('customGoalsUpdated', {
        detail: {
          userId: user.id.toString(),
          goals: customGoals,
          date: todayKey,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(goalEvent);
    }
  }, [customGoals, user]);

  // Escutar mudanças do localStorage de outras abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (user && e.key?.includes(`scapy_custom_goals_${user.id}`)) {
        const data = loadFromLocalStorage(e.key);
        if (data && data.goals) {
          setCustomGoals(data.goals);
          console.log('🔄 [DailyGoals] Metas sincronizadas de outra aba:', data.goals);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Carregar dados do usuário e dados persistentes
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // Carregar metas personalizadas do localStorage primeiro
        const todayKey = new Date().toISOString().split('T')[0];
        const localGoalsKey = `scapy_custom_goals_${userData.id}_${todayKey}`;
        const savedLocalGoals = loadFromLocalStorage(localGoalsKey);
        
        if (savedLocalGoals && savedLocalGoals.goals) {
          setCustomGoals(savedLocalGoals.goals);
          console.log(`🎯 [DailyGoals] Metas personalizadas carregadas do localStorage para ${todayKey}:`, savedLocalGoals.goals.length);
        }
        
        loadTasks(userData.id);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Escutar atualizações de tarefas
  useEffect(() => {
    const handleTasksUpdated = () => {
      if (user) {
        loadTasks(user.id);
      }
    };

    window.addEventListener('tasksUpdated', handleTasksUpdated);
    return () => window.removeEventListener('tasksUpdated', handleTasksUpdated);
  }, [user]);

  const loadTasks = async (userId: number) => {
    try {
      setIsLoading(true);
      
      // Carregar tarefas da IA
      const tasksResponse = await apiRequest('GET', `/api/daily-tasks/${userId}`);
      const tasksData = await tasksResponse.json();
      setTasks(tasksData);

      // Carregar metas personalizadas
      const customGoalsResponse = await apiRequest('GET', `/api/custom-goals/${userId}`);
      const customGoalsData = await customGoalsResponse.json();
      setCustomGoals(customGoalsData);

      // Carregar progresso
      const progressResponse = await apiRequest('GET', `/api/task-progress/${userId}`);
      const progressData = await progressResponse.json();
      setProgress(progressData);

      console.log(`📋 Carregadas ${tasksData.length} tarefas da IA e ${customGoalsData.length} metas personalizadas para hoje`);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      const response = await apiRequest('PUT', `/api/daily-tasks/${taskId}/toggle`);
      const updatedTask = await response.json();

      // Atualizar estado local
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));

      // Atualizar progresso
      if (user) {
        const progressResponse = await apiRequest('GET', `/api/task-progress/${user.id}`);
        const progressData = await progressResponse.json();
        setProgress(progressData);
      }

      toast({
        title: updatedTask.concluida ? "Tarefa concluída!" : "Tarefa desmarcada",
        description: updatedTask.concluida 
          ? "Excelente! Continue assim!" 
          : "Tarefa desmarcada, você pode tentar novamente.",
      });

    } catch (error) {
      console.error('Erro ao alternar tarefa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tarefa.",
        variant: "destructive",
      });
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleAddGoal = async () => {
    if (!user) return;

    if (!newGoal.titulo.trim()) {
      toast({
        title: "Erro",
        description: "O título da meta é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar meta local primeiro para resposta imediata
      const localGoal: CustomGoal = {
        id: `local_${Date.now()}`, // ID temporário
        userId: user.id.toString(),
        titulo: newGoal.titulo.trim(),
        descricao: newGoal.descricao.trim() || null,
        categoria: newGoal.categoria,
        prioridade: newGoal.prioridade,
        concluida: false,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Adicionar à lista local imediatamente
      setCustomGoals(prev => [...prev, localGoal]);

      // Reset form e fechar modal
      setNewGoal({
        titulo: '',
        descricao: '',
        categoria: 'personal',
        prioridade: 3
      });
      setIsAddingGoal(false);

      // Mostrar toast de sucesso imediato
      toast({
        title: "Meta adicionada!",
        description: "Sua meta personalizada foi criada com sucesso.",
      });

      console.log(`🎯 [DailyGoals] Meta adicionada localmente:`, localGoal);

      // Tentar salvar no servidor em segundo plano
      try {
        const response = await apiRequest('POST', '/api/custom-goals', {
          userId: user.id.toString(),
          titulo: newGoal.titulo.trim(),
          descricao: newGoal.descricao.trim() || null,
          categoria: newGoal.categoria,
          prioridade: newGoal.prioridade,
          date: new Date()
        });

        const createdGoal = await response.json();
        
        // Substituir o item local pelo item do servidor
        setCustomGoals(prev => prev.map(goal => 
          goal.id === localGoal.id ? createdGoal : goal
        ));

        console.log(`✅ [DailyGoals] Meta sincronizada com servidor:`, createdGoal);

        // Atualizar progresso
        const progressResponse = await apiRequest('GET', `/api/task-progress/${user.id}`);
        const progressData = await progressResponse.json();
        setProgress(progressData);

      } catch (serverError) {
        console.warn('⚠️ [DailyGoals] Erro ao sincronizar com servidor, mantendo versão local:', serverError);
        // Meta permanece salva localmente mesmo se o servidor falhar
      }

    } catch (error) {
      console.error('Erro ao adicionar meta personalizada:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a meta.",
        variant: "destructive",
      });
    }
  };

  const toggleCustomGoal = async (goalId: string) => {
    try {
      // Atualizar estado local imediatamente para resposta rápida
      setCustomGoals(prev => prev.map(goal => {
        if (goal.id === goalId) {
          const updatedGoal = { ...goal, concluida: !goal.concluida };
          console.log(`🔄 [DailyGoals] Meta ${goalId} ${updatedGoal.concluida ? 'concluída' : 'desmarcada'} localmente`);
          return updatedGoal;
        }
        return goal;
      }));

      const currentGoal = customGoals.find(goal => goal.id === goalId);
      const newStatus = !currentGoal?.concluida;

      // Mostrar toast imediato
      toast({
        title: newStatus ? "Meta concluída!" : "Meta desmarcada",
        description: newStatus 
          ? "Parabéns! Continue assim!" 
          : "Meta desmarcada, você pode tentar novamente.",
      });

      // Tentar sincronizar com o servidor em segundo plano
      if (!goalId.startsWith('local_')) {
        try {
          const response = await apiRequest('PUT', `/api/custom-goals/${goalId}/toggle`);
          const updatedGoal = await response.json();

          setCustomGoals(prev => prev.map(goal => 
            goal.id === goalId ? updatedGoal : goal
          ));

          console.log(`✅ [DailyGoals] Meta ${goalId} sincronizada com servidor`);

          // Atualizar progresso
          if (user) {
            const progressResponse = await apiRequest('GET', `/api/task-progress/${user.id}`);
            const progressData = await progressResponse.json();
            setProgress(progressData);
          }
        } catch (serverError) {
          console.warn('⚠️ [DailyGoals] Erro ao sincronizar toggle com servidor:', serverError);
          // Reverter para estado anterior se servidor falhar
          setCustomGoals(prev => prev.map(goal => {
            if (goal.id === goalId) {
              return { ...goal, concluida: !newStatus };
            }
            return goal;
          }));
        }
      }

    } catch (error) {
      console.error('Erro ao alternar meta personalizada:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a meta.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <section className="mb-8 relative">
        <div className="relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[30%] z-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-4" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)', borderColor: 'rgba(0, 5, 21, 0.73)' }}>
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Target className="w-7 h-7 text-primary-foreground animate-pulse" />
              </div>
            </div>
          </div>
          <Card className="border-border pt-6 rounded-3xl" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-2 min-h-[120px]">
                <div className="text-center text-muted-foreground">
                  Carregando suas metas do dia...
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 relative">
      <div className="relative">
        {/* Ícone de alvo no topo do card com progresso */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[30%] z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center border-4" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)', borderColor: 'rgba(0, 5, 21, 0.73)' }}>
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center relative">
              <Target className="w-7 h-7 text-primary-foreground" />
              {progress.totalTasks > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {progress.completedTasks}
                </div>
              )}
            </div>
          </div>
        </div>

        <Card className="border-border pt-6 rounded-3xl" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}>
          <CardContent className="p-6">
            {tasks.length === 0 && customGoals.length === 0 ? (
              // Estado vazio - sem tarefas
              <div className="flex flex-col items-center justify-center space-y-4 min-h-[120px]">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Metas do Dia
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use o Assistente IA acima para gerar atividades personalizadas baseadas no seu humor!
                  </p>
                </div>
                <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex flex-col items-center space-y-2 hover:bg-primary/10 transition-colors p-4"
                      data-testid="button-add-goal"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground text-center">
                        Adicionar meta própria
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-primary" />
                        <span>Nova Meta Personalizada</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="titulo">Título da Meta *</Label>
                        <Input
                          id="titulo"
                          placeholder="Ex: Ler 30 páginas de um livro"
                          value={newGoal.titulo}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, titulo: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="descricao">Descrição (opcional)</Label>
                        <Textarea
                          id="descricao"
                          placeholder="Descreva mais detalhes sobre sua meta..."
                          value={newGoal.descricao}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, descricao: e.target.value }))}
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="categoria">Categoria</Label>
                        <Select value={newGoal.categoria} onValueChange={(value) => setNewGoal(prev => ({ ...prev, categoria: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Pessoal</SelectItem>
                            <SelectItem value="exercicio">Exercício</SelectItem>
                            <SelectItem value="meditacao">Meditação</SelectItem>
                            <SelectItem value="hobby">Hobby</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="autocuidado">Autocuidado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="prioridade">Prioridade</Label>
                        <Select value={newGoal.prioridade.toString()} onValueChange={(value) => setNewGoal(prev => ({ ...prev, prioridade: parseInt(value) }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Muito baixa</SelectItem>
                            <SelectItem value="2">2 - Baixa</SelectItem>
                            <SelectItem value="3">3 - Média</SelectItem>
                            <SelectItem value="4">4 - Alta</SelectItem>
                            <SelectItem value="5">5 - Muito alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex space-x-2 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsAddingGoal(false)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleAddGoal}
                          disabled={!newGoal.titulo.trim()}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Meta
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              // Estado com tarefas
              <div className="space-y-4">
                {/* Header com progresso */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Metas do Dia
                  </h3>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="text-sm text-muted-foreground">
                      {progress.completedTasks} de {progress.totalTasks} concluídas
                    </div>
                    <div className="text-sm font-medium text-primary">
                      ({progress.progressPercentage}%)
                    </div>
                  </div>
                  {/* Barra de progresso */}
                  <div className="w-full bg-muted/30 rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Lista de tarefas da IA */}
                <div className="space-y-3">
                  {tasks.map((task) => {
                    const CategoryIcon = getCategoryIcon(task.categoria);
                    const isExpanded = expandedTasks.has(task.id);
                    const hasDescription = task.descricao && task.descricao.trim().length > 0;
                    
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          task.concluida 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-muted/10 border-muted/30 hover:bg-muted/20'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-6 w-6 hover:bg-transparent"
                            onClick={() => toggleTask(task.id)}
                            data-testid={`task-toggle-${task.id}`}
                          >
                            {task.concluida ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                            )}
                          </Button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2 flex-1">
                                <CategoryIcon className="w-4 h-4 text-primary flex-shrink-0" />
                                <h4 className={`text-sm font-medium ${
                                  task.concluida ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}>
                                  {task.titulo}
                                </h4>
                              </div>
                              {hasDescription && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-6 w-6 hover:bg-primary/10"
                                  onClick={() => toggleTaskExpanded(task.id)}
                                  data-testid={`task-expand-${task.id}`}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {hasDescription && isExpanded && (
                          <div className="mt-2 ml-9 animate-in slide-in-from-top-1 duration-200">
                            <p className={`text-xs ${
                              task.concluida ? 'line-through text-muted-foreground' : 'text-muted-foreground'
                            } bg-muted/20 p-2 rounded-md`}>
                              {task.descricao}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Lista de metas personalizadas */}
                  {customGoals.map((goal) => {
                    const CategoryIcon = getCategoryIcon(goal.categoria);
                    const isExpanded = expandedTasks.has(goal.id);
                    const hasDescription = goal.descricao && goal.descricao.trim().length > 0;
                    
                    return (
                      <div
                        key={goal.id}
                        className={`p-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
                          goal.concluida 
                            ? 'bg-green-500/10 border-green-500/50' 
                            : 'bg-blue-500/5 border-blue-500/30 hover:bg-blue-500/10'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-6 w-6 hover:bg-transparent"
                            onClick={() => toggleCustomGoal(goal.id)}
                            data-testid={`custom-goal-toggle-${goal.id}`}
                          >
                            {goal.concluida ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-blue-400 hover:text-blue-500" />
                            )}
                          </Button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2 flex-1">
                                <CategoryIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <h4 className={`text-sm font-medium ${
                                  goal.concluida ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}>
                                  {goal.titulo}
                                  <span className="ml-2 text-xs text-blue-500 font-normal">(Meta Própria)</span>
                                </h4>
                              </div>
                              {hasDescription && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-6 w-6 hover:bg-primary/10"
                                  onClick={() => toggleTaskExpanded(goal.id)}
                                  data-testid={`custom-goal-expand-${goal.id}`}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {hasDescription && isExpanded && (
                          <div className="mt-2 ml-9 animate-in slide-in-from-top-1 duration-200">
                            <p className={`text-xs ${
                              goal.concluida ? 'line-through text-muted-foreground' : 'text-muted-foreground'
                            } bg-muted/20 p-2 rounded-md`}>
                              {goal.descricao}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Botão para adicionar metas próprias */}
                <div className="pt-4 border-t border-muted/20">
                  <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-center space-x-2 hover:bg-primary/10 transition-colors p-3"
                        data-testid="button-add-goal-bottom"
                      >
                        <Plus className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Adicionar meta própria
                        </span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md mx-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <Target className="w-5 h-5 text-primary" />
                          <span>Nova Meta Personalizada</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="titulo-bottom">Título da Meta *</Label>
                          <Input
                            id="titulo-bottom"
                            placeholder="Ex: Ler 30 páginas de um livro"
                            value={newGoal.titulo}
                            onChange={(e) => setNewGoal(prev => ({ ...prev, titulo: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="descricao-bottom">Descrição (opcional)</Label>
                          <Textarea
                            id="descricao-bottom"
                            placeholder="Descreva mais detalhes sobre sua meta..."
                            value={newGoal.descricao}
                            onChange={(e) => setNewGoal(prev => ({ ...prev, descricao: e.target.value }))}
                            className="mt-1"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="categoria-bottom">Categoria</Label>
                          <Select value={newGoal.categoria} onValueChange={(value) => setNewGoal(prev => ({ ...prev, categoria: value }))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="personal">Pessoal</SelectItem>
                              <SelectItem value="exercicio">Exercício</SelectItem>
                              <SelectItem value="meditacao">Meditação</SelectItem>
                              <SelectItem value="hobby">Hobby</SelectItem>
                              <SelectItem value="social">Social</SelectItem>
                              <SelectItem value="autocuidado">Autocuidado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="prioridade-bottom">Prioridade</Label>
                          <Select value={newGoal.prioridade.toString()} onValueChange={(value) => setNewGoal(prev => ({ ...prev, prioridade: parseInt(value) }))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 - Muito baixa</SelectItem>
                              <SelectItem value="2">2 - Baixa</SelectItem>
                              <SelectItem value="3">3 - Média</SelectItem>
                              <SelectItem value="4">4 - Alta</SelectItem>
                              <SelectItem value="5">5 - Muito alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex space-x-2 pt-4">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsAddingGoal(false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={handleAddGoal}
                            disabled={!newGoal.titulo.trim()}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Meta
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}