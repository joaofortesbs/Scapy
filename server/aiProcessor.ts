import { GoogleGenAI } from "@google/genai";
import type { 
  MoodSelection, 
  QuizContextualizacao, 
  UserObjective, 
  DailyTask, 
  InsertDailyTask 
} from "@shared/schema";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY
});

interface UserProfileData {
  mood: string;
  motivation?: string;
  objectives: UserObjective[];
  previousTasks?: DailyTask[];
}

interface ActivitySuggestion {
  titulo: string;
  descricao: string;
  categoria: 'meditacao' | 'exercicio' | 'hobby' | 'social' | 'produtividade' | 'autocuidado';
  prioridade: 1 | 2 | 3 | 4 | 5;
  duracaoEstimada: string;
}

interface AISuggestionResponse {
  activities: ActivitySuggestion[];
  message: string;
  reasoning: string;
}

export class AIProcessor {
  constructor() {}

  /**
   * Gera sugestões de atividades personalizadas com base no perfil do usuário
   */
  async generatePersonalizedSuggestions(userProfile: UserProfileData): Promise<AISuggestionResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(userProfile);

      console.log(`🤖 Gerando sugestões para usuário com humor: ${userProfile.mood}`);

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              activities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    titulo: { type: "string" },
                    descricao: { type: "string" },
                    categoria: { 
                      type: "string",
                      enum: ["meditacao", "exercicio", "hobby", "social", "produtividade", "autocuidado"]
                    },
                    prioridade: { 
                      type: "integer",
                      minimum: 1,
                      maximum: 5
                    },
                    duracaoEstimada: { type: "string" }
                  },
                  required: ["titulo", "descricao", "categoria", "prioridade", "duracaoEstimada"]
                }
              },
              message: { type: "string" },
              reasoning: { type: "string" }
            },
            required: ["activities", "message", "reasoning"]
          }
        },
        contents: userPrompt
      });

      const rawJson = response.text;
      console.log(`🎯 Resposta bruta da IA: ${rawJson?.substring(0, 200)}...`);

      if (rawJson) {
        const data: AISuggestionResponse = JSON.parse(rawJson);
        console.log(`✅ Sugestões geradas: ${data.activities.length} atividades`);
        return data;
      } else {
        throw new Error("Resposta vazia da IA");
      }
    } catch (error) {
      console.error(`❌ Erro ao gerar sugestões:`, error);
      return this.getFallbackSuggestions(userProfile.mood);
    }
  }

  /**
   * Constrói o prompt do sistema para o Gemini
   */
  private buildSystemPrompt(): string {
    return `Você é um assistente especializado em recuperação de vícios e desenvolvimento pessoal.

Seu objetivo é analisar o estado emocional e os objetivos de um usuário em jornada de recuperação de pornografia/masturbação, e sugerir atividades práticas e eficazes.

CONTEXTO IMPORTANTE:
- O usuário está em processo de recuperação do vício em pornografia/masturbação
- Diferentes estados emocionais requerem diferentes tipos de atividades
- As sugestões devem ser progressivas e alinhadas com os objetivos pessoais do usuário

DIRETRIZES POR ESTADO EMOCIONAL:

MEDO (vulnerabilidade alta):
- Priorize atividades de distração imediata e ocupação mental
- Foque em exercícios de mindfulness e respiração
- Sugira atividades sociais ou de contato com outros
- Evite momentos de ociosidade
- Prioridade: 4-5 (alta urgência)

ESTÁVEL (estado neutro):
- Equilibre atividades de manutenção e crescimento
- Inclua exercícios físicos regulares
- Sugira hobbies construtivos
- Atividades de autocuidado
- Prioridade: 2-3 (moderada)

FELIZ (estado positivo):
- Aproveite o momentum para atividades desafiadoras
- Foque em objetivos de longo prazo
- Sugira atividades sociais e de conexão
- Projetos criativos e produtivos
- Prioridade: 1-3 (variada)

CATEGORIAS DE ATIVIDADES:
- meditacao: Mindfulness, respiração, relaxamento
- exercicio: Atividade física, esportes, caminhada
- hobby: Atividades criativas, leitura, música
- social: Interação com outros, comunidade
- produtividade: Trabalho, estudos, organização
- autocuidado: Higiene, alimentação, descanso

REGRAS:
1. Sempre sugira 3-6 atividades variadas
2. Considere a motivação principal do usuário
3. Inclua pelo menos uma atividade de cada categoria relevante
4. Seja específico nas descrições
5. Ajuste a intensidade baseada no humor
6. Use linguagem motivadora e compreensiva
7. As atividades devem ser realizáveis no mesmo dia`;
  }

  /**
   * Constrói o prompt específico do usuário
   */
  private buildUserPrompt(userProfile: UserProfileData): string {
    const moodDescription = this.getMoodDescription(userProfile.mood);
    const objectivesText = userProfile.objectives.length > 0 
      ? userProfile.objectives.map(obj => `- ${obj.texto}`).join('\n')
      : 'Nenhum objetivo específico definido';

    return `PERFIL DO USUÁRIO:

Estado emocional hoje: ${userProfile.mood.toUpperCase()}
${moodDescription}

Motivação principal: ${userProfile.motivation || 'Não especificada'}

Objetivos pessoais:
${objectivesText}

${userProfile.previousTasks && userProfile.previousTasks.length > 0 ? `
Atividades recentes realizadas:
${userProfile.previousTasks.map(task => `- ${task.titulo} (${task.concluida ? 'Concluída' : 'Pendente'})`).join('\n')}
` : ''}

Por favor, analise este perfil e sugira atividades específicas e práticas que ajudem este usuário hoje. 

Considere:
1. O estado emocional atual e suas necessidades específicas
2. Como as atividades podem se alinhar com os objetivos pessoais
3. A progressão gradual na jornada de recuperação
4. A importância de manter a mente ocupada e focada

Forneça sugestões variadas, práticas e motivadoras.`;
  }

  /**
   * Retorna descrição detalhada do humor
   */
  private getMoodDescription(mood: string): string {
    switch (mood.toLowerCase()) {
      case 'medo':
        return 'O usuário está se sentindo vulnerável e com receio de não conseguir resistir ao vício hoje. Precisa de atividades que ocupem a mente e fortaleçam a determinação.';
      case 'estavel':
        return 'O usuário está em um estado emocional equilibrado, nem muito vulnerável nem muito eufórico. É um bom momento para atividades de manutenção e crescimento gradual.';
      case 'feliz':
        return 'O usuário está se sentindo positivo e confiante hoje. É uma oportunidade para aproveitar essa energia para atividades mais desafiadoras e construtivas.';
      default:
        return 'Estado emocional não identificado claramente.';
    }
  }

  /**
   * Retorna sugestões padrão em caso de erro
   */
  private getFallbackSuggestions(mood: string): AISuggestionResponse {
    const baseSuggestions: ActivitySuggestion[] = [
      {
        titulo: "Exercício de respiração profunda",
        descricao: "Pratique 10 minutos de respiração consciente para acalmar a mente",
        categoria: "meditacao",
        prioridade: 4 as 1 | 2 | 3 | 4 | 5,
        duracaoEstimada: "10 minutos"
      },
      {
        titulo: "Caminhada ao ar livre",
        descricao: "Faça uma caminhada de 20-30 minutos para oxigenar o corpo e clarear a mente",
        categoria: "exercicio",
        prioridade: 3 as 1 | 2 | 3 | 4 | 5,
        duracaoEstimada: "30 minutos"
      },
      {
        titulo: "Leitura de desenvolvimento pessoal",
        descricao: "Leia um capítulo de um livro motivacional ou de autoajuda",
        categoria: "hobby",
        prioridade: 2 as 1 | 2 | 3 | 4 | 5,
        duracaoEstimada: "20 minutos"
      }
    ];

    // Ajustar prioridades baseado no humor
    if (mood === 'medo') {
      baseSuggestions.forEach(suggestion => {
        suggestion.prioridade = Math.min(5, suggestion.prioridade + 1) as 1 | 2 | 3 | 4 | 5;
      });
    }

    return {
      activities: baseSuggestions,
      message: "Estas são algumas atividades que podem te ajudar hoje. Lembre-se: cada passo conta na sua jornada!",
      reasoning: "Sugestões padrão fornecidas devido a erro no processamento da IA, mas ainda assim relevantes para sua recuperação."
    };
  }

  /**
   * Converte sugestões da IA para formato de tarefas do banco
   */
  convertToTasks(suggestions: ActivitySuggestion[], userId: string, suggestionId?: string): InsertDailyTask[] {
    return suggestions.map(suggestion => ({
      userId,
      suggestionId,
      titulo: suggestion.titulo,
      descricao: suggestion.descricao,
      categoria: suggestion.categoria,
      prioridade: suggestion.prioridade,
      concluida: false,
      date: new Date()
    }));
  }
}

export const aiProcessor = new AIProcessor();