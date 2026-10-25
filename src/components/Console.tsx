/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Terminal,
  AlertCircle,
  Copy,
  CheckCircle2,
  Search,
  Download,
  Trash2,
  ArrowDownCircle,
  PauseCircle,
  Play,
  Sparkles,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface LogEntry {
  id?: number | string;
  message: string;
  type: 'info' | 'error' | 'success' | 'command';
  timestamp: Date;
}

interface ConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
  isConnected?: boolean;
  onRunCommand?: (cmd: string) => Promise<void> | void;
}

const QUICK_ADB_COMMANDS = [
  { label: '📦 DS App Cài Thêm', cmd: 'pm list packages -3' },
  { label: '🔋 DS Bất Tử Pin', cmd: 'dumpsys deviceidle whitelist' },
  { label: '📡 Trạng Thái FCM', cmd: 'dumpsys activity services com.google.android.gms/.gcm.GcmService | grep -E "Connected|Heartbeat"' },
  { label: '🔔 Test Bắn Thông Báo', cmd: 'cmd notification post -S bigtext -t "MagicTune ADB Pro" "adb_test" "Kiểm tra hệ thống thông báo nổi hoạt động 100%!"' },
  { label: '📱 Độ Phân Giải & DPI', cmd: 'wm size && wm density' },
  { label: '⚡ Pin & Nhiệt Độ', cmd: 'dumpsys battery' },
  { label: '🛡️ Cờ Màn Hình Khóa', cmd: 'settings get system lock_screen_notification_style && settings get global heads_up_notifications_enabled' }
];

