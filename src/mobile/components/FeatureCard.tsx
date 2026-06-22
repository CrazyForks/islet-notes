import { styles } from '@/mobile/styles/ui';
import { ChevronRight } from 'lucide-react';
import React, { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  testId?: string;
  onClick: () => void;
}

export function FeatureCard({ icon, title, description, testId, onClick }: FeatureCardProps) {
  return (
    <button
      className={styles.FeatureCard.Root}
      type='button'
      data-test-id={testId}
      onClick={onClick}
    >
      <span className={styles.FeatureCard.Icon}>{icon}</span>
      <span className={styles.FeatureCard.Body}>
        <span className={styles.FeatureCard.Title}>{title}</span>
        <span className={styles.FeatureCard.Description}>{description}</span>
      </span>
      <ChevronRight size={20} strokeWidth={1.75} className={styles.FeatureCard.Chevron} />
    </button>
  );
}
