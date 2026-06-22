import {
  getThemePreference,
  saveThemePreference,
  ThemePreference,
} from '@/base/browser/initializeTheme';
import { localize } from '@/nls';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { ThemeSettings } from '@/mobile/test.id';
import React, { useState } from 'react';

const options: Array<{ label: string; value: ThemePreference }> = [
  { label: localize('settings.followSystem', 'Follow system'), value: 'auto' },
  { label: localize('theme.light', 'Light'), value: 'light' },
  { label: localize('theme.dark', 'Dark'), value: 'dark' },
];

export function SettingsThemePage() {
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference());
  return (
    <HeaderPage
      pageTestId={ThemeSettings.page}
      contentTestId={ThemeSettings.content}
      header={{
        title: localize('settings.theme', 'Theme'),
        showBack: true,
        right: {
          type: 'button',
          label: localize('common.save', 'Save'),
          onClick: () => saveThemePreference(theme),
        },
      }}
    >
      <CellListGroup
        items={options.map((option) => ({
          type: 'option' as const,
          key: option.value,
          label: option.label,
          selected: theme === option.value,
          testId:
            option.value === 'auto'
              ? ThemeSettings.auto
              : option.value === 'dark'
                ? ThemeSettings.dark
                : ThemeSettings.option,
          onClick: () => setTheme(option.value),
        }))}
      />
    </HeaderPage>
  );
}
