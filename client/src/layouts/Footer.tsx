import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Layers, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import type { NavItem } from '../components/navigation/types';

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  navItems?: NavItem[];
}

export const Footer: React.FC<FooterProps> = ({ navItems = [], className, ...props }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn('bg-white border-t border-neutral-200 text-neutral-600 text-xs', className)}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded bg-primary-600 text-white font-bold text-sm select-none">
                S
              </div>
              <span className="font-bold text-sm text-neutral-900 tracking-tight">SevaSetu</span>
            </div>
            <p className="text-neutral-600 leading-relaxed max-w-xs">
              A robust, human-centered service platform connecting communities to trusted local services.
            </p>
            <div className="flex items-center gap-1.5 text-neutral-600 font-medium">
              <Shield size={13} className="text-primary-600" />
              <span>Built on Production Architecture</span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div className="space-y-3">
            <div className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
              Navigation
            </div>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="hover:text-primary-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Architecture & Tech Stack */}
          <div className="space-y-3">
            <div className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
              Technology Stack
            </div>
            <ul className="space-y-2 text-neutral-600">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>PostgreSQL 16 &amp; Prisma ORM</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Express &amp; TypeScript API</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>React 19 &amp; Tailwind CSS</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>WCAG AA Accessible Primitives</span>
              </li>
            </ul>
          </div>

          {/* Structural Governance Framework */}
          <div className="space-y-3">
            <div className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
              System Guidelines
            </div>
            <ul className="space-y-2 text-neutral-600">
              <li className="flex items-center gap-1.5">
                <Layers size={13} className="text-neutral-400" />
                <span>Centralized Design Tokens</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Activity size={13} className="text-neutral-400" />
                <span>Verified End-to-End Connectivity</span>
              </li>
              <li>
                <span>Strict Phased Development Model</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-neutral-600 text-[11px]">
          <p>© {currentYear} SevaSetu Platform. All rights reserved.</p>
          <p className="font-mono text-neutral-600">UI/UX Part 2: Application Shell &amp; Navigation</p>
        </div>
      </div>
    </footer>
  );
};
