import React from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}
