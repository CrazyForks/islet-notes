// @islet-import-scope same-dir

export type PageHeaderIcon = 'ellipsis' | 'plus' | 'refresh';

export interface PageHeaderActionBase {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  hide?: boolean;
  testId?: string;
}

export interface PageHeaderIconItem extends PageHeaderActionBase {
  type: 'icon';
  icon: PageHeaderIcon;
}

type PageHeaderSlotItems<T> = T | T[];

export type PageHeaderRightItem =
  | (PageHeaderActionBase & {
      type: 'button';
    })
  | PageHeaderIconItem
  | {
      type: 'steps';
      total: number;
      current: number;
      hide?: boolean;
    };

export type PageHeaderRight = PageHeaderSlotItems<PageHeaderRightItem>;

export interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  left?: PageHeaderIconItem;
  right?: PageHeaderRight;
  /** 'surface' renders a white navbar for full-white pages (e.g. WeChat Pay-style detail pages). */
  tone?: 'nav' | 'surface';
}
