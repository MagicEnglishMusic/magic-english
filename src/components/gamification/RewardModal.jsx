import React from 'react';
import CompletionCelebration from '../common/CompletionCelebration';

export default function RewardModal({
  isOpen = false,
  show = false,
  onClose,
  type = 'xp',
  title = "Parabéns!",
  subtitle = "Você conquistou uma nova etapa no Magic English.",
  xp = 50,
  icon = "⭐",
  bonusText = "+50 Magic XP adicionados à sua jornada!",
  badge = null
}) {
  return (
    <CompletionCelebration
      isOpen={isOpen || show}
      show={isOpen || show}
      onClose={onClose}
      type={type}
      title={title}
      subtitle={subtitle}
      description={subtitle}
      xp={xp}
      icon={icon}
      bonusText={bonusText}
      badge={badge}
    />
  );
}

