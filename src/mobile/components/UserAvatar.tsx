import { useProfileAvatar } from '@/mobile/hooks/useProfileAvatar';
import { cx, styles } from '@/mobile/styles/ui';
import { UserRound } from 'lucide-react';
import React from 'react';

interface UserAvatarProps {
  size: number;
  className?: string;
  testId?: string;
  imageTestId?: string;
}

export function UserAvatar({ size, className, testId, imageTestId }: UserAvatarProps) {
  const { url, handleImageError } = useProfileAvatar();
  const style = { width: size, height: size };
  const rootClassName = cx(styles.UserAvatar.Root, className);

  if (url) {
    return (
      <img
        className={cx(rootClassName, styles.UserAvatar.ImageFit)}
        data-test-id={imageTestId}
        src={url}
        alt=''
        style={style}
        onError={handleImageError}
      />
    );
  }

  return (
    <span className={rootClassName} data-test-id={testId} style={style}>
      <UserRound size={Math.round(size * 0.58)} strokeWidth={1.8} />
    </span>
  );
}
