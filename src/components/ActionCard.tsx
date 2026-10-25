/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LucideIcon, RotateCcw, Smartphone, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'mini';
  badge?: string;
  commandTag?: string;
  onRevert?: () => void;
  revertLabel?: string;
  manualRevertGuide?: string;
  onOpenPhoneSettings?: () => void;
  openPhoneSettingsLabel?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  isLoading, 
  disabled,
  variant = 'primary',
  badge,
  commandTag,
  onRevert,
  revertLabel = 'Hoàn tác mặc định',
  manualRevertGuide,
  onOpenPhoneSettings,
  openPhoneSettingsLabel = 'Mở cài đặt trên ĐT'
}) => {
  const [showManualGuide, setShowManualGuide] = useState(false);

  const variants = {
    primary: 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 p-3 sm:p-4',
    secondary: 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 p-3 sm:p-4',
    danger: 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 p-3 sm:p-4',
    mini: 'border-slate-800 bg-slate-900/30 hover:bg-slate-800 text-slate-400 p-2 text-xs opacity-80 hover:opacity-100'
  };

  const isMini = variant === 'mini';
  const hasFooterActions = !isMini && (onRevert || manualRevertGuide || onOpenPhoneSettings);

  return (
    <motion.div
      whileHover={!disabled ? { scale: isMini ? 1 : 1.005, translateY: isMini ? 0 : -1 } : {}}
      className={`w-full flex flex-col justify-between text-left border rounded-xl transition-all duration-200 group relative ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''
      }`}
    >
      <div
        onClick={() => {
          if (!disabled && !isLoading) onClick();
        }}
        className={`w-full flex items-start gap-2.5 sm:gap-3 ${disabled || isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className={`${isMini ? 'p-1.5' : 'p-2 sm:p-2.5'} rounded-lg bg-slate-950 border border-current transition-colors shrink-0 mt-0.5`}>
          <Icon size={isMini ? 13 : 18} className={isLoading ? 'animate-spin' : ''} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className={`${isMini ? 'text-[11px] font-bold text-slate-300' : 'font-semibold text-xs sm:text-sm text-slate-100'} group-hover:text-white transition-colors leading-snug break-words whitespace-normal`}>
              {title}
            </h3>
            {badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 break-words whitespace-normal">
                {badge}
              </span>
            )}
          </div>
          {!isMini && (
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed break-words whitespace-normal">
              {description}
            </p>
          )}
          {commandTag && !isMini && (
            <div className="mt-2 text-[10px] font-mono text-slate-500 bg-black/40 px-2 py-0.5 rounded border border-slate-800 inline-block break-all">
              {commandTag}
            </div>
          )}
        </div>
      </div>

      {hasFooterActions && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {onRevert && (
              <button
                type="button"
                disabled={disabled || isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  onRevert();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/40 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                title="Hoàn tác tính năng này về mặc định ban đầu của máy"
              >
                <RotateCcw size={11} className="text-rose-400 shrink-0" />
                <span>{revertLabel}</span>
              </button>
            )}

            {onOpenPhoneSettings && (
              <button
                type="button"
                disabled={disabled || isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPhoneSettings();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 border border-slate-700/80 hover:border-blue-500/40 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                title="Mở trực tiếp màn hình cài đặt này trên điện thoại để thao tác thủ công"
              >
                <Smartphone size={11} className="text-blue-400 shrink-0" />
                <span>{openPhoneSettingsLabel}</span>
              </button>
            )}

            {manualRevertGuide && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowManualGuide(prev => !prev);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 ml-auto"
              >
                <HelpCircle size={11} className="text-amber-400 shrink-0" />
                <span>Cách hoàn tác tay trên ĐT</span>
                {showManualGuide ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
          </div>

          {manualRevertGuide && showManualGuide && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="p-2.5 rounded-lg bg-slate-950/95 border border-amber-500/30 text-[11px] text-slate-300 leading-relaxed space-y-1"
            >
              <div className="font-bold text-amber-300 flex items-center gap-1 text-[10px] uppercase">
                <Smartphone size={11} className="text-amber-400 shrink-0" />
                <span>Hướng dẫn hoàn tác thủ công trên điện thoại:</span>
              </div>
              <p className="text-[11px] text-slate-300 whitespace-pre-line">{manualRevertGuide}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