export const Console: React.FC<ConsoleProps> = React.memo(({
  logs,
  onClear,
  isConnected = false,
  onRunCommand
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'command' | 'success' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inputCmd, setInputCmd] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);

  const counts = useMemo(() => {
    return {
      all: logs.length,
      command: logs.filter(l => l.type === 'command').length,
      success: logs.filter(l => l.type === 'success').length,
      error: logs.filter(l => l.type === 'error').length
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (activeTab !== 'all' && l.type !== activeTab) return false;
      if (searchTerm.trim()) {
        return l.message.toLowerCase().includes(searchTerm.toLowerCase().trim());
      }
      return true;
    });
  }, [logs, activeTab, searchTerm]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const copyLogs = () => {
    const text = filteredLogs
      .map(l => `[${l.timestamp.toLocaleTimeString([], { hour12: false })}] [${l.type.toUpperCase()}] ${l.message}`)
      .join('\n');

    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportLogsTxt = () => {
    const text = filteredLogs
      .map(l => `[${l.timestamp.toLocaleTimeString([], { hour12: false })}] [${l.type.toUpperCase()}] ${l.message}`)
      .join('\n');
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magictune-adb-log-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerCommand = async (raw: string) => {
    const cmd = raw.trim();
    if (!cmd || !onRunCommand || !isConnected || isExecuting) return;
    setCmdHistory(prev => [cmd, ...prev.filter(c => c !== cmd)].slice(0, 30));
    setHistoryIdx(-1);
    setInputCmd('');
    setIsExecuting(true);
    try {
      await onRunCommand(cmd);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-[#030712] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl min-h-[240px]">
      {/* Top Filter Tabs & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/95 border-b border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Terminal size={12} />
            <span>Tất cả</span>
            <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-300">{counts.all}</span>
          </button>

          <button
            onClick={() => setActiveTab('command')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
              activeTab === 'command'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>Lệnh</span>
            {counts.command > 0 && (
              <span className="text-[9px] px-1 rounded bg-indigo-950 text-indigo-300">{counts.command}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('success')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
              activeTab === 'success'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>OK</span>
            {counts.success > 0 && (
              <span className="text-[9px] px-1 rounded bg-emerald-950 text-emerald-300">{counts.success}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('error')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
              activeTab === 'error'
                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <AlertCircle size={11} />
            <span>Lỗi</span>
            {counts.error > 0 && (
              <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full animate-pulse">
                {counts.error}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoScroll(prev => !prev)}
            className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-colors ${
              autoScroll
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
            title={autoScroll ? 'Đang tự động cuộn theo lệnh mới' : 'Đã tạm dừng tự cuộn để đọc log'}
          >
            {autoScroll ? <ArrowDownCircle size={12} /> : <PauseCircle size={12} />}
          </button>

          <button
            onClick={copyLogs}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 border border-slate-700/60 transition-colors"
            title="Sao chép nhật ký hiện tại"
          >
            {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>

          <button
            onClick={exportLogsTxt}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 border border-slate-700/60 transition-colors"
            title="Tải xuống file log (.txt)"
          >
            <Download size={12} />
          </button>

          <button
            onClick={onClear}
            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center gap-1 border border-red-500/20 transition-colors"
            title="Xóa sạch màn hình lệnh"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Search & Filter Input inside Console */}
      <div className="px-3 py-1.5 bg-slate-950/90 border-b border-slate-800/70 flex items-center gap-2">
        <Search size={12} className="text-slate-500 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Lọc nhanh nội dung log / tên gói lệnh..."
          className="w-full bg-transparent text-[11px] font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-white">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Main Terminal Log Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-hide select-text"
      >
        <AnimatePresence initial={false}>
          {filteredLogs.length === 0 ? (
            <div className="text-slate-600 italic py-6 text-center text-xs">
              {logs.length === 0
                ? 'Đang chờ kết nối thiết bị để hiển thị luồng lệnh ADB thời gian thực...'
                : 'Không có dòng nhật ký nào khớp với bộ lọc hiện tại.'}
            </div>
          ) : (
            filteredLogs.map((log, i) => (
              <div
                key={log.id ?? `${log.timestamp.getTime()}-${i}`}
                className={`px-2 py-1 rounded-lg border flex items-start gap-2.5 ${
                  log.type === 'error'
                    ? 'bg-red-950/25 border-red-500/25 text-red-300'
                    : log.type === 'success'
                      ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                      : log.type === 'command'
                        ? 'bg-blue-950/25 border-blue-500/25 text-blue-300 font-bold'
                        : 'bg-slate-900/30 border-slate-800/40 text-slate-300'
                }`}
              >
                <span className="text-slate-500 shrink-0 select-none text-[9px] mt-0.5 font-normal">
                  {log.timestamp.toLocaleTimeString([], {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
                <span className="break-all whitespace-pre-wrap flex-1">{log.message}</span>
              </div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Quick Command Macros + Shell Input (when onRunCommand is provided) */}
      {onRunCommand && (
        <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 space-y-2">
          {/* Quick Command Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1 shrink-0">
              <Sparkles size={10} />
              Lệnh nhanh:
            </span>
            {QUICK_ADB_COMMANDS.map((item, idx) => (
              <button
                key={idx}
                disabled={!isConnected || isExecuting}
                onClick={() => triggerCommand(item.cmd)}
                className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-blue-950/60 text-slate-300 hover:text-blue-300 border border-slate-800 hover:border-blue-500/40 text-[10px] font-mono whitespace-nowrap transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                title={`Chạy nhanh: adb shell ${item.cmd}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Interactive Shell Input with Up/Down History */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-mono text-xs font-bold select-none">
                $
              </div>
              <input
                type="text"
                value={inputCmd}
                onChange={e => setInputCmd(e.target.value)}
                disabled={!isConnected || isExecuting}
                placeholder={
                  isConnected
                    ? 'Nhập lệnh ADB shell (Nhấn ↑/↓ xem lệnh cũ, Enter để chạy)...'
                    : 'Kết nối điện thoại để chạy lệnh ADB shell...'
                }
                onKeyDown={async e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    await triggerCommand(inputCmd);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (cmdHistory.length > 0) {
                      const nextIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
                      setHistoryIdx(nextIdx);
                      setInputCmd(cmdHistory[nextIdx]);
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (historyIdx > 0) {
                      const nextIdx = historyIdx - 1;
                      setHistoryIdx(nextIdx);
                      setInputCmd(cmdHistory[nextIdx]);
                    } else {
                      setHistoryIdx(-1);
                      setInputCmd('');
                    }
                  }
                }}
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs font-mono transition-all placeholder:text-slate-600 ${
                  isConnected
                    ? 'text-blue-300 focus:border-blue-500/60 focus:outline-none'
                    : 'text-slate-600 cursor-not-allowed opacity-60'
                }`}
              />
            </div>
            <button
              onClick={() => triggerCommand(inputCmd)}
              disabled={!isConnected || !inputCmd.trim() || isExecuting}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-600 text-xs font-bold flex items-center gap-1 transition-all shrink-0"
              title="Thực thi lệnh Shell (Enter)"
            >
              <Play size={13} />
              <span>Chạy</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
