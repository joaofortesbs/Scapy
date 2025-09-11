
export interface AvatarEvolution {
  id: number;
  title: string;
  days: number;
  image: string;
  seed: string;
  size: string;
}

export const avatarEvolutions: AvatarEvolution[] = [
  { id: 1, title: "Homem das Cavernas", days: 0, image: "/caveman-avatar.png", seed: "caveman", size: "w-80 h-80" },
  { id: 2, title: "Guerreiro da Tribo", days: 3, image: "/avatar-guerreiro-tribo-novo.webp", seed: "warrior", size: "w-80 h-80" },
  { id: 3, title: "Guardião da Espada", days: 7, image: "/avatar-guardião-espada.webp", seed: "guardian", size: "w-80 h-80" },
  { id: 4, title: "Samurai da Disciplina", days: 15, image: "/avatar-samurai-disciplina.webp", seed: "samurai", size: "w-80 h-80" },
  { id: 5, title: "Viking da Coragem", days: 30, image: "/avatar-viking-coragem.webp", seed: "viking", size: "w-80 h-80" },
  { id: 6, title: "Cavaleiro da Resistência", days: 50, image: "/avatar-cavaleiro-resistencia.webp", seed: "knight", size: "w-80 h-80" },
  { id: 7, title: "Soldado da Vitória", days: 75, image: "/avatar-soldado-vitoria.webp", seed: "soldier", size: "w-80 h-80" },
  { id: 8, title: "Guerreiro do Futuro", days: 100, image: "/avatar-guerreiro-futuro.webp", seed: "future", size: "w-80 h-80" },
  { id: 9, title: "Rei dos Relâmpagos", days: 130, image: "/avatar-soldado-relampago.webp", seed: "lightning", size: "w-80 h-80" },
  { id: 10, title: "Super Arcanjo", days: 165, image: "/avatar-super-arcanjo.webp", seed: "archangel", size: "w-80 h-80" },
  { id: 11, title: "Prateado da Coragem", days: 200, image: "/avatar-prateado-coragem.webp", seed: "silver", size: "w-80 h-80" },
  { id: 12, title: "Titã Cósmico", days: 300, image: "/avatar-titan-cosmico.webp", seed: "titan", size: "w-80 h-80" }
];

export function getCurrentAvatar(progressInDays: number): AvatarEvolution {
  // Ordenar avatares pelos dias de forma decrescente para encontrar o correto
  const sortedAvatars = [...avatarEvolutions].sort((a, b) => b.days - a.days);
  
  // Encontrar o primeiro avatar que o usuário já alcançou
  for (const avatar of sortedAvatars) {
    if (progressInDays >= avatar.days) {
      console.log(`🎯 [AvatarSystem] Usuário com ${progressInDays} dias alcançou: ${avatar.title} (${avatar.days} dias necessários)`);
      return avatar;
    }
  }
  
  // Fallback para o primeiro avatar (Homem das Cavernas)
  console.log(`🎯 [AvatarSystem] Usuário com ${progressInDays} dias ainda no primeiro avatar`);
  return avatarEvolutions[0];
}

export function getNextAvatar(progressInDays: number): AvatarEvolution | null {
  // Encontrar o próximo avatar que o usuário pode alcançar
  const nextAvatar = avatarEvolutions.find(avatar => avatar.days > progressInDays);
  
  if (nextAvatar) {
    console.log(`🎯 [AvatarSystem] Próximo avatar: ${nextAvatar.title} (faltam ${nextAvatar.days - progressInDays} dias)`);
  } else {
    console.log(`🎯 [AvatarSystem] Usuário já alcançou o avatar máximo!`);
  }
  
  return nextAvatar || null;
}

export function calculateProgressInDays(startDate: string, currentDate?: Date): number {
  if (!startDate) {
    console.log('🎯 [AvatarSystem] Nenhuma data de início fornecida');
    return 0;
  }
  
  const start = new Date(startDate);
  const now = currentDate || new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  console.log(`🎯 [AvatarSystem] Calculando progresso: início=${startDate}, agora=${now.toISOString()}, dias=${diffDays}`);
  
  return diffDays;
}
