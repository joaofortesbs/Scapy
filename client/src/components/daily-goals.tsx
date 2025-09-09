import { Target, Plus, CheckCircle2, Circle, Clock, Star, User, Dumbbell, Book, Coffee, Heart, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export function DailyGoals() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<TaskProgress>({ totalTasks: 0, completedTasks: 0, progressPercentage: 0 });
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
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

  // Carregar dados do usuário
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
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
      
      // Carregar tarefas
      const tasksResponse = await apiRequest('GET', `/api/daily-tasks/${userId}`);
      const tasksData = await tasksResponse.json();
      setTasks(tasksData);

      // Carregar progresso
      const progressResponse = await apiRequest('GET', `/api/task-progress/${userId}`);
      const progressData = await progressResponse.json();
      setProgress(progressData);

      console.log(`📋 Carregadas ${tasksData.length} tarefas para hoje`);
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

  const handleAddGoal = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de adicionar metas próprias estará disponível em breve!",
    });
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
            {tasks.length === 0 ? (
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
                <Button
                  variant="ghost"
                  className="flex flex-col items-center space-y-2 hover:bg-primary/10 transition-colors p-4"
                  onClick={handleAddGoal}
                  data-testid="button-add-goal"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground text-center">
                    Adicionar meta própria
                  </span>
                </Button>
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

                {/* Lista de tarefas */}
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
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  {Array.from({ length: task.prioridade }, (_, i) => (
                                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                  ))}
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
                </div>

                {/* Botão para adicionar metas próprias */}
                <div className="pt-4 border-t border-muted/20">
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-center space-x-2 hover:bg-primary/10 transition-colors p-3"
                    onClick={handleAddGoal}
                    data-testid="button-add-goal"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Adicionar meta própria
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}