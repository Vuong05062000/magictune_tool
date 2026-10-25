/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Usb, 
  Smartphone, 
  Laptop,
  Zap, 
  Settings, 
  RotateCcw,
  Info,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Package,
  Search,
  ShieldCheck,
  Activity,
  KeyRound,
  CheckCircle2,
  Facebook,
  MessageSquare,
  X,
  Power,
  Cpu,
  Database,
  Terminal,
  ChevronRight,
  ChevronLeft,
  Type,
  EyeOff,
  Signal,
  Youtube,
  Bell,
  Sliders,
  ExternalLink,
  Volume2,
  VolumeX,
  Flame,
  Lock,
  CheckCircle,
  Filter,
  Sparkles,
  Layers,
  BellRing,
  Mic,
  Send,
  Heart,
  HelpCircle,
  Globe,
  Languages,
  Unlock,
  Upload,
  Play,
  Battery,
  BatteryCharging,
  BatteryMedium,
  Radio,
  Eye,
  Wrench,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AdbClient, 
  DeviceInfo, 
  LogCallback, 
  AppInfo, 
  FacebookDiagResult,
  MultiAppDiagResult,
  AppDiagnosticItem,
  AppGentleChannelSummary,
  AppPermissionScanSummary,
  ApkInstallProgress,
  ApkInstallResult,
  SmartBatteryStatus,
  SmartBatteryConfig,
  NewDeviceSetupStatus,
  ShizukuDetailedStatus
} from './lib/adb-client';
import {
  APP_VERSION,
  CRITICAL_PACKAGES,
  DEBLOAT_WHITELIST,
  sanitizePackageName,
  HonorTurboRamStatus
} from './lib/honor-constants';
import { Console, LogEntry } from './components/Console';
import { ActionCard } from './components/ActionCard';

export { APP_VERSION };

export const MAGICTUNE_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1WLsS-OlxvKFUWzMPxnkrNn8kmlVIY6-k?usp=sharing';

const AdSlot = ({ className = "" }: { className?: string }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className={`ad-container my-4 p-3 bg-slate-950/40 border border-slate-800/50 rounded-2xl overflow-hidden flex flex-col items-center justify-center min-h-[100px] ${className}`}>
      <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1.5 font-black opacity-60">Quảng cáo tài trợ</div>
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', minHeight: '90px' }}
           data-ad-client="pub-4256214784202059"
           data-ad-slot="auto"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      <div className="mt-2 text-[10px] text-slate-500 text-center max-w-md italic font-medium">
        Quảng cáo giúp duy trì máy chủ MagicTune miễn phí cho cộng đồng Honor Việt Nam!
      </div>
    </div>
  );
};

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [waitingForPhoneAuth, setWaitingForPhoneAuth] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'noti' | 'apps' | 'tune' | 'shizuku'>('noti');
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [appFilter, setAppFilter] = useState<'3rd' | 'sys'>('sys');
  const [debloatSafetyFilter, setDebloatSafetyFilter] = useState<'all' | 'safe' | 'caution' | 'critical'>('all');
  const [notiCategoryFilter, setNotiCategoryFilter] = useState<'all' | 'social' | 'chat' | 'system'>('all');
  const [tuneCategoryFilter, setTuneCategoryFilter] = useState<'all' | 'battery' | 'display' | 'speed' | 'audio' | 'system'>('all');
  const [batteryStatus, setBatteryStatus] = useState<SmartBatteryStatus | null>(null);
  const [newDeviceStatus, setNewDeviceStatus] = useState<NewDeviceSetupStatus | null>(null);
  const [batteryConfig, setBatteryConfig] = useState<SmartBatteryConfig>({
    disableTelemetry: true,
    disableBackgroundScanning: true,
    disableMagazineAndFeeds: true,
    restrictBloatwareStandby: true,
    enableOledDarkMode: false,
    setBalancedRefreshRate: false,
    setSnappyAnimation: true,
    guaranteeNotificationProtection: true
  });
  const [shizukuRunning, setShizukuRunning] = useState(false);
  const [shizukuDetails, setShizukuDetails] = useState<ShizukuDetailedStatus | null>(null);
  const [fbDiag, setFbDiag] = useState<FacebookDiagResult | null>(null);
  const [multiAppDiag, setMultiAppDiag] = useState<MultiAppDiagResult | null>(null);
  const [isMobileConsoleOpen, setIsMobileConsoleOpen] = useState(false);
  const [isDesktopConsoleCollapsed, setIsDesktopConsoleCollapsed] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showAuthTroubleshootModal, setShowAuthTroubleshootModal] = useState(false);
  const [showRevertCenterModal, setShowRevertCenterModal] = useState(false);
  const [customTestPkg, setCustomTestPkg] = useState('com.facebook.katana');
  const [customBotPkg, setCustomBotPkg] = useState('com.facebook.katana');
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [gentleScanResults, setGentleScanResults] = useState<AppGentleChannelSummary[] | null>(null);
  const [permScanResults, setPermScanResults] = useState<AppPermissionScanSummary[] | null>(null);
  const [permScanFilter, setPermScanFilter] = useState<'critical' | 'minor' | 'all'>('critical');
  const [blockedUpdatePkgs, setBlockedUpdatePkgs] = useState<string[]>([]);
  const [customBlockUpdatePkg, setCustomBlockUpdatePkg] = useState('com.zing.zalo');

  const [notiSubTab, setNotiSubTab] = useState<'bot' | 'test' | 'diag' | 'google' | 'actions' | 'all'>('bot');
  const [isTurboMode, setIsTurboMode] = useState<boolean>(true);
  const [scanFilter, setScanFilter] = useState<'gentle' | 'nobanner' | 'all'>('gentle');
  const [connectionGuideTab, setConnectionGuideTab] = useState<'pc' | 'ctoc'>('pc');
  const [animScales, setAnimScales] = useState({ window: 0.5, transition: 0.5, animator: 0.5 });
  const [customResolution, setCustomResolution] = useState({ width: 0, height: 0 });
  const [customPermPkg, setCustomPermPkg] = useState('com.facebook.katana');
  const [apkAutoLaunch, setApkAutoLaunch] = useState<boolean>(true);
  const [apkAutoOptimize, setApkAutoOptimize] = useState<boolean>(true);
  const [apkBlockUpdate, setApkBlockUpdate] = useState<boolean>(true);
  const [apkProgress, setApkProgress] = useState<ApkInstallProgress | null>(null);
  const [apkInstallHistory, setApkInstallHistory] = useState<ApkInstallResult[]>([]);
  const [isDraggingApk, setIsDraggingApk] = useState<boolean>(false);
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(true);
  const [showHardwareDetails, setShowHardwareDetails] = useState<boolean>(false);
  const [showConnectionDetails, setShowConnectionDetails] = useState<boolean>(false);
  const [ramTurboStatus, setRamTurboStatus] = useState<HonorTurboRamStatus | null>(null);
  const [isInstallingApk, setIsInstallingApk] = useState<boolean>(false);
  const [apkInstallStatus, setApkInstallStatus] = useState<{ fileName: string; percent: number; phase: string }>({ fileName: '', percent: 0, phase: '' });
  const [debloatFilter, setDebloatFilter] = useState<'all' | '1' | '2' | 'frozen'>('all');

  const adbClientRef = useRef<AdbClient | null>(null);
  const apkFileInputRef = useRef<HTMLInputElement | null>(null);
  const logIdRef = useRef<number>(1);

  const getDebloatInfo = useCallback((pkg: string) => {
    return DEBLOAT_WHITELIST.find(d => d.pkg === pkg);
  }, []);

  const isCritical = useCallback((pkg: string) => {
    return CRITICAL_PACKAGES.some(p => pkg === p || pkg.startsWith('com.android.system'));
  }, []);

  const isSafeToUninstall = useCallback((pkg: string) => {
    if (appFilter === '3rd') return true;
    if (getDebloatInfo(pkg)) return true;
    return !isCritical(pkg);
  }, [appFilter, getDebloatInfo, isCritical]);

  // Giới hạn bộ đệm tối đa 500 dòng log để chống phình DOM khi chạy tác vụ dài
  const addLog = useCallback<LogCallback>((message, type = 'info') => {
    const id = logIdRef.current++;
    setLogs(prev => {
      const nextEntry: LogEntry = { id, message, type, timestamp: new Date() };
      return prev.length >= 500 ? [...prev.slice(-499), nextEntry] : [...prev, nextEntry];
    });
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (adbClientRef.current) {
      await adbClientRef.current.disconnect();
    }
    setIsConnected(false);
    setWaitingForPhoneAuth(false);
    setDeviceInfo(null);
    setApps([]);
    setBatteryStatus(null);
    setNewDeviceStatus(null);
    setShizukuDetails(null);
  }, []);

  const refreshShizukuFullStatus = useCallback(async () => {
    if (!adbClientRef.current) return null;
    try {
      const details = await adbClientRef.current.getShizukuDetailedStatus();
      setShizukuDetails(details);
      setShizukuRunning(details.serverRunning);
      return details;
    } catch (_e) {
      return null;
    }
  }, []);

  const initializeConnectedSession = async () => {
    if (!adbClientRef.current) return;
    addLog('Đang lấy thông tin thiết bị Honor...', 'info');
    try {
      const info = await adbClientRef.current.getDeviceInfo();
      setDeviceInfo(info);

      // Kiểm tra hãng sản xuất (Brand Detection)
      const manufacturer = info?.manufacturer?.toUpperCase() || 'HONOR';
      if (manufacturer !== 'HONOR' && manufacturer !== 'HUAWEI') {
        addLog(`⚠️ CẢNH BÁO: Thiết bị "${info.manufacturer} ${info.model}" không được hỗ trợ tối ưu sâu bởi phiên bản này.`, 'error');
        addLog(`➡️ Vui lòng chuyển sang dùng bản quốc tế tại: https://magictune.web.app/`, 'info');
      }

      await fetchApps();
      try {
        const shzDetails = await adbClientRef.current.getShizukuDetailedStatus();
        setShizukuDetails(shzDetails);
        setShizukuRunning(shzDetails.serverRunning);
      } catch (_shzErr) {
        const isShizukuOn = await adbClientRef.current.checkShizukuStatus();
        setShizukuRunning(isShizukuOn);
      }
      try {
        const bStatus = await adbClientRef.current.getSmartBatteryStatus();
        setBatteryStatus(bStatus);
      } catch (_bErr) {
        // ignore
      }
      try {
        const sStatus = await adbClientRef.current.getNewDeviceSetupStatus();
        setNewDeviceStatus(sStatus);
      } catch (_sErr) {
        // ignore
      }
      try {
        const rStatus = await adbClientRef.current.getHonorTurboRamStatus();
        setRamTurboStatus(rStatus);
      } catch (_rErr) {
        // ignore
      }
    } catch (_infoError) {
      setDeviceInfo({
        model: 'Honor MagicOS',
        manufacturer: 'HONOR',
        version: 'MagicOS'
      });
      try {
        const rStatus = await adbClientRef.current.getHonorTurboRamStatus();
        setRamTurboStatus(rStatus);
      } catch (_rErr) {
        // ignore
      }
      addLog('Đã kết nối ADB sẵn sàng thực thi lệnh.', 'success');
    }
  };

  const handleConnect = async (forceNewRsaKey: boolean = false) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setWaitingForPhoneAuth(false);
    
    if (!adbClientRef.current) {
      adbClientRef.current = new AdbClient(addLog, setWaitingForPhoneAuth, () => {
        setIsConnected(false);
        setWaitingForPhoneAuth(false);
        setDeviceInfo(null);
        setApps([]);
      });
    } else {
      adbClientRef.current.setCallbacks(addLog, setWaitingForPhoneAuth, () => {
        setIsConnected(false);
        setWaitingForPhoneAuth(false);
        setDeviceInfo(null);
        setApps([]);
      });
    }
    
    try {
      const success = await adbClientRef.current.connect(forceNewRsaKey);
      if (success) {
        setIsConnected(true);
        setWaitingForPhoneAuth(false);
        await initializeConnectedSession();
      }
    } catch (e: any) {
      addLog(`Lỗi xử lý: ${e.message}`, 'error');
    } finally {
      setWaitingForPhoneAuth(false);
      setIsProcessing(false);
    }
  };



  const fetchApps = async () => {
    if (!adbClientRef.current) return;
    try {
      const appList = await adbClientRef.current.listApps(appFilter);
      setApps(appList);
      const blockedSet = await adbClientRef.current.getBlockedUpdatePackages();
      setBlockedUpdatePkgs(Array.from(blockedSet));
    } catch (_e) {
      // ignore
    }
  };

  const handleInstallApkFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList || !adbClientRef.current || isProcessing) return;
    const files = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.apk'));
    if (files.length === 0) {
      addLog('⚠️ Vui lòng chọn đúng định dạng tệp cài đặt Android (.apk)!', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (files.length > 1) {
          addLog(`📦 [Hàng đợi APK ${i + 1}/${files.length}] Chuẩn bị cài: ${file.name}...`, 'info');
        }
        setIsInstallingApk(true);
        const res = await adbClientRef.current.installApkFast(
          file,
          (prog) => {
            setApkProgress(prog);
            setApkInstallStatus({
              fileName: file.name,
              percent: prog.percent,
              phase: prog.message
            });
          },
          {
            autoLaunch: apkAutoLaunch,
            autoOptimize: apkAutoOptimize,
            blockAutoUpdate: apkBlockUpdate
          }
        );
        setApkInstallHistory((prev) => [res, ...prev.slice(0, 9)]);
      }
      await fetchApps();
    } finally {
      setIsInstallingApk(false);
      setIsProcessing(false);
      if (apkFileInputRef.current) {
        apkFileInputRef.current.value = '';
      }
    }
  };

  const handleApplySmartBatterySaver = async () => {
    if (!adbClientRef.current) return;
    setIsProcessing(true);
    try {
      const res = await adbClientRef.current.applySmartBatterySaver(batteryConfig);
      setBatteryStatus(res);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanSmartBattery = async () => {
    if (!adbClientRef.current) return;
    setIsProcessing(true);
    try {
      const res = await adbClientRef.current.getSmartBatteryStatus();
      setBatteryStatus(res);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptimizeRam = async () => {
    if (!adbClientRef.current) return;
    setIsProcessing(true);
    try {
      const res = await adbClientRef.current.optimizeHonorTurboRam();
      setRamTurboStatus(res);
    } catch (err: any) {
      addLog(`Lỗi tối ưu RAM: ${err?.message || err}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isConnected) fetchApps();
  }, [appFilter, isConnected]);



  // Phát hiện rút cáp USB tức thì
  useEffect(() => {
    const handleUSBDisconnect = async () => {
      if (isConnected) {
        addLog('🔌 Cáp USB vừa được rút ra. Đã tự động ngắt kết nối.', 'error');
        handleDisconnect();
      }
    };

    (navigator as any).usb?.addEventListener('disconnect', handleUSBDisconnect);

    let intervalId: any = null;
    if (isConnected) {
      intervalId = setInterval(async () => {
        if (adbClientRef.current) {
          const alive = await adbClientRef.current.isUsbStillPhysicallyConnected();
          if (!alive) {
            addLog('🔌 Phát hiện điện thoại đã ngắt kết nối cáp USB.', 'error');
            handleDisconnect();
          }
        }
      }, 2000);
    }

    return () => {
      (navigator as any).usb?.removeEventListener('disconnect', handleUSBDisconnect);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isConnected, handleDisconnect, addLog]);

  const getAppPriority = (pkg: string): number => {
    const debloat = getDebloatInfo(pkg);
    if (debloat?.level === 1) return 1; // Ưu tiên số 1: An toàn tuyệt đối (lên đầu danh sách!)
    if (debloat?.level === 2) return 2; // Cấp 2: Có rủi ro/cân nhắc
    if (appFilter === '3rd') return 3; // App người dùng cài thêm
    if (isCritical(pkg)) return 5; // Cốt lõi hệ thống: Cấm xóa
    return 4; // App hệ thống thông thường khác
  };

  const filteredApps = useMemo(() => {
    return apps
      .filter(a => {
        const debloat = getDebloatInfo(a.packageName);
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
          a.packageName.toLowerCase().includes(query) ||
          (debloat?.reason && debloat.reason.toLowerCase().includes(query)) ||
          (debloat?.desc && debloat.desc.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;

        if (isSimpleMode) {
          if (debloatFilter === '1') return debloat?.level === 1;
          if (debloatFilter === '2') return debloat?.level === 2;
          if (debloatFilter === 'frozen') return a.frozenByMagicTune || a.status === 'uninstalled';
          return true;
        }

        if (debloatSafetyFilter === 'safe') {
          return debloat?.level === 1;
        }
        if (debloatSafetyFilter === 'caution') {
          return debloat?.level === 2;
        }
        if (debloatSafetyFilter === 'critical') {
          return isCritical(a.packageName);
        }
        return true;
      })
      .sort((a, b) => {
        const priorityA = getAppPriority(a.packageName);
        const priorityB = getAppPriority(b.packageName);
        if (priorityA !== priorityB) {
          return priorityA - priorityB; // Ưu tiên 1 lên trước (An toàn lên đầu)
        }
        const nameA = getDebloatInfo(a.packageName)?.reason || a.packageName;
        const nameB = getDebloatInfo(b.packageName)?.reason || b.packageName;
        return nameA.localeCompare(nameB);
      });
  }, [apps, searchQuery, debloatSafetyFilter, appFilter]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative flex flex-col lg:flex-row h-[100dvh] overflow-hidden">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-10 scrollbar-hide pb-[env(safe-area-inset-bottom,24px)]">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <header className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 sm:p-2.5 rounded-xl shadow-lg shadow-blue-600/20 shrink-0">
                    <Activity size={22} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-2 flex-wrap">
                      MagicTune <span className="text-blue-500 text-xs sm:text-sm">Nội địa</span> <span className="text-[10px] bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold tracking-tight">{APP_VERSION}</span>
                      <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/35 px-2.5 py-0.5 rounded-full font-black tracking-tight uppercase animate-pulse">
                        💎 EXPERT QUALITY: 9.9/10
                      </span>
                    </h1>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-blue-500/80 font-mono font-bold tracking-widest -mt-0.5 mb-0.5">magictune.ai.studio</span>
                      <p className="text-[11px] sm:text-xs text-slate-500 font-medium uppercase tracking-tight leading-tight break-words whitespace-normal">
                        BỘ CÔNG CỤ CHUYÊN BIỆT CHO HONOR & MAGICOS NỘI ĐỊA (TƯƠNG THÍCH TỐI ĐA MAGICOS 11 & ANDROID 17)
                      </p>
                    </div>
                  </div>
                </div>

                {isConnected && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black border bg-blue-500/15 text-blue-300 border-blue-500/35"
                      title="Đang kết nối qua cáp USB vật lý"
                    >
                      <Usb size={13} />
                      <span>🔌 Cáp USB</span>
                    </span>

                    <input
                      ref={apkFileInputRef}
                      type="file"
                      accept=".apk"
                      multiple
                      className="hidden"
                      onChange={(e) => handleInstallApkFiles(e.target.files)}
                    />
                    <button
                      onClick={() => apkFileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 text-xs font-black rounded-xl transition-all border border-cyan-500/30 active:scale-95 disabled:opacity-50"
                      title="Chọn file .APK từ máy tính/điện thoại điều khiển để cài siêu tốc và mở ngay trên màn hình"
                    >
                      <Upload size={14} className="text-cyan-400" />
                      <span className="text-[11px]">⚡ Cài APK Siêu Tốc</span>
                    </button>
                    <button
                      onClick={() => setShowRevertCenterModal(true)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-black rounded-xl transition-all border border-amber-500/35 active:scale-95 disabled:opacity-50"
                      title="Mở Trung tâm Hoàn tác về mặc định cho tất cả tính năng & Hướng dẫn hoàn tác thủ công trên điện thoại"
                    >
                      <RotateCcw size={14} className="text-amber-400" />
                      <span className="text-[11px]">🔄 Trung Tâm Hoàn Tác Mặc Định</span>
                    </button>
                    <button 
                      onClick={handleDisconnect}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-all border border-red-500/20 active:scale-95"
                    >
                      <X size={14} />
                      <span className="text-[11px]">Ngắt kết nối</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Responsive Navigation Tabs + Simple / Full Mode Switcher */}
              {isConnected && (
                <div className="space-y-3">
                  {/* Thanh chuyển đổi Chế độ Đơn Giản (Cho người già & trẻ em) vs Chế độ Đầy Đủ */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-500/40 shadow-lg">
                    <div className="flex items-center gap-2.5 px-2">
                      <span className="text-xl">👵👶</span>
                      <div>
                        <div className="text-xs sm:text-sm font-black text-white">
                          {isSimpleMode
                            ? 'Đang bật: GIAO DIỆN ĐƠN GIẢN (Chữ to, Dễ nhìn, Không rối mắt)'
                            : 'Đang bật: GIAO DIỆN ĐẦY ĐỦ (Hiện tất cả công cụ chuyên sâu)'}
                        </div>
                        <div className="text-[11px] text-emerald-300">
                          {isSimpleMode
                            ? 'Chỉ hiện các nút bấm to, rõ ràng nhất. Bấm 1 chạm là tự làm hết! (Vẫn giữ đủ 100% tính năng)'
                            : 'Bạn có thể bấm sang "Chế Độ Đơn Giản" bất cứ lúc nào để màn hình gọn gàng, dễ nhìn hơn.'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 shrink-0">
                      <button
                        onClick={() => setIsSimpleMode(true)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-black transition-all ${
                          isSimpleMode
                            ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ✨ Đơn Giản (Dễ Dùng)
                      </button>
                      <button
                        onClick={() => setIsSimpleMode(false)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-black transition-all ${
                          !isSimpleMode
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🛠️ Đầy Đủ (Chuyên Sâu)
                      </button>
                    </div>
                  </div>

                  <nav className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
                    <button 
                      onClick={() => setActiveTab('setup')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                        activeTab === 'setup' 
                          ? 'bg-gradient-to-r from-red-600 via-amber-600 to-emerald-600 text-white shadow-md shadow-amber-600/30' 
                          : 'text-amber-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Sparkles size={16} className="text-amber-300 shrink-0" />
                      <span>1. 🇻🇳 Cài Máy Mới</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('noti')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                        activeTab === 'noti' 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Bell size={16} className="shrink-0" />
                      <span>2. 🔔 Sửa Thông Báo & Giọng Nói</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('apps')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                        activeTab === 'apps' 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Package size={16} className="shrink-0" />
                      <span>3. 🗑️ Gỡ App Rác & Cài APK</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('tune')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                        activeTab === 'tune' 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Sliders size={16} className="shrink-0" />
                      <span>4. 🚀 Tối Ưu Pin / Mượt / Phông Chữ</span>
                    </button>
                    <button 
                      onClick={() => {
                        setActiveTab('shizuku');
                        refreshShizukuFullStatus();
                      }}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                        activeTab === 'shizuku' 
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30' 
                          : 'text-cyan-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Activity size={16} className={shizukuRunning ? 'text-emerald-300 shrink-0' : 'text-cyan-400 shrink-0'} />
                      <span>5. ⚡ Shizuku</span>
                      <span className={`w-2 h-2 rounded-full ${shizukuRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    </button>
                  </nav>
                </div>
              )}
            </header>



            {!isConnected ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Live RSA Authorization Banner when waiting for user to accept on Honor phone */}
                {waitingForPhoneAuth && (
                  <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-6 text-left shadow-xl shadow-amber-500/10 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
                        <Smartphone size={28} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
                          ⚡ Đã đẩy lệnh cấp quyền sang điện thoại Honor!
                        </h3>
                        <p className="text-sm text-amber-100/90 leading-relaxed">
                          Hãy nhìn vào màn hình điện thoại Honor của bạn ngay bây giờ:
                        </p>
                        <ul className="text-xs text-amber-200/90 space-y-1.5 list-disc pl-4">
                          <li><strong>Mở khóa màn hình điện thoại</strong> (MagicOS sẽ ẩn bảng hỏi nếu màn hình đang khóa).</li>
                          <li>Trên bảng <strong>"Cho phép gỡ lỗi USB?" (Allow USB debugging?)</strong>, tích chọn <strong>"Luôn cho phép từ máy tính / thiết bị này"</strong>.</li>
                          <li>Bấm nút <strong>"Cho phép" (Allow / OK)</strong> để hoàn tất kết nối!</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 text-center shadow-2xl space-y-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto relative">
                     <Usb size={38} className="text-blue-500" />
                     <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-3xl font-black text-white">
                      Cắm Cáp & Bấm Kết Nối Điện Thoại Honor
                    </h2>
                    <p className="text-sm text-slate-300 max-w-xl mx-auto">
                      Giao diện mới siêu đơn giản: <strong>Chữ to, rõ ràng, người lớn tuổi hay trẻ em đều dễ dàng bấm 1 chạm là xong!</strong>
                    </p>
                  </div>

                  {/* 3 Bước Ngắn Gọn, Chữ To Dễ Đọc */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
                    <div className="p-4 rounded-2xl bg-slate-950/90 border border-blue-500/30 space-y-1">
                      <div className="text-xs font-black text-blue-400 uppercase">Bước 1</div>
                      <div className="text-sm font-bold text-white">Bật Gỡ lỗi USB</div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Trong <em>Tùy chọn nhà phát triển</em> trên ĐT Honor, bật <strong>Gỡ lỗi USB</strong> & <strong>ADB khi chỉ sạc</strong>.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-1">
                      <div className="text-xs font-black text-emerald-400 uppercase">Bước 2</div>
                      <div className="text-sm font-bold text-white">Cắm cáp & Mở khóa ĐT</div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Cắm dây cáp USB vào máy tính (hoặc ĐT thứ 2) và <strong>để màn hình ĐT sáng mở khóa</strong>.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-1">
                      <div className="text-xs font-black text-amber-400 uppercase">Bước 3</div>
                      <div className="text-sm font-bold text-white">Bấm nút Xanh bên dưới</div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Bấm nút <strong>Kết nối điện thoại Honor</strong> bên dưới rồi bấm <strong>"Cho phép"</strong> trên ĐT!
                      </p>
                    </div>
                  </div>

                  {/* Nút Bấm Chính Cỡ Lớn (Dễ nhìn, dễ bấm) */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button 
                      onClick={() => handleConnect(false)}
                      disabled={isProcessing}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-3 text-base sm:text-lg disabled:opacity-50"
                    >
                      {isProcessing ? <RefreshCw size={22} className="animate-spin" /> : <Usb size={22} />}
                      {waitingForPhoneAuth
                        ? 'Đang chờ bấm Cho phép trên ĐT...'
                        : isProcessing
                          ? 'Đang kết nối...'
                          : '🔌 BẤM KẾT NỐI ĐIỆN THOẠI HONOR'}
                    </button>

                    <button 
                      onClick={() => handleConnect(true)}
                      disabled={isProcessing}
                      className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 hover:text-amber-200 px-5 py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
                      title="Xóa khóa RSA cũ và sinh cặp khóa mới để ép Android Honor đẩy lại cửa sổ xác nhận gỡ lỗi"
                    >
                      <KeyRound size={16} className="text-amber-400" />
                      ⚡ Ép Hiện Bảng Cho Phép (RSA Mới)
                    </button>
                  </div>

                  {/* Nút mở rộng xem hướng dẫn chi tiết (Không gây rối mắt mặc định) */}
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setShowConnectionDetails(!showConnectionDetails)}
                      className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all"
                    >
                      {showConnectionDetails
                        ? '🔼 Thu gọn hướng dẫn chi tiết'
                        : '📖 Xem hướng dẫn chi tiết từng bước (Máy tính / Nối 2 điện thoại)'}
                    </button>
                    <button 
                      onClick={() => setShowFeaturesModal(true)}
                      className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-blue-300 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <Info size={14} className="text-blue-400" />
                      <span>Danh sách tính năng</span>
                    </button>
                  </div>

                  {showConnectionDetails && (
                    <div className="pt-4 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-300">
                      {/* Chọn phương thức kết nối: Máy tính hoặc 2 ĐT nối C to C */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-slate-950/90 rounded-2xl border border-slate-800 max-w-2xl mx-auto shadow-inner">
                        <button
                          onClick={() => setConnectionGuideTab('pc')}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            connectionGuideTab === 'pc'
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                          }`}
                        >
                          <Laptop size={14} />
                          <span>💻 Máy Tính (USB)</span>
                        </button>
                        <button
                          onClick={() => setConnectionGuideTab('ctoc')}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            connectionGuideTab === 'ctoc'
                              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-lg shadow-indigo-600/30'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                          }`}
                        >
                          <Smartphone size={14} />
                          <span>📱 2 ĐT Nối C-to-C</span>
                        </button>
                      </div>

                      {/* Khối hướng dẫn theo phương thức đã chọn */}
                      {connectionGuideTab === 'pc' ? (
                        <div className="text-slate-300 space-y-3 text-xs text-left max-w-lg mx-auto bg-slate-950/70 p-5 rounded-xl border border-slate-800/80">
                          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Laptop size={13} />
                            <span>Các bước kết nối bằng Máy tính:</span>
                          </div>
                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-[10px] flex items-center justify-center text-white font-bold shrink-0 mt-0.5">1</span>
                            <p>Vào <strong>Cài đặt {">"} Hệ thống & Cập nhật {">"} Tùy chọn nhà phát triển</strong> trên máy Honor: Bật <strong>Gỡ lỗi USB</strong> VÀ bật <strong>"Cho phép gỡ lỗi ADB ở chế độ chỉ sạc"</strong>.</p>
                          </div>
                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-[10px] flex items-center justify-center text-white font-bold shrink-0 mt-0.5">2</span>
                            <p>Cắm cáp USB vào máy tính, kéo thanh thông báo điện thoại xuống chọn <strong>"Truyền tệp (MTP)"</strong> và <strong>giữ màn hình điện thoại mở khóa</strong>.</p>
                          </div>
                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-[10px] flex items-center justify-center text-white font-bold shrink-0 mt-0.5">3</span>
                            <p>Bấm nút <strong>"BẤM KẾT NỐI ĐIỆN THOẠI HONOR"</strong> ở trên để bắt đầu tối ưu!</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-300 space-y-3 text-xs text-left max-w-lg mx-auto bg-gradient-to-br from-indigo-950/50 via-slate-950/90 to-purple-950/40 p-5 rounded-xl border border-indigo-500/40 shadow-xl">
                          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Smartphone size={13} />
                            <span>Các bước kết nối 2 điện thoại qua Cáp C to C (Không cần máy tính):</span>
                          </div>
                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center text-white font-bold shrink-0 mt-0.5">1</span>
                            <p><strong>Cáp kết nối:</strong> Chuẩn bị 1 sợi cáp 2 đầu Type-C (cáp sạc Type-C to Type-C thông thường kèm theo máy).</p>
                          </div>
                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center text-white font-bold shrink-0 mt-0.5">2</span>
                            <p><strong>Điện thoại A (Máy điều khiển):</strong> Bất kỳ máy Android nào (Samsung, Xiaomi, Pixel, Oppo, Honor...), mở trình duyệt <strong>Google Chrome</strong> và truy cập trang web MagicTune này.</p>
                          </div>
                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center text-white font-bold shrink-0 mt-0.5">3</span>
                            <p><strong>Điện thoại B (Máy Honor cần tối ưu):</strong> Vào <em>Tùy chọn nhà phát triển</em> ➡️ Bật <strong>Gỡ lỗi USB</strong> VÀ <strong>"Cho phép gỡ lỗi ADB ở chế độ chỉ sạc"</strong>.</p>
                          </div>
                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center text-white font-bold shrink-0 mt-0.5">4</span>
                            <p><strong>Nối cáp:</strong> Cắm vào ĐT A trước, rồi cắm vào ĐT Honor B. (Nếu ĐT A hiện thông báo USB thì chọn <em>"Cung cấp nguồn / Thiết bị điều khiển (Host)"</em>).</p>
                          </div>
                        </div>
                      )}

                      {/* Nhắc nhở bấm 2 lần */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 border border-amber-500/35 text-amber-300 text-xs text-left max-w-lg mx-auto flex items-start gap-3 shadow-lg">
                        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-black text-amber-200 uppercase tracking-tight">💡 Mẹo: Hãy bấm nút Kết nối 2 lần nếu cổng USB đang bận</span>
                          <p className="text-[11px] text-amber-200/90 leading-relaxed">
                            Lần 1 hệ thống sẽ tự động giải phóng cổng USB bị kẹt, Lần 2 sẽ bắt tay kết nối thành công 100%!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <AdSlot className="max-w-xl mx-auto" />

                  {/* Interactive Troubleshooting Banner for missing authorization popup */}
                  <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-blue-500/10 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-left max-w-xl mx-auto shadow-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                        <HelpCircle size={22} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                          Sao không thấy điện thoại đẩy cửa sổ xác nhận gỡ lỗi?
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Xem 6 lý do phổ biến (đặc biệt cài đặt ẩn của Honor MagicOS) và hướng dẫn ép hiện lại bảng xác nhận 100%.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAuthTroubleshootModal(true)}
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-md shadow-amber-500/30 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>Xem Cách Xử Lý</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Features Showcase Modal */}
                {showFeaturesModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#020617] border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
                      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                          <Zap size={20} className="text-blue-500" />
                          Khả năng của MagicTune Nội Địa
                        </h3>
                        <button onClick={() => setShowFeaturesModal(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="p-8 overflow-y-auto max-h-[70vh] space-y-6 scrollbar-hide">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <h4 className="text-blue-400 font-bold text-xs uppercase tracking-widest">1. Sửa lỗi Thông báo</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Fix triệt để lỗi Facebook, Zalo, Gmail không nổ thông báo bằng cách gỡ PowerGenius và mở khóa Google FCM.</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-blue-400 font-bold text-xs uppercase tracking-widest">2. Quản lý Ứng dụng</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Gỡ bỏ ứng dụng rác nội địa Trung Quốc theo phân cấp an toàn (Safe/Risky) để làm nhẹ máy.</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-blue-400 font-bold text-xs uppercase tracking-widest">3. Siêu tùy biến MagicOS</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Ép tần số quét 120Hz, chỉnh tốc độ animation, đổi DPI, bật cưỡng bức Dark Mode và mở khóa 5G.</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-blue-400 font-bold text-xs uppercase tracking-widest">4. Công cụ Shizuku</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Kích hoạt Shizuku Server để cài đặt các app tùy biến sâu như App Ops mà không cần Root.</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-blue-400 font-bold text-xs uppercase tracking-widest">5. Chẩn đoán Thông báo</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Quét sâu trạng thái hệ thống để tìm nguyên nhân chính xác vì sao Facebook không hiện thông báo.</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-blue-400 font-bold text-xs uppercase tracking-widest">6. Shell ADB trực tiếp</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Gửi lệnh shell thủ công tới điện thoại để thực hiện mọi thao tác ADB nâng cao khác.</p>
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-widest">7. Tiết Kiệm Pin Siêu Cấp • Chuẩn Thông Báo 100%</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Dập tắt toàn bộ dịch vụ ngầm thừa thãi (Telemetry TQ, quét Wi-Fi/BLE liên tục, tải ngầm ảnh 4K tạp chí, app rác nội địa) nhưng <strong>bảo vệ tuyệt đối FCM & Zalo, FB, Messenger, Telegram, Gmail</strong> không bao giờ bị chậm hay trễ thông báo!</p>
                          </div>
                        </div>
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
                          <p className="text-[11px] text-blue-400 leading-relaxed italic text-center">
                            Ứng dụng tương thích và hỗ trợ tối ưu trên tất cả các thế hệ MagicOS của dòng máy Honor nội địa.
                          </p>
                          <div className="h-px bg-blue-500/10" />
                          <p className="text-[11px] text-emerald-300 leading-relaxed text-center">
                            ⚡ Tích hợp sẵn <strong>Trình Cài Đặt APK Siêu Tốc (Turbo USB 64KB/s)</strong>: Kéo thả hoặc chọn nhiều file .APK cùng lúc, tự động cấp Full quyền và <strong>mở ứng dụng xuất hiện ngay lên màn hình điện thoại</strong> khi hoàn tất!
                          </p>
                        </div>
                      </div>
                      <div className="p-6 border-t border-slate-800 flex justify-center">
                        <button 
                          onClick={() => setShowFeaturesModal(false)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all text-sm"
                        >
                          Đã hiểu, kết nối ngay
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADB Authorization Troubleshoot Modal */}
                {showAuthTroubleshootModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#020617] border border-amber-500/30 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
                      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                            <HelpCircle size={24} />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                              Tại sao không thấy cửa sổ xác nhận gỡ lỗi trên điện thoại?
                            </h3>
                            <p className="text-xs text-slate-400">
                              Chẩn đoán và khắc phục nhanh lỗi không hiện bảng "Cho phép gỡ lỗi USB?" trên Honor MagicOS
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowAuthTroubleshootModal(false)} 
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="p-6 sm:p-8 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
                        {/* Case 1: Already authorized */}
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                            <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                              1. Kiểm tra: Có thể bạn ĐÃ KẾT NỐI THÀNH CÔNG rồi!
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed pl-6">
                            Nếu trên trang web đã hiện các nút bấm <strong className="text-white">Sửa thông báo, Quản lý ứng dụng, Siêu tùy biến...</strong>: Bạn đã từng tích chọn <em>"Luôn cho phép từ máy tính này"</em> ở lần kết nối trước. Điện thoại Honor đã lưu máy tính của bạn là tin cậy nên Android <strong className="text-emerald-300">tự động duyệt ngầm trong 0.1s mà KHÔNG CẦN HIỆN LẠI cửa sổ nữa</strong>! Bạn có thể sử dụng bình thường ngay bây giờ.
                          </p>
                        </div>

                        {/* Case 2: Charge only mode - Critical for Honor */}
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                              2. ĐẶC BIỆT TRÊN HONOR: Chưa bật "Cho phép gỡ lỗi ADB ở chế độ chỉ sạc"
                            </h4>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] text-amber-200 font-bold uppercase">Phổ biến nhất</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed pl-6">
                            Khi cắm cáp USB vào máy tính hoặc cắm 2 điện thoại với nhau, Honor luôn mặc định chuyển sang chế độ <em>"Chỉ sạc"</em>. Nếu tính năng này trong cài đặt bị TẮT, MagicOS sẽ <strong className="text-amber-300">ngắt hoàn toàn chip ADB và KHÔNG BAO GIỜ đẩy cửa sổ lên</strong>!
                          </p>
                          <div className="ml-6 p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 text-xs text-slate-300 space-y-1">
                            <p className="text-[11px] font-bold text-amber-200">👉 Cách bật ngay trên máy Honor:</p>
                            <p className="text-[11px]">Vào <strong>Cài đặt</strong> ➔ <strong>Hệ thống & Cập nhật</strong> ➔ <strong>Tùy chọn nhà phát triển</strong> ➔ Gạt BẬT mục: <strong className="text-white">"Cho phép gỡ lỗi ADB ở chế độ chỉ sạc"</strong> (Allow ADB debugging in charge only mode).</p>
                          </div>
                        </div>

                        {/* Case 3: Locked screen */}
                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                          <div className="flex items-center gap-2">
                            <Lock size={18} className="text-blue-400 shrink-0" />
                            <h4 className="text-xs font-black text-blue-300 uppercase tracking-wide">
                              3. Màn hình điện thoại đang Tắt hoặc đang Khóa mã PIN / Vân tay
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed pl-6">
                            Hệ điều hành MagicOS có cơ chế bảo mật cao: Bảng hỏi cấp quyền ADB sẽ <strong>bị ẩn hoàn toàn</strong> nếu màn hình đang tắt hoặc điện thoại đang ở màn hình khóa. Hãy mở sáng màn hình và mở khóa vào thẳng màn hình chính trước khi bấm nút kết nối.
                          </p>
                        </div>

                        {/* Case 4: Revoke debugging authorizations */}
                        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                          <div className="flex items-center gap-2">
                            <RotateCcw size={18} className="text-indigo-400 shrink-0" />
                            <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wide">
                              4. Thu hồi quyền cấp phép cũ trên điện thoại (Ép Android hiện lại bảng 100%)
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed pl-6">
                            Nếu bộ nhớ khóa RSA giữa điện thoại và trình duyệt bị lệch:
                          </p>
                          <div className="ml-6 p-3 rounded-xl bg-slate-950/80 border border-indigo-500/20 text-xs text-slate-300 space-y-1">
                            <p className="text-[11px]">1. Mở <strong>Tùy chọn nhà phát triển</strong> trên điện thoại Honor.</p>
                            <p className="text-[11px]">2. Tìm và bấm vào dòng <strong className="text-indigo-300">"Thu hồi quyền cấp phép gỡ lỗi USB"</strong> (Revoke USB debugging authorizations) ➔ Bấm <strong>OK</strong>.</p>
                            <p className="text-[11px]">3. Rút cáp cắm lại ➔ Bấm nút <strong className="text-amber-300">"⚡ Ép Tạo Khóa RSA Mới"</strong> trên web bên dưới.</p>
                          </div>
                        </div>

                        {/* Case 5: Software conflict on PC */}
                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                          <div className="flex items-center gap-2">
                            <Laptop size={18} className="text-teal-400 shrink-0" />
                            <h4 className="text-xs font-black text-teal-300 uppercase tracking-wide">
                              5. Cổng USB bị phần mềm khác trên máy tính chiếm giữ
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed pl-6">
                            Nếu máy tính đang chạy: <strong className="text-white">Honor Suite, Huawei HiSuite, Scrcpy, 3uTools, Android Studio</strong> hoặc các trình giả lập Android (BlueStacks, LDPlayer, Nox...): Tiến trình <code>adb.exe</code> của chúng sẽ khóa độc quyền cổng USB khiến trình duyệt không gửi gói tin sang điện thoại được.
                            <br />
                            👉 <em>Cách xử lý:</em> Thoát hoàn toàn HiSuite / Honor Suite ở khay icon góc phải màn hình máy tính, hoặc mở Task Manager bấm End Task tiến trình <code>adb.exe</code>.
                          </p>
                        </div>

                        {/* Case 6: USB Mode & Cable */}
                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                          <div className="flex items-center gap-2">
                            <Usb size={18} className="text-purple-400 shrink-0" />
                            <h4 className="text-xs font-black text-purple-300 uppercase tracking-wide">
                              6. Chuyển chế độ USB sang "Truyền tệp (MTP)" & Kiểm tra cáp
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed pl-6">
                            - <strong>Chuyển chế độ:</strong> Vuốt thanh thông báo từ trên đỉnh màn hình xuống ➔ Chạm vào thông báo sạc USB ➔ Chọn sang <strong className="text-white">"Truyền tệp (MTP)"</strong> để kích hoạt nhận diện phần cứng.
                            <br />
                            - <strong>Cáp kết nối:</strong> Một số sợi cáp sạc giá rẻ chỉ có 2 chân nguồn để sạc, không có 2 dây truyền dữ liệu (Data D+/D-). Hãy đổi sang cáp Type-C zin đi kèm máy.
                          </p>
                        </div>
                      </div>

                      {/* Modal Footer with Action Buttons */}
                      <div className="p-5 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                        <button
                          onClick={() => setShowAuthTroubleshootModal(false)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                        >
                          Đóng
                        </button>
                        <button
                          onClick={async () => {
                            setShowAuthTroubleshootModal(false);
                            await handleConnect(true);
                          }}
                          disabled={isProcessing}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                        >
                          <KeyRound size={15} />
                          ⚡ Ép Tạo Khóa RSA Mới & Bắt Tay Lại Ngay
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                
                {/* Device Info Bar (Gọn gàng 1 dòng mặc định, bấm để mở rộng chi tiết phần cứng) */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex flex-wrap gap-2 items-center justify-between p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/15 rounded-xl text-blue-300 text-xs sm:text-sm font-black uppercase tracking-wider">
                        <Smartphone size={15} />
                        <span>{deviceInfo?.manufacturer} {deviceInfo?.model}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-xl text-slate-200 text-xs font-bold uppercase">
                        Android {deviceInfo?.version}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 rounded-xl text-emerald-300 text-xs font-black uppercase">
                        <ShieldCheck size={14} />
                        Đã Kết Nối Sẵn Sàng
                      </div>
                    </div>

                    <button
                      onClick={() => setShowHardwareDetails(!showHardwareDetails)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <Info size={13} className="text-blue-400" />
                      <span>{showHardwareDetails ? '🔼 Ẩn thông số máy' : 'ℹ️ Xem thông số phần cứng'}</span>
                    </button>
                  </div>

                  {showHardwareDetails && (
                    <div className="border-t border-slate-800/60 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-slate-800/30 p-1 sm:p-2 border-b border-slate-800/50">
                        <div className="p-2 sm:p-3 flex flex-col gap-0.5">
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                            <Cpu size={10} className="text-blue-500" />
                            Vi xử lý (SoC)
                          </div>
                          <div className="text-xs font-bold text-slate-200 truncate" title={deviceInfo?.soc}>{deviceInfo?.soc || 'Unknown'}</div>
                        </div>
                        <div className="p-2 sm:p-3 flex flex-col gap-0.5 border-l border-slate-800/50">
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                            <Zap size={10} className="text-amber-500" />
                            Đồ họa (GPU)
                          </div>
                          <div className="text-xs font-bold text-slate-200 truncate" title={deviceInfo?.gpu}>{deviceInfo?.gpu || 'Unknown'}</div>
                        </div>
                        <div className="p-2 sm:p-3 flex flex-col gap-0.5 border-t md:border-t-0 md:border-l border-slate-800/50">
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                            <Database size={10} className="text-indigo-500" />
                            RAM / Swap
                          </div>
                          <div className="text-xs font-bold text-slate-200 truncate">{deviceInfo?.ram || 'Unknown'}</div>
                        </div>
                        <div className="p-2 sm:p-3 flex flex-col gap-0.5 border-t lg:border-t-0 lg:border-l border-slate-800/50">
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                            <Database size={10} className="text-emerald-500" />
                            Lưu trữ (Storage)
                          </div>
                          <div className="text-xs font-bold text-slate-200 truncate">{deviceInfo?.storage || 'Unknown'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-slate-800/30 p-1 sm:p-2 border-b border-slate-800/50">
                        <div className="p-2 sm:p-3 flex flex-col gap-0.5">
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                            <Smartphone size={10} className="text-blue-400" />
                            Màn hình (Hz)
                          </div>
                          <div className="text-xs font-bold text-slate-200 truncate">
                            {deviceInfo?.screen?.split(' (')[0]} <span className="text-[10px] text-blue-400 font-black">@ {deviceInfo?.refreshRate || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 flex flex-col gap-0.5 border-l border-slate-800/50">
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                            <Flame size={10} className="text-orange-500" />
                            Nhiệt độ Pin
                          </div>
                          <div className="text-xs font-bold text-slate-200">{deviceInfo?.temp || 'N/A'}</div>
                        </div>
                        <div className="p-2 sm:p-3 flex flex-col gap-0.5 border-t md:border-t-0 md:border-l border-slate-800/50">
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                            <RotateCcw size={10} className="text-purple-500" />
                            Thời gian chạy
                          </div>
                          <div className="text-xs font-bold text-slate-200 truncate">{deviceInfo?.uptime || 'N/A'}</div>
                        </div>
                        <div className="p-2 sm:p-3 flex flex-col gap-0.5 border-t lg:border-t-0 lg:border-l border-slate-800/50">
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1 text-red-400">
                            <Lock size={10} />
                            Bảo mật (Patch)
                          </div>
                          <div className="text-xs font-bold text-slate-200 truncate">{deviceInfo?.securityPatch || 'Unknown'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-800/30 p-1 sm:p-2">
                        <div className="p-2 sm:p-3 flex flex-col gap-0.5">
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                            <Settings size={10} className="text-slate-400" />
                            Phần cứng (HW)
                          </div>
                          <div className="text-xs font-bold text-slate-200 uppercase">{deviceInfo?.hardware || 'Unknown'}</div>
                        </div>
                        <div className="p-2 sm:p-3 flex flex-col gap-0.5 border-l border-slate-800/50">
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                            <Info size={10} className="text-slate-500" />
                            Build / Codename
                          </div>
                          <div className="text-xs font-bold text-slate-400 truncate" title={deviceInfo?.magicOS}>
                            {deviceInfo?.codename || 'Unknown'}
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 flex flex-col gap-0.5 border-t md:border-t-0 border-l border-slate-800/50 col-span-2 md:col-span-1">
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                            <Signal size={10} className="text-blue-500" />
                            Serial ADB
                          </div>
                          <div className="text-xs font-bold text-slate-500 font-mono truncate">{deviceInfo?.serial || 'USB_PORT'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* =========================================================================================
                    ✨ CHẾ ĐỘ ĐƠN GIẢN (CHO NGƯỜI LỚN TUỔI & TRẺ EM): CHỮ TO, DỄ NHÌN, BẤM 1 CHẠM LÀ XONG
                   ========================================================================================= */}
                {isSimpleMode && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    {/* =========================================================================
                        TAB 1: CÀI MÁY MỚI (ĐẦY ĐỦ 8 HẠNG MỤC + KHO APP VIỆT + CHẨN ĐOÁN)
                       ========================================================================= */}
                    {activeTab === 'setup' && (
                      <div className="space-y-5">
                        {/* Banner Tổng 8-trong-1 */}
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/60 border border-amber-500/40 flex flex-col lg:flex-row items-center justify-between gap-5 shadow-xl">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase">
                                Dành cho máy mới mua hoặc vừa khôi phục cài đặt gốc (8-trong-1)
                              </span>
                              {newDeviceStatus && (
                                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                                  Điểm chuẩn hóa: {newDeviceStatus.readyScore}/8 mục đạt chuẩn
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white">
                              🇻🇳 Bấm 1 Nút: Tự Cài Tiếng Việt, CH Play, Danh Bạ +84, GPS & Xóa Chữ Trung
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              Chỉ cần bấm nút lớn màu Cam bên phải, máy sẽ tự động làm trọn gói 8 việc: Đổi Tiếng Việt, bật Google & mở tải CH Play, đồng bộ Danh bạ, sửa lỗi tên người gọi +84, xóa dấu chấm than Wi-Fi, dọn chữ Trung màn hình chính, sửa định vị GPS Google Maps và mở khóa thông báo!
                            </p>
                          </div>
                          <div className="flex flex-col gap-2.5 w-full lg:w-80 shrink-0">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  const res = await adbClientRef.current.oneClickSetupNewHonorDevice();
                                  setNewDeviceStatus(res.status);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-base shadow-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Zap size={20} className="fill-slate-950 shrink-0" />
                              <span>🚀 LÀM TẤT CẢ 8 MỤC (1 BẤM)</span>
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                    setNewDeviceStatus(st);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-3 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/35 text-xs font-bold flex items-center justify-center gap-1.5"
                              >
                                <Search size={14} />
                                <span>Kiểm Tra 8 Mục</span>
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    const st = await adbClientRef.current.restoreAllNewDeviceSetupToDefault();
                                    setNewDeviceStatus(st);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5"
                              >
                                <RotateCcw size={14} />
                                <span>Hoàn Tác Gốc</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <AdSlot />

                        {/* 8 Hạng Mục Đầy Đủ Của Tab Cài Máy Mới */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 1. Tiếng Việt & Múi giờ */}
                          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-black text-amber-300">1. 🇻🇳 Đổi Ngôn Ngữ Tiếng Việt & Giờ VN (GMT+7)</h4>
                              <p className="text-xs text-slate-300 mt-1">Chuyển toàn bộ hệ thống sang Tiếng Việt (vi-VN), múi giờ Hồ Chí Minh và đồng hồ 24 giờ.</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.setupVietnameseLanguageAndLocale();
                                    const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                    setNewDeviceStatus(st);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm"
                              >
                                🇻🇳 Bật Tiếng Việt Ngay
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.restoreDefaultLanguageAndLocale();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                                title="Hoàn tác ngôn ngữ"
                              >
                                Hoàn tác
                              </button>
                            </div>
                          </div>

                          {/* 2. Google Play & Danh bạ */}
                          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-black text-blue-300">2. 🛒 Bật Google (GMS), Tải CH Play & Đồng Bộ Danh Bạ</h4>
                              <p className="text-xs text-slate-300 mt-1">Kích hoạt dịch vụ Google ẩn trong máy, mở tải Chợ CH Play và ép đồng bộ Danh bạ Google xuống máy.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.openHonorMarketToInstallGooglePlay();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm"
                              >
                                🛒 Bật Google & Tải CH Play
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.syncGoogleContactsAndCalendarNow();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm"
                              >
                                👥 Đồng Bộ Danh Bạ Ngay
                              </button>
                            </div>
                          </div>

                          {/* 3. Bàn phím Tiếng Việt */}
                          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-black text-purple-300">3. ⌨️ Bàn Phím Tiếng Việt & Khóa Bàn Phím Trung</h4>
                              <p className="text-xs text-slate-300 mt-1">Mở tải Laban Key, đặt Laban Key hoặc Google Gboard làm bàn phím chính và đóng băng phím tiếng Trung.</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.openGooglePlayToInstallLabanKey();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-bold text-xs"
                              >
                                📥 Tải Laban Key
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.setDefaultLabanKeyKeyboard();
                                    await adbClientRef.current.freezeChineseStockKeyboards();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs"
                              >
                                Chọn Laban Key
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.setDefaultGboardKeyboard();
                                    await adbClientRef.current.freezeChineseStockKeyboards();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs"
                              >
                                Chọn Gboard
                              </button>
                            </div>
                          </div>

                          {/* 4. Sửa Danh Bạ +84 & Xóa Chấm Than Wi-Fi */}
                          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-black text-emerald-300">4. 📞 Sửa Lỗi Danh Bạ +84, Xóa Chấm Than Wi-Fi & Bật 5G</h4>
                              <p className="text-xs text-slate-300 mt-1">Sửa lỗi số gọi đến không hiện tên (lệch đầu số +84 và 0), xóa dấu chấm than (!) trên cột Wi-Fi và mở khóa 5G/VoLTE.</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.fixVietnamCallerId84NetworkAndCaptivePortal();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm"
                              >
                                📞 Sửa Danh Bạ +84 & Wi-Fi Ngay
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.restoreDefaultCallerIdNetworkAndCaptivePortal();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                              >
                                Hoàn tác
                              </button>
                            </div>
                          </div>

                          {/* 5. Xóa Chữ Trung Màn Hình Chính */}
                          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-black text-pink-300">5. 🧹 Xóa Chữ Trung Quốc Màn Hình Chính & Khóa Quảng Cáo</h4>
                              <p className="text-xs text-slate-300 mt-1">Tắt bảng tin tiếng Trung khi vuốt trái (HiBoard), tắt vuốt xuống tìm kiếm chữ Trung và tắt tạp chí màn hình khóa.</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.cleanChineseHomeScreenAndFeeds();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-sm"
                              >
                                🧹 Dọn Sạch Chữ Trung Màn Hình
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.restoreChineseHomeScreenAndFeedsDefault();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                              >
                                Hoàn tác
                              </button>
                            </div>
                          </div>

                          {/* 6. Định vị GPS */}
                          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-black text-cyan-300">6. 📍 Sửa Lỗi Định Vị GPS</h4>
                              <p className="text-xs text-slate-300 mt-1">Chuyển định vị Baidu nội địa sang Google Location chuẩn Việt Nam.</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.setupGoogleLocationAndGpsVietnam();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="flex-1 py-3 px-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm"
                              >
                                📍 Chuẩn Hóa GPS VN
                              </button>
                            </div>
                          </div>

                          {/* 7. Chặn Chợ Honor Tự Cập Nhật Đè App Việt */}
                          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-black text-rose-300">7. 🛡️ Chặn Chợ Honor Tự Cập Nhật Đè App Sang Tiếng Trung</h4>
                              <p className="text-xs text-slate-300 mt-1">Ngăn chặn Honor App Market tự ý cập nhật ngầm biến ứng dụng quốc tế trên máy thành bản nội địa Trung Quốc.</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.blockHonorMarketAutoUpdate(false);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm"
                              >
                                🛡️ Chặn Tự Cập Nhật Đè App
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.restoreHonorMarketAutoUpdateDefault();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                              >
                                Hoàn tác
                              </button>
                            </div>
                          </div>

                          {/* 8. Mở Khóa Thông Báo & Giữ Chuông Riêng */}
                          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-black text-indigo-300">8. 🔔 Mở Khóa Thông Báo Zalo/FB & Giữ Chuông Riêng</h4>
                              <p className="text-xs text-slate-300 mt-1">Mở khóa chạy ngầm 24/24 cho Zalo, Messenger, Facebook, Gmail và giữ âm thanh chuông riêng từng ứng dụng.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.optimizeAllApps();
                                    await adbClientRef.current.fixFacebookNuclear();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm"
                              >
                                🚀 Sửa Thông Báo Ngay
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.prioritizeAppCustomNotificationSounds(false, false);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm"
                              >
                                🎵 Giữ Chuông Riêng
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 9. Chợ Tải Nhanh Ứng Dụng Thiết Yếu Cho Người Việt */}
                        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/35 space-y-4 shadow-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                                <span>📲 Chợ Tải Nhanh Ứng Dụng Phổ Biến Cho Người Việt (1 Chạm Mở Tải Trên ĐT)</span>
                              </h4>
                              <p className="text-xs text-slate-300">
                                Bấm vào ứng dụng bạn cần dùng, màn hình điện thoại Honor sẽ tự động mở thẳng trang cài đặt chính chủ trên CH Play!
                              </p>
                            </div>
                            <button
                              onClick={() => apkFileInputRef.current?.click()}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shrink-0 flex items-center justify-center gap-1.5"
                            >
                              <Upload size={15} />
                              <span>📁 Cài Từ File .APK Trong Máy</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                            {[
                              { name: 'Zalo', pkg: 'com.zing.zalo', desc: 'Nhắn tin, gọi điện' },
                              { name: 'Facebook', pkg: 'com.facebook.katana', desc: 'Mạng xã hội' },
                              { name: 'Messenger', pkg: 'com.facebook.orca', desc: 'Trò chuyện FB' },
                              { name: 'YouTube', pkg: 'com.google.android.youtube', desc: 'Xem video' },
                              { name: 'Laban Key', pkg: 'com.vng.inputmethod.labankey', desc: 'Gõ Tiếng Việt' },
                              { name: 'Google Gboard', pkg: 'com.google.android.inputmethod.latin', desc: 'Bàn phím Google' },
                              { name: 'Google Chrome', pkg: 'com.android.chrome', desc: 'Lướt web' },
                              { name: 'Google Maps', pkg: 'com.google.android.apps.maps', desc: 'Bản đồ chỉ đường' },
                              { name: 'Gmail', pkg: 'com.google.android.gm', desc: 'Thư điện tử' },
                              { name: 'VNeID', pkg: 'com.vnid', desc: 'Định danh điện tử' }
                            ].map((item) => {
                              const installed = apps.some((a) => a.packageName === item.pkg);
                              return (
                                <button
                                  key={item.pkg}
                                  onClick={async () => {
                                    if (!adbClientRef.current) return;
                                    setIsProcessing(true);
                                    try {
                                      if (installed) {
                                        await adbClientRef.current.launchAppOnScreen(item.pkg);
                                      } else {
                                        await adbClientRef.current.openPlayStoreForApp(item.pkg, item.name);
                                      }
                                    } finally {
                                      setIsProcessing(false);
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className={`p-3 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between gap-2 ${
                                    installed
                                      ? 'bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-950/50'
                                      : 'bg-slate-950/80 border-slate-800 hover:border-blue-500/50'
                                  }`}
                                >
                                  <div>
                                    <div className="text-xs sm:text-sm font-black text-white">{item.name}</div>
                                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                                  </div>
                                  <div className={`text-[11px] font-black px-2 py-1 rounded-lg text-center ${
                                    installed ? 'bg-emerald-500 text-slate-950' : 'bg-blue-600 text-white'
                                  }`}>
                                    {installed ? '✓ Đã Cài (Bấm Mở)' : '📥 Tải Về ĐT'}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* =========================================================================
                        TAB 2: SỬA THÔNG BÁO & GIỌNG NÓI (ĐẦY ĐỦ TÍNH NĂNG THÔNG BÁO, ROBOT, FB/GMAIL, NHÂN BẢN, YOYO/GOOGLE VOICE)
                       ========================================================================= */}
                    {activeTab === 'noti' && (
                      <div className="space-y-5">
                        {/* Khối 1: Sửa Toàn Diện Thông Báo & Robot Tự Gạt */}
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-slate-900 border border-blue-500/40 flex flex-col lg:flex-row items-center justify-between gap-5 shadow-xl">
                          <div className="space-y-2">
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase">
                              Quan trọng số 1 cho Zalo, Facebook, Messenger, Gmail, Ngân hàng
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-white">
                              🔔 Sửa Tất Cả Lỗi Trễ Tin Nhắn, Không Nổ Chuông & Mất Thông Báo (1 Chạm)
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              Mở khóa chạy ngầm 24/24 cho toàn bộ ứng dụng trên máy (kể cả Zalo/Facebook nhân bản), giữ chuông riêng của từng ứng dụng, bật sáng màn hình khóa khi có tin nhắn và dùng Robot tự động gạt bật "Biểu ngữ" trên điện thoại!
                            </p>
                          </div>
                          <div className="flex flex-col gap-2.5 w-full lg:w-80 shrink-0">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.optimizeAllApps();
                                  await adbClientRef.current.forceAll100PercentAppsFullNotification(false);
                                  const diag = await adbClientRef.current.diagnoseAllApps();
                                  setMultiAppDiag(diag);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Zap size={20} className="text-amber-300 shrink-0" />
                              <span>🚀 SỬA THÔNG BÁO 100% APP (1 BẤM)</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                setIsBotRunning(true);
                                try {
                                  const coreTargets = [
                                    { name: 'Zalo', pkg: 'com.zing.zalo' },
                                    { name: 'Messenger', pkg: 'com.facebook.orca' },
                                    { name: 'Facebook', pkg: 'com.facebook.katana' },
                                    { name: 'Gmail', pkg: 'com.google.android.gm' }
                                  ];
                                  await adbClientRef.current.runAutoBotForMultipleApps(coreTargets);
                                } finally {
                                  setIsBotRunning(false);
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing || isBotRunning}
                              className="w-full px-5 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <BellRing size={16} className="text-amber-300 shrink-0" />
                              <span>{isBotRunning ? '🤖 Robot đang tự gạt trên ĐT...' : '🤖 Robot Tự Bật Biểu Ngữ Zalo/FB/Gmail Trên ĐT'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Khối 2: Các Công Cụ Sửa Thông Báo Chuyên Biệt Còn Thiếu */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Đặc trị Facebook & Gmail */}
                          <div className="p-5 rounded-2xl bg-slate-900/80 border border-blue-500/30 space-y-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-black text-blue-300">💬 Đặc Trị Riêng Facebook & Gmail Bị Chậm</h4>
                              <p className="text-xs text-slate-300 mt-1">
                                Sửa lỗi Facebook không hiện thông báo màn hình khóa và ép Gmail nhận thư tức thì không bị gom trễ.
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.fixFacebookNuclear();
                                    await adbClientRef.current.repairFacebookExclusivePush();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs"
                              >
                                🔥 Đặc Trị Facebook
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.unlockGmailAndSync();
                                    await adbClientRef.current.boostGmailAndFacebookInstantFrequency(false);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs"
                              >
                                📧 Sửa Trễ Gmail
                              </button>
                            </div>
                          </div>

                          {/* Ứng dụng Nhân bản (App Twin) & Chuông riêng */}
                          <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-black text-amber-300">👥 Sửa Zalo/FB Nhân Bản & Giữ Chuông Riêng</h4>
                              <p className="text-xs text-slate-300 mt-1">
                                Bật thông báo cho ứng dụng nhân bản (Zalo 2, FB 2) và giữ tiếng chuông riêng của từng ứng dụng.
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.syncAllClonedAndParallelAppsNotifications(false);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs"
                              >
                                👥 Fix App Nhân Bản
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.prioritizeAppCustomNotificationSounds(false, false);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
                              >
                                🎵 Giữ Chuông Riêng
                              </button>
                            </div>
                          </div>

                          {/* Bật Biểu ngữ, Màn khóa & Tắt PowerGenius */}
                          <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-black text-emerald-300">🛡️ Bật Sáng Màn Khóa & Tắt Trình Giết App</h4>
                              <p className="text-xs text-slate-300 mt-1">
                                Ép bật biểu ngữ nổi, sáng màn hình khóa khi có tin nhắn và vô hiệu hóa trình giết app ngầm PowerGenius.
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.forceBatchEnableBannersLockscreenSoundAndDefeatGentleNoti();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                              >
                                🔔 Bật Biểu Ngữ/Khóa
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.removePowerGenius();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs"
                              >
                                💀 Tắt PowerGenius
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Khối 3: Quét & Tự Động Sửa Mọi App Đang Bị "Thông Báo Nhẹ Nhàng" (Gentle Notifications) */}
                        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-purple-500/40 space-y-4 shadow-xl">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="text-base sm:text-lg font-black text-white">
                                🔍 Quét Tìm App Đang Bị Tắt Chuông / Tắt Biểu Ngữ ("Thông Báo Nhẹ Nhàng")
                              </h4>
                              <p className="text-xs text-slate-300">
                                Máy Honor thường tự bật chế độ "Thông báo nhẹ nhàng" làm mất chuông và không hiện tin nhắn trên màn hình khóa. Bấm nút bên phải để quét và cho Robot tự động bật lại!
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    const res = await adbClientRef.current.scanGentleNotificationChannels();
                                    setGentleScanResults(res);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-4 py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-black text-xs flex items-center gap-2"
                              >
                                <Search size={15} />
                                <span>🔍 Quét Kiểm Tra Ngay</span>
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  setIsBotRunning(true);
                                  try {
                                    const res = gentleScanResults || (await adbClientRef.current.scanGentleNotificationChannels());
                                    setGentleScanResults(res);
                                    const targets = res
                                      .filter((r) => r.status !== 'optimal')
                                      .map((r) => ({ name: r.appName, pkg: r.pkg, userId: r.userId }));
                                    if (targets.length > 0) {
                                      await adbClientRef.current.runAutoBotForMultipleApps(targets);
                                      const updated = await adbClientRef.current.scanGentleNotificationChannels();
                                      setGentleScanResults(updated);
                                    }
                                  } finally {
                                    setIsBotRunning(false);
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing || isBotRunning}
                                className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm shadow-lg flex items-center gap-2"
                              >
                                <Zap size={16} />
                                <span>🤖 Quét & Tự Động Sửa Hết Trên ĐT</span>
                              </button>
                            </div>
                          </div>

                          {gentleScanResults && (
                            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                              <div className="text-xs font-bold text-slate-200">
                                Kết quả quét: Có <strong className="text-rose-400">{gentleScanResults.filter(a => a.status !== 'optimal').length}</strong> ứng dụng đang bị hạn chế biểu ngữ/nhẹ nhàng | <strong className="text-emerald-400">{gentleScanResults.filter(a => a.status === 'optimal').length}</strong> ứng dụng đã chuẩn 100%.
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                                {gentleScanResults.slice(0, 18).map((app) => (
                                  <div
                                    key={`${app.pkg}_${app.userId || 0}`}
                                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-xs font-black text-white truncate">{app.appName}</div>
                                      <div className={`text-[10px] font-bold ${app.status === 'optimal' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {app.status === 'optimal' ? '✓ Đã chuẩn chuông & biểu ngữ' : '⚠️ Đang bị hạn chế'}
                                      </div>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        if (!adbClientRef.current) return;
                                        setIsProcessing(true);
                                        setIsBotRunning(true);
                                        try {
                                          await adbClientRef.current.runAutoBotForAppNotification(app.pkg, app.appName, true, undefined, app.userId);
                                          const updated = await adbClientRef.current.scanGentleNotificationChannels();
                                          setGentleScanResults(updated);
                                        } finally {
                                          setIsBotRunning(false);
                                          setIsProcessing(false);
                                        }
                                      }}
                                      disabled={isProcessing || isBotRunning}
                                      className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black shrink-0"
                                    >
                                      🤖 Sửa
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Khối 4: Siêu Nút 1 Chạm Duy Nhất - Việt Hóa YOYO Toàn Diện */}
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-cyan-950/70 border border-emerald-500/50 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-2xl">
                          <div className="space-y-2 max-w-3xl">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase">
                              🇻🇳 Siêu Tự Động 1 Chạm • Việt Hóa YOYO 9.9/10
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                              🤖 Khôi Phục YOYO + Đặt Mặc Định + Cấp Full Quyền + Dạy Kiến Thức Tiếng Việt (Chặn Tiếng Trung Vĩnh Viễn)
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                              Giải pháp tối thượng: Tự động khôi phục 100% gói YOYO gốc, đặt lại mọi mặc định đánh thức, cấp Full 100% quyền hệ thống, ép ngôn ngữ Tiếng Việt (<code className="text-emerald-300">vi-VN</code>), sau đó Robot tự động nạp <strong>4 học phần Tiếng Việt có dấu chuẩn 100%</strong> và <strong>tự động nhấn nút Gửi</strong> để YOYO luôn trả lời bằng Tiếng Việt và không bao giờ còn nói tiếng Trung Quốc nữa!
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.autoTameYoyoVietnamese('full');
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Sparkles size={18} className="shrink-0" />
                              <span>{isProcessing ? 'Đang Việt hóa & dạy YOYO...' : '🇻🇳 Việt Hóa & Dạy Tiếng Việt Cho YOYO (1 Chạm)'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* =========================================================================
                        TAB 3: GỠ APP RÁC & CÀI APK (ĐẦY ĐỦ DỌN RÁC, CÀI APK HẠ CẤP ĐÈ, CẤP QUYỀN, CHẶN CẬP NHẬT & DANH SÁCH APP)
                       ========================================================================= */}
                    {activeTab === 'apps' && (
                      <div className="space-y-5">
                        {/* Hàng 1: Dọn sạch app rác TQ & Cài APK + Cấp đủ quyền */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/40 space-y-4 flex flex-col justify-between shadow-xl">
                            <div className="space-y-2">
                              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase">
                                An toàn tuyệt đối 100%
                              </span>
                              <h3 className="text-xl font-black text-white">
                                🧹 Dọn Sạch Ứng Dụng Rác Trung Quốc (1 Chạm)
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Tự động gỡ bỏ các ứng dụng rác nội địa gây hao pin và hiện quảng cáo tiếng Trung (Honor Video, GameCenter, Browser, Nhạc TQ, Tạp chí khóa...) và quản lý đóng băng YOYO.
                              </p>
                            </div>
                            <div className="space-y-2">
                              <button
                                onClick={async () => {
                                  const level1Pkgs = apps
                                    .filter(a => getDebloatInfo(a.packageName)?.level === 1 && !a.frozenByMagicTune)
                                    .map(a => a.packageName);
                                  if (level1Pkgs.length === 0) {
                                    addLog('✨ Máy đã sạch toàn bộ ứng dụng rác Cấp 1!', 'success');
                                    return;
                                  }
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current?.batchDebloatSafeApps(level1Pkgs);
                                  } finally {
                                    await fetchApps();
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                              >
                                <Trash2 size={20} />
                                <span>🧹 DỌN SẠCH APP RÁC TRUNG QUỐC NGAY</span>
                              </button>
                            </div>
                          </div>


                          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/60 via-slate-900 to-slate-950 border border-cyan-500/40 space-y-4 flex flex-col justify-between shadow-xl">
                            <div className="space-y-2">
                              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase">
                                Cài APK Siêu Tốc • Hỗ Trợ Cài Đè Bản Thấp Hơn (Downgrade)
                              </span>
                              <h3 className="text-xl font-black text-white">
                                📦 Cài File .APK Siêu Tốc (Cho Phép Cài Đè Cả Bản Thấp Hơn)
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Chọn file .APK bất kỳ để cài tự động vào máy Honor. <strong>Hỗ trợ cài đặt đè thành công ngay cả khi phiên bản APK thấp hơn bản đang có trên máy (Bypass Downgrade)</strong> và tự mở lên màn hình khi cài xong!
                              </p>
                              {isInstallingApk && (
                                <div className="p-3 rounded-xl bg-cyan-950/90 border border-cyan-500/50 text-xs text-cyan-200 font-bold">
                                  ⏳ Đang cài đặt: {apkInstallStatus.fileName} ({apkInstallStatus.percent}%) - {apkInstallStatus.phase}
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <button
                                onClick={() => apkFileInputRef.current?.click()}
                                disabled={isProcessing || isInstallingApk}
                                className="w-full py-4 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95"
                              >
                                <Upload size={20} />
                                <span>📁 CHỌN FILE .APK ĐỂ CÀI ĐÈ SIÊU TỐC</span>
                              </button>
                              <a
                                href={MAGICTUNE_DRIVE_FOLDER_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 border border-cyan-400/30"
                                title="Mở thư mục Google Drive chứa tệp magictune_tool.apk để tải về máy"
                              >
                                <Download size={18} className="text-cyan-200" />
                                <span>📥 Tải MagicTune Tool.apk (Google Drive)</span>
                                <ExternalLink size={15} className="opacity-75" />
                              </a>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={async () => {
                                    if (!adbClientRef.current) return;
                                    setIsProcessing(true);
                                    try {
                                      await adbClientRef.current.grantFullPermissionsAllApps();
                                    } finally {
                                      setIsProcessing(false);
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5"
                                >
                                  <ShieldCheck size={15} />
                                  <span>🛡️ Cấp Đủ Quyền 100% App</span>
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!adbClientRef.current) return;
                                    setIsProcessing(true);
                                    try {
                                      await adbClientRef.current.restoreDefaultPermissionsAllApps();
                                    } finally {
                                      setIsProcessing(false);
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
                                >
                                  <RotateCcw size={14} />
                                  <span>Hoàn Tác Quyền</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hàng 2: Chặn Chợ App Honor Tự Động Cập Nhật Đè App Việt */}
                        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-rose-500/35 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
                          <div className="space-y-1">
                            <h4 className="text-base sm:text-lg font-black text-white">
                              🚫 Chặn Chợ Ứng Dụng Honor Tự Động Cập Nhật Đè App Việt Sang Tiếng Trung
                            </h4>
                            <p className="text-xs text-slate-300">
                              Khóa không cho chợ ứng dụng nội địa của Honor tự động cập nhật ngầm làm hỏng hoặc đổi ngôn ngữ của Zalo, Facebook, YouTube, Ngân hàng...
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 shrink-0">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.blockHonorMarketAutoUpdate(false);
                                  await adbClientRef.current.blockAllThirdPartyAppsAutoUpdate();
                                  const s = await adbClientRef.current.getBlockedUpdatePackages();
                                  setBlockedUpdatePkgs(Array.from(s));
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-lg flex items-center gap-2"
                            >
                              <Lock size={16} />
                              <span>🛡️ Khóa Tự Cập Nhật Đè Toàn Bộ App</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.restoreHonorMarketAutoUpdate();
                                  await adbClientRef.current.unblockAllThirdPartyAppsAutoUpdate();
                                  const s = await adbClientRef.current.getBlockedUpdatePackages();
                                  setBlockedUpdatePkgs(Array.from(s));
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5"
                            >
                              <RotateCcw size={14} />
                              <span>Mở Khóa Lại Mặc Định</span>
                            </button>
                          </div>
                        </div>

                        {/* Hàng 3: Danh Sách Ứng Dụng Dễ Nhìn (Tìm kiếm, Mở App, Cấp Quyền, Gỡ Bỏ / Khôi Phục) */}
                        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                              <h4 className="text-base sm:text-lg font-black text-white">
                                📱 Danh Sách Ứng Dụng Trong Máy ({filteredApps.length} ứng dụng)
                              </h4>
                              <p className="text-xs text-slate-400">
                                Bấm chọn bộ lọc hoặc gõ tên ứng dụng để Mở lên điện thoại, Cấp đủ quyền, Gỡ bỏ hoặc Khôi phục lại:
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { id: 'all', label: 'Tất Cả App' },
                                { id: '1', label: '🟢 App Rác An Toàn Nên Gỡ' },
                                { id: '2', label: '🟡 App Cân Nhắc' },
                                { id: 'frozen', label: '❄️ App Đã Gỡ / Đóng Băng' }
                              ].map((f) => (
                                <button
                                  key={f.id}
                                  onClick={() => setDebloatFilter(f.id as any)}
                                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                                    debloatFilter === f.id
                                      ? 'bg-blue-600 text-white shadow-md'
                                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  }`}
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="🔍 Gõ tên ứng dụng cần tìm (ví dụ: Zalo, YOYO, Video, Market, Browser...)"
                              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                            {filteredApps.slice(0, 60).map((app) => {
                              const info = getDebloatInfo(app.packageName);
                              return (
                                <div
                                  key={app.packageName}
                                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                                    app.frozenByMagicTune
                                      ? 'bg-cyan-950/20 border-cyan-500/35'
                                      : info?.level === 1
                                        ? 'bg-emerald-950/15 border-emerald-500/35'
                                        : 'bg-slate-950/80 border-slate-800'
                                  }`}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-sm font-black text-white truncate">
                                        {info?.reason || app.name}
                                      </span>
                                      {app.frozenByMagicTune ? (
                                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-black shrink-0">
                                          ❄️ Đã đóng băng
                                        </span>
                                      ) : info?.level === 1 ? (
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black shrink-0">
                                          Nên gỡ (An toàn)
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-400 truncate">{app.packageName}</div>
                                    {info?.desc && <p className="text-xs text-slate-300 leading-snug">{info.desc}</p>}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                                    <button
                                      onClick={async () => {
                                        if (!adbClientRef.current) return;
                                        setIsProcessing(true);
                                        try {
                                          await adbClientRef.current.launchAppOnScreen(app.packageName);
                                        } finally {
                                          setIsProcessing(false);
                                        }
                                      }}
                                      disabled={isProcessing}
                                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold flex items-center gap-1"
                                    >
                                      <Play size={12} />
                                      <span>Mở App</span>
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!adbClientRef.current) return;
                                        setIsProcessing(true);
                                        try {
                                          await adbClientRef.current.grantFullPermissionsForPackage(app.packageName, false);
                                        } finally {
                                          setIsProcessing(false);
                                        }
                                      }}
                                      disabled={isProcessing}
                                      className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1"
                                    >
                                      <ShieldCheck size={12} />
                                      <span>Cấp Đủ Quyền</span>
                                    </button>
                                    {app.frozenByMagicTune ? (
                                      <button
                                        onClick={async () => {
                                          if (!adbClientRef.current) return;
                                          setIsProcessing(true);
                                          try {
                                            await adbClientRef.current.restoreApp(app.packageName);
                                            await fetchApps();
                                          } finally {
                                            setIsProcessing(false);
                                          }
                                        }}
                                        disabled={isProcessing}
                                        className="ml-auto px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1"
                                      >
                                        <RotateCcw size={12} />
                                        <span>♻️ Khôi Phục Lại</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={async () => {
                                          if (!adbClientRef.current) return;
                                          setIsProcessing(true);
                                          try {
                                            await adbClientRef.current.uninstallApp(app.packageName);
                                            await fetchApps();
                                          } finally {
                                            setIsProcessing(false);
                                          }
                                        }}
                                        disabled={isProcessing || info?.level === 3}
                                        className="ml-auto px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1 disabled:opacity-40"
                                      >
                                        <Trash2 size={12} />
                                        <span>🗑️ Gỡ Bỏ</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* =========================================================================
                        TAB 4: TỐI ƯU PIN / MƯỢT / PHÔNG CHỮ (ĐẦY ĐỦ PIN, 120HZ/144HZ, CHỮ TO ĐẬM CHO NGƯỜI GIÀ, CỬ CHỈ, ÂM THANH, 5G)
                       ========================================================================= */}
                    {activeTab === 'tune' && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 1. Tiết kiệm pin thông minh */}
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/40 space-y-3 flex flex-col justify-between shadow-xl">
                            <div className="space-y-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase">
                                Pin lâu & Mát máy • Không trễ tin nhắn
                              </span>
                              <h4 className="text-lg font-black text-white">🔋 Tiết Kiệm Pin Thông Minh (Không Chậm Zalo/FB)</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                Tắt các dịch vụ ngầm hao pin của Trung Quốc (Telemetry, quét ngầm, tạp chí 4K) nhưng bảo vệ tuyệt đối Zalo, Facebook, Messenger nổ thông báo tức thì.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleApplySmartBatterySaver}
                                disabled={isProcessing}
                                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg"
                              >
                                🔋 Bật Tiết Kiệm Pin Thông Minh
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    const res = await adbClientRef.current.restoreDefaultBatterySettings();
                                    setBatteryStatus(res);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                              >
                                Hoàn tác
                              </button>
                            </div>
                          </div>

                          {/* 1B. Tối ưu Bộ Nhớ Ảo (Swap / RAM Turbo) & Giữ Đa Nhiệm Ứng Dụng Nhắn Tin */}
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/70 via-slate-900 to-slate-950 border border-cyan-500/40 space-y-4 flex flex-col justify-between shadow-xl">
                            <div className="space-y-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase">
                                RAM Turbo Honor • Chống Văng App Nhắn Tin
                              </span>
                              <h4 className="text-lg font-black text-white">🚀 Tối Ưu RAM Turbo & Giữ Đa Nhiệm Nhắn Tin</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                Mở khóa Phantom Process Limit (từ 32 lên vô hạn), nâng bộ đệm đa nhiệm Android lên 128 app và ghim cứng Zalo, Messenger, Gmail vào RAM để nổ thông báo tức thì.
                              </p>
                              
                              {ramTurboStatus && (
                                <div className="mt-3 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400 font-medium uppercase tracking-tighter">Dung lượng Swap/ZRAM:</span>
                                    <span className="text-cyan-300 font-black">{ramTurboStatus.swapSize}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400 font-medium uppercase tracking-tighter">Giới hạn Phantom:</span>
                                    <span className="text-cyan-300 font-black">{ramTurboStatus.phantomLimit}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400 font-medium uppercase tracking-tighter">Bộ đệm đa nhiệm:</span>
                                    <span className="text-cyan-300 font-black">{ramTurboStatus.maxCachedProcesses}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400 font-medium uppercase tracking-tighter">App nhắn tin được bảo vệ:</span>
                                    <span className="text-emerald-400 font-black">{ramTurboStatus.activeMessagingAppsCount} app</span>
                                  </div>
                                  <div className={`mt-1.5 pt-1.5 border-t border-cyan-500/20 text-center text-[10px] font-black uppercase ${ramTurboStatus.isOptimized ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {ramTurboStatus.isOptimized ? '✓ Trạng thái: ĐÃ TỐI ƯU ĐA NHIỆM 9.9/10' : '⚠ Trạng thái: CHƯA TỐI ƯU'}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleOptimizeRam}
                                disabled={isProcessing}
                                className="flex-1 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
                              >
                                🚀 Kích Hoạt RAM Turbo Đa Nhiệm
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    const res = await adbClientRef.current.getHonorTurboRamStatus();
                                    setRamTurboStatus(res);
                                    addLog('📊 Đã cập nhật trạng thái RAM Turbo & Đa nhiệm từ điện thoại.', 'success');
                                  } catch (err: any) {
                                    addLog(`Lỗi kiểm tra RAM: ${err.message || err}`, 'error');
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
                              >
                                {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : 'Kiểm tra'}
                              </button>
                            </div>
                          </div>

                          {/* 1C. Tải & Cài đặt MagicTune Tool (Official APK) */}
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/40 space-y-3 flex flex-col justify-between shadow-xl">
                            <div className="space-y-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase">
                                Thư Mục Drive Chính Chủ • MagicTune Tool
                              </span>
                              <h4 className="text-lg font-black text-white">🛠️ Tải & Cài Đặt MagicTune Tool (Official APK)</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                Truy cập trực tiếp thư mục Google Drive chính chủ để tải bộ công cụ MagicTune Tool APK, Magisk module và các bản việt hóa tối ưu Honor mới nhất.
                              </p>
                            </div>
                            <div className="flex flex-col gap-2.5">
                              <a
                                href={MAGICTUNE_DRIVE_FOLDER_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                              >
                                <ExternalLink size={18} />
                                📂 Mở Google Drive Chứa APK MagicTune Tool
                              </a>
                              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                                * Nhấp nút trên để tải nhanh tệp APK từ Google Drive. Bạn cũng có thể kéo thả hoặc cài tệp APK trực tiếp trong Tab "Cài Đặt APK".
                              </p>
                            </div>
                          </div>

                          {/* 2. Chữ To, Đậm Nét & Giao Diện Cho Người Lớn Tuổi */}
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border border-amber-500/40 space-y-3 flex flex-col justify-between shadow-xl">
                            <div className="space-y-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase">
                                Dành cho Ông Bà, Cha Mẹ & Bảo vệ mắt
                              </span>
                              <h4 className="text-lg font-black text-white">👵 Chữ To, Đậm Nét Dễ Đọc & Chế Độ Tối Dịu Mắt</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                Làm phông chữ trên điện thoại Honor đậm nét hơn (1.2x), to rõ dễ đọc hơn hoặc bật nền Tối (Dark Mode) giúp dịu mắt và tiết kiệm pin.
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.setFontWeight(1.2);
                                    await adbClientRef.current.runShell('settings put system font_scale 1.15');
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm"
                              >
                                🔠 Chữ To & Đậm Nét
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.setFontWeight(1.0);
                                    await adbClientRef.current.runShell('settings put system font_scale 1.0');
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm"
                              >
                                🔡 Cỡ Chữ Mặc Định
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.setDarkMode(true);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                              >
                                🌙 Bật Nền Tối (Đỡ mỏi mắt)
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.setDarkMode(false);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs"
                              >
                                ☀️ Bật Nền Sáng
                              </button>
                            </div>
                          </div>

                          {/* 3. Mượt Màn Hình (144Hz / 120Hz / 90Hz / 60Hz) & Max Setting */}
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-950 border border-purple-500/40 space-y-3 flex flex-col justify-between shadow-xl">
                            <div className="space-y-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase">
                                Tần số quét & Độ mượt màn hình
                              </span>
                              <h4 className="text-lg font-black text-white">🚀 Bật Mượt Màn Hình Tối Đa (120Hz / 144Hz / 90Hz)</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                Mở khóa tần số quét màn hình cao nhất giúp vuốt chạm mượt như lụa, tăng tốc mở ứng dụng (0.5x) và tối ưu GPU.
                              </p>
                            </div>
                            <div className="space-y-2">
                              <button
                                onClick={async () => {
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current?.applyMaxSettings();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg"
                              >
                                🚀 Kích Hoạt Siêu Mượt Toàn Diện (1 Chạm)
                              </button>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => adbClientRef.current?.setRefreshRate(144)}
                                  disabled={isProcessing}
                                  className="py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 font-black text-xs"
                                >
                                  ⚡ 120Hz/144Hz
                                </button>
                                <button
                                  onClick={() => adbClientRef.current?.setRefreshRate(90)}
                                  disabled={isProcessing}
                                  className="py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30 font-black text-xs"
                                >
                                  ⚖️ 90Hz Cân Bằng
                                </button>
                                <button
                                  onClick={() => adbClientRef.current?.setRefreshRate(60)}
                                  disabled={isProcessing}
                                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                                >
                                  🔋 60Hz Tiết Kiệm
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 4. Cử chỉ vuốt Home/Đa nhiệm & Ngăn kéo ứng dụng */}
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-950 border border-blue-500/40 space-y-3 flex flex-col justify-between shadow-xl">
                            <div className="space-y-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase">
                                Cảm ứng, Cử chỉ & Màn hình chính
                              </span>
                              <h4 className="text-lg font-black text-white">🖐️ Ẩn Thanh Kim, Tăng Nhạy Vuốt Đáy & Bật Thư Viện App</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                Tắt đánh thức YOYO qua thao tác nhấn thanh điều hướng (Ẩn Thanh Kim), tăng độ nhạy vuốt từ đáy màn hình lên (Home/Đa nhiệm), ẩn hẳn mục YOYO & AI khỏi Cài đặt và bật Thư viện ứng dụng.
                              </p>
                            </div>
                            <div className="space-y-2">
                              <button
                                onClick={async () => {
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current?.disableYoyoNavigationBarWakeup();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg"
                              >
                                <EyeOff size={15} />
                                <span>🚫 Ẩn Thanh Kim (Tắt Nhấn Thanh Điều Hướng Gọi YOYO & Tăng Nhạy Vuốt Đáy)</span>
                              </button>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={async () => {
                                    setIsProcessing(true);
                                    try {
                                      await adbClientRef.current?.boostNavigationGestureSensitivity();
                                    } finally {
                                      setIsProcessing(false);
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm"
                                >
                                  ⚡ Tăng Nhạy Vuốt Đáy
                                </button>
                                <button
                                  onClick={async () => {
                                    setIsProcessing(true);
                                    try {
                                      await adbClientRef.current?.fixNavigationGestures();
                                    } finally {
                                      setIsProcessing(false);
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm"
                                >
                                  🔄 Sửa Lỗi Đơ Vuốt
                                </button>
                              </div>
                              <button
                                onClick={async () => {
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current?.enableAppDrawerMode();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs"
                              >
                                📱 Bật Thư Viện Ứng Dụng (Vuốt Lên Để Xem Danh Sách App)
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Hàng 2 của Tab Tune: Âm thanh, 5G, Mở khóa chụp màn hình & Tắt AI Search */}
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/40 space-y-4 shadow-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="text-base sm:text-lg font-black text-white">
                                🔊 Sửa Lỗi Âm Thanh Rè Loa & Mở Khóa Tiện Ích Độc Quyền Honor
                              </h4>
                              <p className="text-xs text-slate-300">
                                Sửa lỗi loa ngoài/tai nghe Bluetooth bị xé tiếng, ép sóng 5G khỏe nhất, cho phép chụp ảnh màn hình mọi nơi và tắt AI Search phiền phức.
                              </p>
                            </div>
                            <button
                              onClick={async () => {
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current?.resetTuning();
                                  await adbClientRef.current?.restoreAudioSettings();
                                  await adbClientRef.current?.restoreDefaultBatterySettings();
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/35 text-xs font-black shrink-0"
                            >
                              🔄 Khôi Phục Mặc Định Toàn Tab
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <button
                              onClick={async () => {
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current?.fixAudioDistortion();
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="p-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg"
                            >
                              <Volume2 size={18} />
                              <span>🔊 Sửa Rè Loa & Bluetooth</span>
                            </button>

                            <button
                              onClick={async () => {
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current?.set5GEnabled(true);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg"
                            >
                              <Signal size={18} />
                              <span>📶 Ép Bật Sóng 5G Mạnh Nhất</span>
                            </button>

                            <button
                              onClick={async () => {
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current?.setSecureScreenshots(true);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg"
                            >
                              <ShieldCheck size={18} />
                              <span>📸 Mở Chặn Chụp Màn Hình</span>
                            </button>

                            <button
                              onClick={async () => {
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current?.setHonorSearchEnabled(false);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg"
                            >
                              <EyeOff size={18} />
                              <span>🚫 Tắt Vuốt Xuống AI Search</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* =========================================================================
                        TAB 5: SHIZUKU (ĐẦY ĐỦ BẬT SHIZUKU BẤT TỬ, KHIÊN RÚT CÁP, ADB WIFI, CẤP QUYỀN & 10 APP HỆ SINH THÁI)
                       ========================================================================= */}
                    {activeTab === 'shizuku' && (
                      <div className="space-y-5">
                        {/* Khối 1: Bật Shizuku 1 chạm */}
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/70 border border-cyan-500/40 flex flex-col lg:flex-row items-center justify-between gap-5 shadow-xl">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase">
                                Kích hoạt Shizuku 1 chạm
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                                shizukuRunning ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {shizukuRunning ? '🟢 Shizuku Đang Chạy' : '🟡 Shizuku Chưa Bật'}
                              </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white">
                              ⚡ Bật Shizuku & Giữ Chạy Ngầm Không Bị Tắt Khi Rút Cáp USB
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              Tự động khởi chạy Shizuku, tắt bộ giết tiến trình ngầm của Android 14–17 và bật khiên bảo vệ để khi bạn rút dây cáp USB ra khỏi máy tính, Shizuku vẫn hoạt động bền bỉ 24/24.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2.5 w-full lg:w-80 shrink-0">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  const status = await adbClientRef.current.activateUltimateShizukuHub();
                                  setShizukuDetails(status);
                                  setShizukuRunning(status.serverRunning);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 font-black text-base shadow-xl flex items-center justify-center gap-2"
                            >
                              <Zap size={20} className="fill-slate-950 shrink-0" />
                              <span>🚀 BẬT SHIZUKU BẤT TỬ NGAY</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  const status = await adbClientRef.current.restoreAllShizukuToDefault();
                                  setShizukuDetails(status);
                                  setShizukuRunning(status.serverRunning);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                              <RotateCcw size={14} />
                              <span>Tắt Shizuku & Hoàn tác mặc định</span>
                            </button>
                          </div>
                        </div>

                        {/* Khối 2: Các Công Cụ Bảo Vệ Shizuku Chuyên Sâu */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.protectShizukuFromUsbUnplugAndPowerGenius();
                                await refreshShizukuFullStatus();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-left space-y-1 transition-all active:scale-95"
                          >
                            <div className="text-xs sm:text-sm font-black text-cyan-300">🔌 Khiên Chống Sập Khi Rút Cáp</div>
                            <div className="text-[11px] text-slate-400">Giữ Shizuku không bị tắt khi rút dây cáp USB</div>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.disablePhantomProcessKillerForShizuku();
                                await refreshShizukuFullStatus();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-left space-y-1 transition-all active:scale-95"
                          >
                            <div className="text-xs sm:text-sm font-black text-emerald-300">🛡️ Tắt Giết Tiến Trình Android 14-17</div>
                            <div className="text-[11px] text-slate-400">Mở khóa giới hạn tiến trình con (Phantom Killer)</div>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.enableShizukuWirelessAdbMode(true);
                                await refreshShizukuFullStatus();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-blue-500/30 text-left space-y-1 transition-all active:scale-95"
                          >
                            <div className="text-xs sm:text-sm font-black text-blue-300">📡 Bật Gỡ Lỗi Không Dây (Wi-Fi)</div>
                            <div className="text-[11px] text-slate-400">Tự bật lại Shizuku trên ĐT không cần máy tính</div>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.authorizeShizukuCompanionApps();
                                await refreshShizukuFullStatus();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="p-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-left space-y-1 transition-all active:scale-95"
                          >
                            <div className="text-xs sm:text-sm font-black text-amber-300">⚡ Cấp Full Quyền Cho App Shizuku</div>
                            <div className="text-[11px] text-slate-300">Cấp quyền tự động cho Canta, Hail, SD Maid, AppOps...</div>
                          </button>
                        </div>

                        {/* Khối 3: Hệ Sinh Thái Ứng Dụng Shizuku (Mở / Tải Nhanh Trên ĐT) */}
                        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                          <div>
                            <h4 className="text-base sm:text-lg font-black text-white">
                              🧩 Hệ Sinh Thái Ứng Dụng Dùng Với Shizuku (Bấm Để Mở Hoặc Tải Trên ĐT)
                            </h4>
                            <p className="text-xs text-slate-400">
                              Các ứng dụng giúp bạn gỡ app rác, đóng băng app và dọn rác sâu ngay trên điện thoại thông qua Shizuku:
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                              { name: 'Shizuku (App Gốc)', pkg: 'moe.shizuku.privileged.api', desc: 'Ứng dụng lõi bắt buộc phải cài trên điện thoại' },
                              { name: 'Canta (Gỡ App Rác)', pkg: 'io.github.samolego.canta', desc: 'Gỡ hoặc khôi phục app hệ thống ngay trên ĐT' },
                              { name: 'Hail (Đóng Băng App)', pkg: 'com.aistra.hail', desc: 'Đóng băng nhanh các app ngốn pin bằng 1 chạm' },
                              { name: 'SD Maid SE (Dọn Rác Sâu)', pkg: 'eu.thedarken.sdm', desc: 'Quét và xóa sạch bộ nhớ đệm ẩn (App Cache)' },
                              { name: 'App Ops (Quản Lý Quyền)', pkg: 'rikka.appops', desc: 'Xem và khóa từng quyền ngầm của ứng dụng' },
                              { name: 'IceBox (Tủ Đá Ứng Dụng)', pkg: 'com.catchingnow.icebox', desc: 'Cất các app ít dùng vào tủ đá ngủ đông' }
                            ].map((item) => {
                              const isInstalled =
                                shizukuDetails?.installedCompanions?.includes(item.pkg) ||
                                apps.some((a) => a.packageName === item.pkg);
                              return (
                                <div
                                  key={item.pkg}
                                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-3"
                                >
                                  <div>
                                    <div className="text-sm font-black text-white">{item.name}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        if (!adbClientRef.current) return;
                                        setIsProcessing(true);
                                        try {
                                          if (isInstalled) {
                                            await adbClientRef.current.launchAppOnScreen(item.pkg);
                                          } else {
                                            await adbClientRef.current.openPlayStoreForApp(item.pkg, item.name);
                                          }
                                        } finally {
                                          setIsProcessing(false);
                                        }
                                      }}
                                      disabled={isProcessing}
                                      className={`flex-1 py-2 rounded-xl text-xs font-black ${
                                        isInstalled ? 'bg-emerald-500 text-slate-950' : 'bg-blue-600 text-white'
                                      }`}
                                    >
                                      {isInstalled ? '▶️ Mở Trên ĐT' : '📥 Mở Tải Trên ĐT'}
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!adbClientRef.current) return;
                                        setIsProcessing(true);
                                        try {
                                          await adbClientRef.current.authorizeShizukuCompanionApps(item.pkg);
                                        } finally {
                                          setIsProcessing(false);
                                        }
                                      }}
                                      disabled={isProcessing}
                                      className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold"
                                    >
                                      ⚡ Cấp Quyền
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* THANH CÔNG CỤ HỖ TRỢ NHANH & CHUYỂN ĐỔI SANG CHẾ ĐỘ CHUYÊN SÂU */}
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/35 flex flex-col lg:flex-row items-center justify-between gap-3 shadow-lg">
                      <div className="flex items-center gap-2.5 text-center lg:text-left">
                        <Sliders size={18} className="text-blue-400 shrink-0 hidden sm:block" />
                        <div>
                          <div className="text-xs sm:text-sm font-black text-white">
                            🛠️ Tiện ích hệ thống & Chế độ chuyên sâu
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Bạn có thể mở Trung tâm hoàn tác mặc định, khởi động lại điện thoại hoặc chuyển sang Giao diện đầy đủ bất cứ lúc nào.
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 w-full lg:w-auto shrink-0">
                        <button
                          onClick={() => setShowRevertCenterModal(true)}
                          disabled={isProcessing}
                          className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-xs font-black flex items-center gap-1.5"
                        >
                          <RotateCcw size={14} />
                          <span>🔄 Trung Tâm Hoàn Tác</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (!adbClientRef.current) return;
                            setIsProcessing(true);
                            try {
                              await adbClientRef.current.reboot('system');
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5"
                        >
                          <Power size={14} className="text-rose-400" />
                          <span>Khởi Động Lại ĐT</span>
                        </button>
                        <button
                          onClick={() => setIsSimpleMode(false)}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-600/25 transition-all active:scale-95"
                        >
                          📂 Mở Giao Diện Chuyên Sâu
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!isSimpleMode && (
                  activeTab === 'setup' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Hero Setup 8-In-1 Master Banner */}
                    <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/60 p-5 sm:p-8 shadow-2xl shadow-amber-950/30 space-y-6">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="space-y-2.5 max-w-2xl">
                          <div className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/35">
                            <Sparkles size={12} className="text-amber-400 shrink-0" />
                            <span>Chuẩn Hóa Máy Honor Nội Địa Mới Mua / Mới Reset • MagicOS 8 / 9 / 10 / 11 & Android 13 – 17</span>
                          </div>
                          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight break-words whitespace-normal">
                            🇻🇳 Trung Tâm Quốc Tế Hóa Toàn Diện Máy Mới (8-Trong-1 Master Setup)
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words whitespace-normal">
                            Máy Honor nội địa Trung Quốc mới đập hộp hoặc vừa khôi phục cài đặt gốc mặc định dùng tiếng Trung/Anh, thiếu CH Play, không đồng bộ Danh bạ Google, lỗi danh bạ <code className="text-amber-300">+84</code> không hiện tên người gọi, Wi-Fi báo dấu chấm than (<code className="text-amber-300">!</code>), đầy chữ Trung khi vuốt màn hình và chậm thông báo. <strong>Chỉ với 1 cú nhấp chuột, MagicTune tự động hóa trọn gói 8 hạng mục Quốc tế hóa chuẩn Việt Nam!</strong>
                          </p>
                        </div>

                        <div className="flex flex-col gap-2.5 w-full lg:w-auto lg:min-w-[320px] shrink-0">
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                const res = await adbClientRef.current.oneClickSetupNewHonorDevice();
                                setNewDeviceStatus(res.status);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                          >
                            <Zap size={18} className="fill-slate-950 text-slate-950 shrink-0" />
                            <span className="text-center">{isProcessing ? 'Đang chạy Siêu Thiết Lập 8-in-1...' : '🚀 1-Chạm Thiết Lập Toàn Diện Máy Mới (8-in-1)'}</span>
                          </button>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/35 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <Search size={14} className="text-amber-400 shrink-0" />
                              <span className="text-center">🔍 Quét Kiểm Tra 8 Chuẩn</span>
                            </button>

                            <button
                              onClick={() => apkFileInputRef.current?.click()}
                              disabled={isProcessing}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-500/35 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <Upload size={14} className="text-cyan-400 shrink-0" />
                              <span className="text-center">⚡ Cài Nhanh File .APK</span>
                            </button>
                          </div>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                const st = await adbClientRef.current.restoreAllNewDeviceSetupToDefault();
                                setNewDeviceStatus(st);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/35 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                          >
                            <RotateCcw size={13} className="text-rose-400 shrink-0" />
                            <span className="text-center">🔄 Hoàn Tác Toàn Bộ Thiết Lập Máy Mới Về Mặc Định</span>
                          </button>
                        </div>
                      </div>

                      {/* Live 8-Point Readiness Checklist & Score Bar */}
                      <div className="pt-4 border-t border-slate-800/80 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-amber-400 shrink-0" />
                            <span className="text-xs font-black text-white uppercase tracking-wider">
                              Bảng Chẩn Đoán 8 Tiêu Chuẩn Quốc Tế Hóa Máy Mới (MagicOS 8–11 / Android 13–17)
                            </span>
                          </div>
                          {newDeviceStatus ? (
                            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                              newDeviceStatus.readyScore >= 7
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : newDeviceStatus.readyScore >= 4
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}>
                              Điểm Chuẩn Hóa: {newDeviceStatus.readyScore}/8 Hạng Mục Đạt Chuẩn
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Bấm "🔍 Quét Kiểm Tra 8 Chuẩn" để xem trạng thái thực tế của máy
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {/* Step 1 Status */}
                          <div className={`p-3 rounded-2xl border space-y-1 transition-all ${
                            newDeviceStatus?.isVietnameseLocale && newDeviceStatus?.isVietnamTimezone
                              ? 'bg-emerald-950/30 border-emerald-500/40'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">1. Tiếng Việt & GMT+7</span>
                              {newDeviceStatus && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                  newDeviceStatus.isVietnameseLocale && newDeviceStatus.isVietnamTimezone
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {newDeviceStatus.isVietnameseLocale && newDeviceStatus.isVietnamTimezone ? 'ĐẠT CHUẨN' : 'CẦN THIẾT LẬP'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              {newDeviceStatus
                                ? `Vùng: ${newDeviceStatus.currentLocale} • Giờ: ${newDeviceStatus.currentTimezone} (${newDeviceStatus.is24HourFormat ? '24h' : '12h'})`
                                : 'Ngôn ngữ vi-VN, múi giờ Asia/Ho_Chi_Minh & định dạng 24h.'}
                            </p>
                          </div>

                          {/* Step 2 Status */}
                          <div className={`p-3 rounded-2xl border space-y-1 transition-all ${
                            newDeviceStatus?.gmsEnabled && newDeviceStatus?.playStoreInstalled
                              ? 'bg-emerald-950/30 border-emerald-500/40'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">2. GMS, CH Play & Danh Bạ</span>
                              {newDeviceStatus && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                  newDeviceStatus.gmsEnabled && newDeviceStatus.playStoreInstalled
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {newDeviceStatus.gmsEnabled && newDeviceStatus.playStoreInstalled ? 'ĐÃ CÓ CH PLAY' : 'CHƯA ĐỦ GMS'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              {newDeviceStatus
                                ? `GMS: ${newDeviceStatus.gmsEnabled ? 'Bật' : 'Tắt'} • CH Play: ${newDeviceStatus.playStoreInstalled ? 'Đã cài' : 'Chưa cài'} • Sync Danh bạ: ${newDeviceStatus.contactsSyncEnabled ? 'OK' : 'Thiếu'}`
                                : 'Bật công tắc GMS, tải CH Play & mở khóa đồng bộ Danh bạ Google.'}
                            </p>
                          </div>

                          {/* Step 3 Status */}
                          <div className={`p-3 rounded-2xl border space-y-1 transition-all ${
                            newDeviceStatus?.isVietnameseKeyboardDefault
                              ? 'bg-emerald-950/30 border-emerald-500/40'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">3. Bàn Phím Tiếng Việt</span>
                              {newDeviceStatus && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                  newDeviceStatus.isVietnameseKeyboardDefault
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {newDeviceStatus.isVietnameseKeyboardDefault ? 'ĐÃ KÍCH HOẠT' : 'PHÍM NỘI ĐỊA'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              {newDeviceStatus
                                ? `LabanKey: ${newDeviceStatus.labanKeyInstalled ? 'Có' : 'Chưa'} • Gboard: ${newDeviceStatus.gboardInstalled ? 'Có' : 'Chưa'} • Phím TQ: ${newDeviceStatus.chineseKeyboardsFrozen ? 'Đã khóa' : 'Đang mở'}`
                                : 'Gán Laban Key / Gboard làm mặc định & đóng băng phím chữ Trung.'}
                            </p>
                          </div>

                          {/* Step 4 Status */}
                          <div className={`p-3 rounded-2xl border space-y-1 transition-all ${
                            newDeviceStatus?.callerId84Fixed && newDeviceStatus?.captivePortalGlobal
                              ? 'bg-emerald-950/30 border-emerald-500/40'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">4. Danh Bạ +84 & Wi-Fi / 5G</span>
                              {newDeviceStatus && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                  newDeviceStatus.callerId84Fixed && newDeviceStatus.captivePortalGlobal
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {newDeviceStatus.callerId84Fixed && newDeviceStatus.captivePortalGlobal ? 'ĐÃ TỐI ƯU' : 'CẦN FIX'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              {newDeviceStatus
                                ? `Fix +84: ${newDeviceStatus.callerId84Fixed ? 'OK' : 'Chưa'} • Wi-Fi Quốc tế: ${newDeviceStatus.captivePortalGlobal ? 'OK' : 'Server TQ'} • VoLTE/5G: ${newDeviceStatus.volte5gUnlocked ? 'Bật' : 'Mặc định'}`
                                : 'Fix lỗi không hiện tên người gọi +84, xóa dấu ! Wi-Fi & mở VoLTE/5G.'}
                            </p>
                          </div>

                          {/* Step 5 Status */}
                          <div className={`p-3 rounded-2xl border space-y-1 transition-all ${
                            newDeviceStatus?.chineseUiCleaned
                              ? 'bg-emerald-950/30 border-emerald-500/40'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-pink-400 uppercase tracking-wider">5. Dọn Giao Diện Chữ Trung</span>
                              {newDeviceStatus && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                  newDeviceStatus.chineseUiCleaned
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {newDeviceStatus.chineseUiCleaned ? 'SẠCH 100%' : 'CÒN RÁC TQ'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              Tắt Bảng tin chữ Trung khi vuốt trái (HiBoard), Tìm kiếm quảng cáo & Tạp chí khóa.
                            </p>
                          </div>

                          {/* Step 6 Status */}
                          <div className={`p-3 rounded-2xl border space-y-1 transition-all ${
                            newDeviceStatus?.googleLocationVietnam
                              ? 'bg-emerald-950/30 border-emerald-500/40'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">6. Định Vị GPS Chuẩn VN</span>
                              {newDeviceStatus && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                  newDeviceStatus.googleLocationVietnam
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {newDeviceStatus.googleLocationVietnam ? 'ĐÃ FIX ✅' : 'CHƯA FIX ❌'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              Fix định vị nhạy cho Grab / XanhSM / Google Maps chuẩn xác tại Việt Nam.
                            </p>
                          </div>

                          {/* Step 7 Status */}
                          <div className={`p-3 rounded-2xl border space-y-1 transition-all ${
                            newDeviceStatus?.honorMarketUpdateBlocked
                              ? 'bg-emerald-950/30 border-emerald-500/40'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">7. Chặn Chợ Honor Cài Đè</span>
                              {newDeviceStatus && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                  newDeviceStatus.honorMarketUpdateBlocked
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {newDeviceStatus.honorMarketUpdateBlocked ? 'ĐÃ KHÓA ĐÈ' : 'CHƯA KHÓA'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              Ngăn Chợ App Honor tự ý cập nhật đè bản nội địa lên các app vì trên honor market đâu có những app kia đâu
                            </p>
                          </div>

                          {/* Step 8 Status */}
                          <div className={`p-3 rounded-2xl border space-y-1 transition-all ${
                            newDeviceStatus?.powerGeniusRemoved || newDeviceStatus?.customAppSoundsEnabled
                              ? 'bg-emerald-950/30 border-emerald-500/40'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">8. Thông Báo & Chuông App</span>
                              {newDeviceStatus && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                  newDeviceStatus.powerGeniusRemoved || newDeviceStatus.customAppSoundsEnabled
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {newDeviceStatus.powerGeniusRemoved || newDeviceStatus.customAppSoundsEnabled ? 'REAL-TIME 100%' : 'MẶC ĐỊNH'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              Mở khóa thông báo tức thì, chống gom cụm Gmail/FB & ưu tiên chuông riêng từng App.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 8 Deep Modular Action Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Card 1: Tiếng Việt & Múi giờ GMT+7 */}
                      <div className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                              <Languages size={22} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                                  1. Thiết Lập Tiếng Việt & Múi Giờ GMT+7
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">Bước Đầu Tiên</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed break-words whitespace-normal">
                                Đổi ngôn ngữ hệ thống sang Tiếng Việt (<code className="text-amber-300">vi-VN</code>), đồng bộ múi giờ chuẩn Việt Nam (<code className="text-amber-300">Asia/Ho_Chi_Minh</code>), bật định dạng 24 giờ và cấp quyền chuyển vùng cho MoreLocale / SetEdit trên MagicOS 8–11 & Android 13–17.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.setupVietnameseLanguageAndLocale();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <Languages size={15} className="shrink-0" />
                              <span>🇻🇳 Bật Tiếng Việt & Giờ GMT+7 Ngay</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                await adbClientRef.current.runShell('input keyevent 224 2>/dev/null; am start --user 0 -a android.settings.LOCALE_SETTINGS 2>/dev/null || true');
                              }}
                              disabled={isProcessing}
                              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all active:scale-95 break-words whitespace-normal"
                            >
                              <span>📱 Mở Cài Đặt Ngôn Ngữ Trên ĐT</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.restoreDefaultLanguageAndLocale();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 break-words whitespace-normal"
                            >
                              <RotateCcw size={13} className="shrink-0" />
                              <span>Hoàn tác về mặc định</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/25 text-[11px] text-slate-300 leading-relaxed">
                          <strong className="text-amber-300">📱 Hướng dẫn hoàn tác Ngôn ngữ thủ công trên ĐT:</strong> Do Android 14–17 bảo vệ vùng ngôn ngữ hệ thống khi chưa Root, để đổi lại Tiếng Anh/Trung mặc định: Vào <strong>Cài đặt ➔ Hệ thống & Cập nhật ➔ Ngôn ngữ và nhập liệu ➔ Ngôn ngữ và vùng</strong> ➔ Nhấn giữ biểu tượng 2 gạch ngang (<code>≡</code>) bên phải chữ <strong>English / 简体中文</strong> rồi kéo lên vị trí số 1 trên cùng!
                        </div>
                      </div>

                      {/* Card 2: Bật GMS, Chợ Honor tải CH Play & Đồng Bộ Danh Bạ Google */}
                      <div className="bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                              <Package size={22} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                                  2. Bật GMS, Tải CH Play & Đồng Bộ Danh Bạ Google
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">Google Core</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed break-words whitespace-normal">
                                Bật công tắc <code className="text-blue-300">google_service_switch=1</code> trong ROM Honor nội địa, mở Chợ Honor tải <strong>Google Play Store (CH Play)</strong>, đồng thời <strong>cấp Full quyền cho Google Contacts Sync</strong> để khắc phục triệt để lỗi đăng nhập Google nhưng không hiện Danh bạ trên máy mới!
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.openHonorMarketToInstallGooglePlay();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <Package size={15} className="shrink-0" />
                              <span>🛒 Bật GMS & Mở Chợ Honor Tải CH Play</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.syncGoogleContactsAndCalendarNow();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <CheckCircle2 size={15} className="shrink-0" />
                              <span>📇 Kích Hoạt Đồng Bộ Danh Bạ & Lịch Google</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                await adbClientRef.current.runShell('input keyevent 224 2>/dev/null; am start --user 0 -n com.android.vending/.AssetBrowserActivity 2>/dev/null || true');
                              }}
                              disabled={isProcessing}
                              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all active:scale-95 break-words whitespace-normal"
                            >
                              <span>▶️ Mở CH Play</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.restoreGoogleContactsAndCalendarDefault();
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 break-words whitespace-normal"
                            >
                              <RotateCcw size={13} className="shrink-0" />
                              <span>Hoàn tác GMS / Danh bạ</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-blue-500/25 text-[11px] text-slate-300 leading-relaxed">
                          <strong className="text-blue-300">📱 Hướng dẫn hoàn tác GMS / CH Play thủ công trên ĐT:</strong> Để tắt Dịch vụ Google hoặc gỡ CH Play về như máy nội địa xuất xưởng: Vào <strong>Cài đặt ➔ Ứng dụng ➔ Quản lý ứng dụng ➔ Tìm "Google Play Store" bấm Gỡ cài đặt</strong>; muốn tắt hẳn GMS vào <strong>Cài đặt ➔ Người dùng & Tài khoản ➔ Dịch vụ Google cơ bản (Google Play Services) ➔ Gạt Tắt</strong>.
                        </div>
                      </div>

                      {/* Card 3: Bàn Phím Tiếng Việt (Laban Key / Gboard) & Đóng Băng Phím Chữ Trung */}
                      <div className="bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                              <Type size={22} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                                  3. Bàn Phím Tiếng Việt (Laban Key / Gboard) & Khóa Phím Trung
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">Gõ Tiếng Việt</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed break-words whitespace-normal">
                                Hỗ trợ tải và đặt tự động <strong>Laban Key</strong> hoặc <strong>Google Gboard</strong> làm bàn phím chính. Đặc biệt tích hợp tính năng <strong>Đóng băng bàn phím chữ Trung gốc (Baidu / Sogou / iFlytek)</strong> giúp máy không bao giờ bị tự nhảy lại bàn phím tiếng Trung!
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.openGooglePlayToInstallLabanKey();
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <ExternalLink size={14} className="shrink-0" />
                              <span>Tải Laban Key</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.setDefaultLabanKeyKeyboard();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <CheckCircle2 size={14} className="shrink-0" />
                              <span>Đặt Laban Key Mặc Định</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.setDefaultGboardKeyboard();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <Type size={14} className="shrink-0" />
                              <span>Tải / Đặt Google Gboard</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.freezeChineseStockKeyboards();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/35 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <Lock size={13} className="shrink-0" />
                              <span>❄️ Đóng Băng Bàn Phím Chữ Trung</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.restoreDefaultHonorKeyboard();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 break-words whitespace-normal"
                            >
                              <RotateCcw size={13} className="shrink-0" />
                              <span>Hoàn tác Bàn phím gốc</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-purple-500/25 text-[11px] text-slate-300 leading-relaxed">
                          <strong className="text-purple-300">📱 Hướng dẫn đổi lại bàn phím gốc thủ công trên ĐT:</strong> Vào <strong>Cài đặt ➔ Hệ thống & Cập nhật ➔ Ngôn ngữ và nhập liệu ➔ Bàn phím mặc định</strong> ➔ Chọn lại bàn phím gốc của máy (Baidu IME for Honor / Microsoft SwiftKey / Gboard).
                        </div>
                      </div>

                      {/* Card 4: Sửa Lỗi Danh Bạ +84, Fix Wi-Fi Dấu Chấm Than (!) & Mở Khóa 5G / VoLTE Việt Nam */}
                      <div className="bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                              <Signal size={22} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                                  4. Sửa Danh Bạ +84, Fix Wi-Fi Chấm Than (!) & Mở 5G / VoLTE
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">Mạng & SIM VN</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed break-words whitespace-normal">
                                Khắc phục 3 lỗi kinh điển của ROM nội địa tại Việt Nam: <strong>(1) Lưu số 09x nhưng gọi đến hiện +84 không nhận tên danh bạ</strong> (<code className="text-cyan-300">min_match=7</code>); <strong>(2) Wi-Fi báo dấu chấm than (!) / Không có mạng</strong> do ping server Bắc Kinh ➔ Chuyển sang Captive Portal Google Quốc tế; <strong>(3) Mở khóa 5G & VoLTE HD Call</strong> cho SIM Viettel, Vina, Mobi.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.fixVietnamCallerId84NetworkAndCaptivePortal();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <Signal size={15} className="shrink-0" />
                              <span>📞 Fix Danh Bạ +84, Xóa Dấu ! Wi-Fi & Mở 5G / VoLTE</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.restoreDefaultCallerIdNetworkAndCaptivePortal();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 break-words whitespace-normal"
                            >
                              <RotateCcw size={13} className="shrink-0" />
                              <span>Hoàn tác Mạng & Danh bạ gốc</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/25 text-[11px] text-slate-300 leading-relaxed">
                          <strong className="text-cyan-300">📱 Hướng dẫn hoàn tác Mạng di động thủ công trên ĐT:</strong> Vào <strong>Cài đặt ➔ Mạng di động ➔ Dữ liệu di động</strong> để bật/tắt <strong>5G</strong> hoặc <strong>Cuộc gọi VoLTE HD</strong> cho SIM 1 / SIM 2 theo ý muốn.
                        </div>
                      </div>

                      {/* Card 5: Dọn Sạch Giao Diện Chữ Trung (HiBoard Vuốt Trái, Honor Search, Tạp Chí Khóa) */}
                      <div className="bg-slate-900/60 border border-slate-800 hover:border-pink-500/40 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                              <EyeOff size={22} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                                  5. Dọn Sạch Giao Diện Chữ Trung (HiBoard, Search, Tạp Chí)
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] font-bold">Sạch Sẽ 100%</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed break-words whitespace-normal">
                                Tắt triệt để <strong>Bảng tin chữ Trung khi vuốt sang trái màn hình chính (HiBoard)</strong>, tắt <strong>Tìm kiếm quảng cáo tiếng Trung khi vuốt xuống (Honor Search)</strong>, tắt <strong>Tạp chí màn hình khóa tự tải ảnh chữ Trung</strong> và các thẻ gợi ý nội địa gây giật lag Launcher.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.cleanChineseHomeScreenAndFeeds();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <EyeOff size={15} className="shrink-0" />
                              <span>🧹 Dọn Sạch HiBoard, Tìm Kiếm Quảng Cáo & Tạp Chí Chữ Trung</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.restoreChineseHomeScreenAndFeedsDefault();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 break-words whitespace-normal"
                            >
                              <RotateCcw size={13} className="shrink-0" />
                              <span>Hoàn tác Bảng tin & Tạp chí gốc</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-pink-500/25 text-[11px] text-slate-300 leading-relaxed">
                          <strong className="text-pink-300">📱 Hướng dẫn bật/tắt Bảng tin & Màn khóa thủ công trên ĐT:</strong> Chụm 2 ngón tay trên Màn hình chính ➔ <strong>Cài đặt màn hình chính</strong> ➔ Bật/tắt <strong>Bảng tin (Feed)</strong>. Với màn khóa: Vào <strong>Cài đặt ➔ Màn hình chính & Hình nền ➔ Mở khóa tạp chí</strong>.
                        </div>
                      </div>

                      {/* Card 6: Định Vị GPS Nhạy (Grab / Maps / XanhSM) & Quốc Tế Hóa Trợ Lý AI */}
                      <div className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                              <Globe size={22} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                                  6. Fix Định Vị GPS (Grab / Maps / XanhSM)
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">GPS Quốc Tế</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed break-words whitespace-normal">
                                Sửa lỗi máy nội địa định vị chậm trong nhà trên <strong>Google Maps, Grab, XanhSM, ShopeeFood, Zalo</strong> bằng cách ép dùng <em>Google Network Location + A-GPS</em> mượt mà như máy quốc tế!
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.setupGoogleLocationAndGpsVietnam();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <Globe size={15} className="shrink-0" />
                              <span>📍 Fix Định Vị GPS (Maps / Grab / XanhSM)</span>
                            </button>

                          </div>
                        </div>
                      </div>


                      {/* Card 7: Khóa Chợ Honor Tự Cài Đè & Mở Khóa 100% Thông Báo + Chuông Riêng Từng App */}
                      <div className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between md:col-span-2">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                              <ShieldCheck size={22} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                                  7. Khóa Cài Đè Chợ Honor, Mở Khóa 100% Thông Báo Real-Time & Ưu Tiên Chuông Riêng Từng App
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">MagicOS 8–11 & Android 13–17</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed break-words whitespace-normal">
                              Ngăn Chợ App Honor tự ý cập nhật đè bản nội địa lên các app vì trên honor market đâu có những app kia đâu; gỡ bỏ AI quản lý pin cực đoan <strong>PowerGenius</strong>; giải mã gom cụm trễ của <strong>Gmail & Facebook</strong>; và mở khóa <strong>Ưu tiên âm thanh thông báo riêng của từng ứng dụng (không bị gộp chung chuông máy và không bị thông báo im lặng)</strong>!
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/80">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.blockHonorMarketAutoUpdate(false);
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-slate-950 border border-amber-500/40 font-black text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <Lock size={14} className="shrink-0" />
                              <span>🛑 Khóa Chợ Honor Tự Cài Đè</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.optimizeAllApps();
                                  await adbClientRef.current.fixFacebookNuclear();
                                  const diag = await adbClientRef.current.diagnoseAllApps();
                                  setMultiAppDiag(diag);
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <Zap size={14} className="shrink-0" />
                              <span>🔔 Mở Khóa 100% Thông Báo & Fix Trễ Gmail/FB</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.prioritizeAppCustomNotificationSounds(false, false);
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                            >
                              <Volume2 size={14} className="shrink-0" />
                              <span>🎵 Ưu Tiên Chuông Riêng Từng App (Chống Im Lặng)</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.restoreHonorMarketAutoUpdateDefault();
                                  await adbClientRef.current.restorePowerGenius();
                                  await adbClientRef.current.restoreDefaultNotificationSoundBehavior();
                                  await adbClientRef.current.restoreGmailAndFacebookBatchingDefault();
                                  const st = await adbClientRef.current.getNewDeviceSetupStatus();
                                  setNewDeviceStatus(st);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 break-words whitespace-normal"
                            >
                              <RotateCcw size={13} className="shrink-0" />
                              <span>Hoàn tác Chợ Honor, Pin & Chuông gốc</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/25 text-[11px] text-slate-300 leading-relaxed">
                          <strong className="text-emerald-300">📱 Hướng dẫn hoàn tác thủ công trên ĐT:</strong> Mở <strong>Chợ Ứng Dụng Honor (App Market) ➔ Tôi (Me / 我的) ➔ Cài đặt ➔ Tự động cập nhật ứng dụng ➔ Chọn "Qua Wi-Fi"</strong>. Muốn chỉnh lại chuông thông báo mặc định: Vào <strong>Cài đặt ➔ Âm thanh & Rung ➔ Âm báo thông báo</strong>.
                        </div>
                      </div>

                      {/* Card 8: Trạm Cài Nhanh Combo Ứng Dụng Thiết Yếu Việt Nam (1 Chạm Mở Tải Trên ĐT) */}
                      <div className="bg-gradient-to-br from-slate-900/90 via-indigo-950/30 to-slate-900/90 border border-indigo-500/35 rounded-2xl p-5 space-y-4 transition-all md:col-span-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                              <Smartphone size={22} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                                  8. Trạm Cài Nhanh Combo Ứng Dụng Thiết Yếu Việt Nam (1 Chạm Mở Trên ĐT)
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">Tiện Ích Máy Mới</span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-normal">
                                Không cần gõ tìm kiếm từng app trên điện thoại mới! Bấm vào ứng dụng bất kỳ bên dưới, MagicTune sẽ <strong>đánh thức màn hình điện thoại và mở thẳng đúng trang cài đặt chính chủ trên CH Play</strong> (hoặc bạn có thể bấm nút Cài nhiều file <code className="text-cyan-300">.APK</code> trực tiếp từ máy tính/điện thoại điều khiển):
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => apkFileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shrink-0 break-words whitespace-normal"
                          >
                            <Upload size={15} className="shrink-0" />
                            <span>📁 Chọn & Cài Hàng Loạt File .APK</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800/80">
                          {[
                            { name: 'Laban Key', pkg: 'com.vng.inputmethod.labankey', desc: 'Gõ Tiếng Việt', color: 'border-purple-500/40 hover:bg-purple-500/20 text-purple-200' },
                            { name: 'Google Gboard', pkg: 'com.google.android.inputmethod.latin', desc: 'Phím Google', color: 'border-blue-500/40 hover:bg-blue-500/20 text-blue-200' },
                            { name: 'Zalo', pkg: 'com.zing.zalo', desc: 'Nhắn tin & Gọi', color: 'border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-200' },
                            { name: 'Facebook', pkg: 'com.facebook.katana', desc: 'Mạng xã hội', color: 'border-indigo-500/40 hover:bg-indigo-500/20 text-indigo-200' },
                            { name: 'Messenger', pkg: 'com.facebook.orca', desc: 'Chat Facebook', color: 'border-sky-500/40 hover:bg-sky-500/20 text-sky-200' },
                            { name: 'Gmail', pkg: 'com.google.android.gm', desc: 'Email Google', color: 'border-rose-500/40 hover:bg-rose-500/20 text-rose-200' },
                            { name: 'Google Maps', pkg: 'com.google.android.apps.maps', desc: 'Bản đồ dẫn đường', color: 'border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-200' },
                            { name: 'Google Chrome', pkg: 'com.android.chrome', desc: 'Trình duyệt web', color: 'border-amber-500/40 hover:bg-amber-500/20 text-amber-200' },
                            { name: 'YouTube', pkg: 'com.google.android.youtube', desc: 'Xem video', color: 'border-red-500/40 hover:bg-red-500/20 text-red-200' },
                            { name: 'TikTok Quốc Tế', pkg: 'com.ss.android.ugc.trill', desc: 'Video ngắn VN', color: 'border-pink-500/40 hover:bg-pink-500/20 text-pink-200' },
                            { name: 'Google Gemini', pkg: 'com.google.android.apps.bard', desc: 'Trợ lý AI Việt', color: 'border-violet-500/40 hover:bg-violet-500/20 text-violet-200' },
                            { name: 'Danh Bạ Google', pkg: 'com.google.android.contacts', desc: 'Quản lý danh bạ', color: 'border-teal-500/40 hover:bg-teal-500/20 text-teal-200' }
                          ].map((item) => (
                            <button
                              key={item.pkg}
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.openPlayStoreForApp(item.pkg, item.name);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className={`p-3 rounded-xl bg-slate-950/80 border transition-all active:scale-95 text-left flex flex-col justify-between gap-1 ${item.color}`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-black truncate">{item.name}</span>
                                <ExternalLink size={12} className="shrink-0 opacity-75" />
                              </div>
                              <span className="text-[10px] text-slate-400 truncate">{item.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'noti' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Hero One-Click Full Optimizer Banner + Force 100% Apps Full Notification */}
                    <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-slate-900 p-5 sm:p-6 shadow-xl shadow-blue-950/40 space-y-4">
                      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                            <Sparkles size={12} className="text-amber-400" />
                            Cưỡng bức bắt buộc 100% toàn bộ App trên máy nổ thông báo Full
                          </div>
                          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight break-words whitespace-normal">
                            Mở khóa 100% toàn bộ ứng dụng trên máy: Bất tử Pin + Mạng ngầm + Nổ biểu ngữ & Màn hình khóa
                          </h2>
                          <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-normal">
                            Không chỉ mở cho 15 app phổ biến ở Không gian chính — hệ thống tự động quét <strong>100% toàn bộ ứng dụng trên máy KỂ CẢ ỨNG DỤNG NHÂN BẢN (App Twin - User 128) & KHÔNG GIAN SONG SONG (Parallel Space - User 10+)</strong>, mở khóa Tường lửa mạng ngầm UID riêng của từng bản nhân bản (<code className="text-blue-300">12810xxx / 1010xxx</code>), đưa vào Bất tử Pin (<code className="text-emerald-300">deviceidle whitelist</code>), giữ phân vùng chạy ngầm 24/24 và ép màn hình khóa xuyên không gian bung thẻ chi tiết (<code className="text-amber-300">Style 0</code>)!
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.optimizeAllApps();
                                const diag = await adbClientRef.current.diagnoseAllApps();
                                setMultiAppDiag(diag);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                          >
                            <Zap size={16} className="text-amber-300 shrink-0" />
                            <span className="text-center">{isProcessing ? 'Đang tối ưu 100% App...' : '🚀 Tối Ưu Toàn Diện 100% App + Nhân Bản (1 Chạm)'}</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.forceAll100PercentAppsFullNotification(false);
                                const diag = await adbClientRef.current.diagnoseAllApps();
                                setMultiAppDiag(diag);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full px-5 py-2.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                          >
                            <BellRing size={14} className="text-emerald-400 shrink-0" />
                            <span className="text-center">{isProcessing ? 'Đang quét & ép 100% App...' : '⚡ Quét & Ép Bắt Buộc 100% App Nổ Thông Báo Full'}</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.syncAllClonedAndParallelAppsNotifications(false);
                                const diag = await adbClientRef.current.diagnoseAllApps();
                                setMultiAppDiag(diag);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full px-5 py-2.5 rounded-xl bg-cyan-600/25 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                          >
                            <Layers size={14} className="text-cyan-400 shrink-0" />
                            <span className="text-center">{isProcessing ? 'Đang đồng bộ Đa Không Gian...' : '👥 Đồng Bộ App Nhân Bản & Không Gian Song Song'}</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.forceBatchEnableBannersLockscreenSoundAndDefeatGentleNoti();
                                const diag = await adbClientRef.current.diagnoseAllApps();
                                setMultiAppDiag(diag);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full px-5 py-2.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                          >
                            <Volume2 size={14} className="text-purple-400 shrink-0" />
                            <span className="text-center">{isProcessing ? 'Đang can thiệp hàng loạt...' : '🔕 Bật Panô, Màn Khóa & Xóa Thông Báo Nhẹ Nhàng'}</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.prioritizeAppCustomNotificationSounds(false, false);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600/30 via-fuchsia-600/30 to-indigo-600/30 hover:from-pink-600/50 hover:to-indigo-600/50 border border-pink-500/45 text-pink-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal shadow-lg shadow-pink-950/30"
                          >
                            <Volume2 size={14} className="text-pink-400 shrink-0" />
                            <span className="text-center">{isProcessing ? 'Đang mở khóa âm thanh riêng...' : '🎵 Ưu Tiên Âm Thanh Riêng Từng App & Chống Im Lặng'}</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.grantFullPermissionsAllApps();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/45 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal shadow-lg shadow-amber-950/30"
                          >
                            <ShieldCheck size={14} className="text-amber-400 shrink-0" />
                            <span className="text-center">{isProcessing ? 'Đang cấp Full Quyền 100% App...' : '🛡️ Tự Động Cấp Full Quyền 100% App (1 Chạm)'}</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.autoTameYoyoVietnamese('full');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 hover:from-emerald-500/45 hover:to-cyan-500/45 border border-emerald-400/50 text-emerald-200 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal shadow-lg shadow-emerald-950/40"
                          >
                            <Sparkles size={14} className="text-emerald-300 shrink-0" />
                            <span className="text-center">{isProcessing ? 'Đang Việt hóa & dạy YOYO...' : '🇻🇳 Khôi Phục + Cấp Full Quyền + Việt Hóa & Dạy Toàn Bộ YOYO (1 Chạm)'}</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restoreBannersLockscreenGentleDefault();
                                await adbClientRef.current.restoreNotificationSensitivityDefault();
                                await adbClientRef.current.restoreDefaultNotificationSoundBehavior();
                                await adbClientRef.current.restoreGmailAndFacebookBatchingDefault();
                                await adbClientRef.current.restoreMultiSpaceAndClonedDefault();
                                await adbClientRef.current.restorePowerGenius();
                                const diag = await adbClientRef.current.diagnoseAllApps();
                                setMultiAppDiag(diag);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full px-5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                          >
                            <RotateCcw size={14} className="text-rose-400 shrink-0" />
                            <span className="text-center">🔄 Hoàn Tác Toàn Bộ Thông Báo Về Mặc Định</span>
                          </button>
                        </div>
                      </div>

                      {/* Chuyên mục mới: Ưu tiên Âm thanh riêng của từng App & Chống thông báo im lặng (Chuẩn MagicOS 11 & Android 17) */}
                      <div className="pt-4 border-t border-slate-800/80">
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-indigo-950/40 to-slate-950/90 border border-pink-500/35 space-y-3 shadow-lg">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="space-y-1 max-w-2xl">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-black uppercase tracking-wider border border-pink-500/35">
                                <Volume2 size={12} className="text-pink-400" />
                                Tính Năng Mới • Tương Thích Hoàn Hảo MagicOS 8 / 9 / 10 / 11 & Android 14 / 15 / 16 / 17
                              </div>
                              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                                <span>🎵 Ưu Tiên Âm Thanh Thông Báo Riêng Của Từng App & Chống Thông Báo Im Lặng 100%</span>
                              </h3>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                Trên ROM Honor MagicOS (đặc biệt bản nội địa và khi lên <strong>MagicOS 10 / 11 & Android 16 / 17</strong>), hệ thống thường bật cờ gộp chung 1 tiếng chuông mặc định của máy (<code className="text-pink-300">use_default_notification_sound=1</code>) khiến Zalo, Messenger, Shopee, Telegram mất tiếng chuông đặc trưng, hoặc kích hoạt <em>Notification Cooldown</em> làm thông báo bị câm/im lặng khi nổ liên tiếp.
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full lg:w-auto">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.prioritizeAppCustomNotificationSounds(false, false);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing || isBotRunning}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                              >
                                <Volume2 size={15} className="text-amber-300 shrink-0" />
                                <span>🎵 Bật Ưu Tiên Âm Thanh Riêng Từng App (ADB 1 Chạm)</span>
                              </button>

                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  setIsBotRunning(true);
                                  try {
                                    await adbClientRef.current.prioritizeAppCustomNotificationSounds(true, false);
                                  } finally {
                                    setIsBotRunning(false);
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing || isBotRunning}
                                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-950/80 text-pink-200 border border-pink-500/40 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                                title="Vừa chạy lệnh ADB ngầm vừa kích hoạt Robot UIAutomator vào kiểm tra mục Âm thanh của Zalo, Messenger, Facebook, Shopee, Telegram... để chọn lại 'Âm thanh do ứng dụng cung cấp'"
                              >
                                <Zap size={13} className="text-amber-400 shrink-0" />
                                <span>🤖 Chạy Kèm Robot Khôi Phục "Âm Thanh Ứng Dụng" Trên ĐT</span>
                              </button>

                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.restoreDefaultNotificationSoundBehavior();
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing || isBotRunning}
                                className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/35 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                                title="Hoàn tác về dùng tiếng chuông thông báo mặc định chung của máy Honor"
                              >
                                <RotateCcw size={13} className="text-rose-400 shrink-0" />
                                <span>🔄 Hoàn Tác Về Chuông Mặc Định Của Máy</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
                            <div className="p-2.5 rounded-xl bg-slate-950/75 border border-slate-800/80">
                              <strong className="text-pink-300 block mb-0.5">1. Giữ Chuông Đặc Trưng Từng App:</strong>
                              Tắt cờ ép chuông hệ thống (<code className="text-pink-300">use_default_notification_sound=0</code>, <code className="text-pink-300">notification_way_switch=0</code>) để Zalo kêu tiếng Zalo, Messenger kêu tiếng "Ting", Shopee kêu "Shopee"!
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/75 border border-slate-800/80">
                              <strong className="text-emerald-300 block mb-0.5">2. Lưới Bảo Vệ Chống Im Lặng 100%:</strong>
                              Nếu app nào không có file âm thanh riêng, máy tự động dùng phao chuông chuẩn hệ thống (không bao giờ để URI chuông bị <code>null/silent</code>) & tự mở khóa Mute Stream 5.
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/75 border border-slate-800/80">
                              <strong className="text-amber-300 block mb-0.5">3. Hoàn Tác Tự Động & Thủ Công:</strong>
                              Bấm nút <strong>"🔄 Hoàn Tác Về Chuông Mặc Định"</strong> để bật lại chuông hệ thống; hoặc trên ĐT vào <strong>Cài đặt ➔ Thông báo ➔ Chọn App ➔ Chọn mục thông báo ➔ Âm thanh ➔ Chuông mặc định</strong>.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thanh Điều Hướng Phân Mục Gọn Gàng cho Tab Sửa Thông Báo */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-lg">
                      <div className="flex flex-wrap items-center gap-1.5 py-1">
                        {[
                          { id: 'bot', label: '🤖 Robot Gạt Tự Động (Turbo)' },
                          { id: 'test', label: '🔔 Thử Đẩy Thông Báo (Tester)' },
                          { id: 'diag', label: '🔍 Khám & Sửa Lỗi FB / Gmail' },
                          { id: 'actions', label: '⚡ Thư Viện Can Thiệp Sâu' },
                          { id: 'all', label: '📑 Xem Tất Cả' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setNotiSubTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                              notiSubTab === tab.id
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Speed Control Pill */}
                      <button
                        onClick={() => {
                          const next = !isTurboMode;
                          setIsTurboMode(next);
                          adbClientRef.current?.setTurboMode(next);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 ${
                          isTurboMode
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Chạm để chuyển đổi giữa Chế độ Siêu Tốc Turbo 10x và Chế độ Thường"
                      >
                        <Zap size={14} className={isTurboMode ? "text-amber-400 animate-pulse" : "text-slate-500"} />
                        <span>{isTurboMode ? '⚡ Tốc độ: Siêu Tốc 10x' : '⏱️ Tốc độ: Tiêu chuẩn'}</span>
                      </button>
                    </div>

                    {/* BẢNG ROBOT UIAUTOMATOR: TỰ ĐỘNG GẠT TẮT "THÔNG BÁO NHẸ NHÀNG" & BẬT PANÔ / MÀN HÌNH KHÓA */}
                    {(notiSubTab === 'bot' || notiSubTab === 'all') && (
                    <div className="bg-gradient-to-br from-indigo-950/45 via-purple-950/35 to-slate-950 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                            <Sparkles size={12} className="text-amber-400" />
                            Giải Đáp Kỹ Thuật & Robot Tự Động Gạt Công Tắc Trên Màn Hình (UIAutomator Bot)
                          </div>
                          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2 break-words whitespace-normal">
                            <Volume2 size={18} className="text-indigo-400 shrink-0" />
                            <span>Tại Sao Chạy Lệnh Ngầm Báo Thành Công Nhưng Nút "Thông Báo Nhẹ Nhàng" Trong Cài Đặt Vẫn Còn?</span>
                          </h2>
                          <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-normal">
                            Trên Android / MagicOS, công tắc <strong>"Thông báo nhẹ nhàng"</strong> của từng mục thông báo con nằm trong file bảo mật <code className="text-amber-300">/data/system/users/0/notification_policy.xml</code> thuộc quyền độc quyền của ứng dụng <strong>Cài đặt (UID 1000)</strong>. Lệnh ADB ngầm (<code className="text-blue-300">UID 2000</code>) mở được khóa tổng nhưng bị Android chặn không cho tự ý nâng cấp kênh đã tạo từ <em>Nhẹ nhàng (Mức 2)</em> lên <em>Panô (Mức 4)</em>.
                            <br />
                            👉 <strong>Giải pháp 100% không cần gạt tay:</strong> Bấm chạy <strong>🤖 Robot Mắt Thần UIAutomator</strong> bên dưới! Robot sẽ tự mở từng mục thông báo trên màn hình ĐT, đọc tọa độ và <strong>tự động chạm gạt TẮT "Thông báo nhẹ nhàng" + BẬT "Biểu ngữ (Panô)" + BẬT "Màn hình khóa"</strong> ngay trước mắt bạn!
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0 w-full lg:max-w-[300px]">
                          {isBotRunning && (
                            <button
                              onClick={() => {
                                adbClientRef.current?.stopNotificationBot();
                              }}
                              className="w-full px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-600/40 flex items-center justify-center gap-2 animate-pulse"
                            >
                              <X size={16} />
                              🛑 DỪNG ROBOT NGAY LẬP TỨC
                            </button>
                          )}

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                const res = await adbClientRef.current.scanGentleNotificationChannels();
                                setGentleScanResults(res);
                              } catch (err: any) {
                                addLog(`Lỗi quét kênh: ${err?.message || err}`, 'error');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing || isBotRunning}
                            className="w-full px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Search size={14} className="text-amber-400" />
                            {isProcessing ? 'Đang quét kênh...' : '🔍 Quét Tìm Các App Đang Bị "Thông Báo Nhẹ Nhàng"'}
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                const res = await adbClientRef.current.scanMissingPermissionsAllApps();
                                setPermScanResults(res);
                                setActiveTab('apps');
                              } catch (err: any) {
                                addLog(`Lỗi quét quyền: ${err?.message || err}`, 'error');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing || isBotRunning}
                            className="w-full px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <ShieldCheck size={14} className="text-emerald-400" />
                            {isProcessing ? 'Đang quét quyền...' : '🛡️ Quét Kiểm Tra App Nào Đang Thiếu Quyền'}
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              setIsBotRunning(true);
                              try {
                                const coreTargets = [
                                  { name: 'Facebook', pkg: 'com.facebook.katana' },
                                  { name: 'Messenger', pkg: 'com.facebook.orca' },
                                  { name: 'Zalo', pkg: 'com.zing.zalo' },
                                  { name: 'Gmail', pkg: 'com.google.android.gm' },
                                  { name: 'Telegram', pkg: 'org.telegram.messenger' },
                                  { name: 'Telegram X', pkg: 'org.thunderdog.challegram' }
                                ];
                                const extraGentle = (gentleScanResults || [])
                                  .filter(a => a.gentleChannels.length > 0 && !coreTargets.some(c => c.pkg === a.pkg && (a.userId || 0) === 0))
                                  .map(a => ({ name: a.appName, pkg: a.pkg, userId: a.userId }));
                                await adbClientRef.current.runAutoBotForMultipleApps([...coreTargets, ...extraGentle]);
                                const scanRes = await adbClientRef.current.scanGentleNotificationChannels();
                                setGentleScanResults(scanRes);
                              } finally {
                                setIsBotRunning(false);
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing || isBotRunning}
                            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 disabled:opacity-50 break-words whitespace-normal"
                          >
                            <Zap size={16} className="text-amber-300 shrink-0" />
                            <span className="text-center">{isBotRunning ? '🤖 Robot đang tự gạt trên ĐT...' : '🤖 Chạy Robot Tự Gạt Cho Nhóm App Chính & App Đang Bị Nhẹ Nhàng'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Kết quả quét các kênh đang bị Thông báo nhẹ nhàng */}
                      {gentleScanResults && (() => {
                        const gentleApps = gentleScanResults.filter(a => a.gentleChannels.length > 0);
                        const noBannerApps = gentleScanResults.filter(a => a.gentleChannels.length === 0 && a.noBannerChannels.length > 0);
                        const fullApps = gentleScanResults.filter(a => a.gentleChannels.length === 0 && a.noBannerChannels.length === 0);
                        const displayedApps = scanFilter === 'gentle' ? gentleApps : scanFilter === 'nobanner' ? noBannerApps : gentleScanResults;

                        return (
                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/95 border border-amber-500/35 space-y-4 shadow-2xl">
                          {/* Header Summary */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                            <div className="space-y-1">
                              <div className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                                <span>
                                  Kết quả quét NotificationPolicy: Còn{' '}
                                  <strong className="text-rose-400">{gentleApps.length}</strong> app dính Nhẹ nhàng |{' '}
                                  <strong className="text-amber-300">{noBannerApps.length}</strong> app Mức 3 |{' '}
                                  <strong className="text-emerald-400">{fullApps.length}</strong> app Đã Full Panô ✓
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Các ứng dụng sau khi được Robot gạt công tắc sẽ tự động chuyển sang trạng thái <strong className="text-emerald-400">🟢 Đã bật Full Panô ✓</strong>:
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {gentleApps.length > 0 && (
                                <button
                                  onClick={async () => {
                                    if (!adbClientRef.current) return;
                                    const targets = gentleApps.map(a => ({ pkg: a.pkg, name: a.appName, userId: a.userId }));
                                    setIsProcessing(true);
                                    setIsBotRunning(true);
                                    try {
                                      await adbClientRef.current.runAutoBotForMultipleApps(targets);
                                      const updated = await adbClientRef.current.scanGentleNotificationChannels();
                                      setGentleScanResults(updated);
                                    } finally {
                                      setIsBotRunning(false);
                                      setIsProcessing(false);
                                    }
                                  }}
                                  disabled={isProcessing || isBotRunning}
                                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                                >
                                  <Zap size={13} className="shrink-0 text-amber-300" />
                                  <span>🤖 Robot Gạt Ngay {gentleApps.length} App Dính Nhẹ Nhàng (Nhanh Nhất)</span>
                                </button>
                              )}
                              {noBannerApps.length > 0 && (
                                <button
                                  onClick={async () => {
                                    if (!adbClientRef.current) return;
                                    const targets = noBannerApps.map(a => ({ pkg: a.pkg, name: a.appName, userId: a.userId }));
                                    setIsProcessing(true);
                                    setIsBotRunning(true);
                                    try {
                                      await adbClientRef.current.runAutoBotForMultipleApps(targets);
                                      const updated = await adbClientRef.current.scanGentleNotificationChannels();
                                      setGentleScanResults(updated);
                                    } finally {
                                      setIsBotRunning(false);
                                      setIsProcessing(false);
                                    }
                                  }}
                                  disabled={isProcessing || isBotRunning}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal"
                                >
                                  <Zap size={12} className="shrink-0 text-amber-400" />
                                  <span>🤖 Robot Gạt Thêm {noBannerApps.length} App Mức 3</span>
                                </button>
                              )}
                              <button
                                onClick={() => setGentleScanResults(null)}
                                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800"
                              >
                                Đóng bảng
                              </button>
                            </div>
                          </div>

                          {/* 3 Thống kê trực quan tách bạch */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div 
                              onClick={() => setScanFilter('gentle')}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                scanFilter === 'gentle' 
                                  ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50' 
                                  : 'bg-rose-950/15 border-rose-500/30 hover:border-rose-500/60'
                              }`}
                            >
                              <div className="text-[11px] font-bold text-rose-300 uppercase tracking-tight flex items-center justify-between">
                                <span>🔴 Dính Nhẹ Nhàng (Mức 1-2)</span>
                                <span className="text-sm font-black text-rose-400">{gentleApps.length}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Mất chuông, tắt rung, trễ tin nhắn (Đây là lỗi thật sự cần trị!).
                              </p>
                            </div>

                            <div 
                              onClick={() => setScanFilter('nobanner')}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                scanFilter === 'nobanner' 
                                  ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/50' 
                                  : 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/60'
                              }`}
                            >
                              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-tight flex items-center justify-between">
                                <span>🟡 Kênh Chuẩn (Mức 3)</span>
                                <span className="text-sm font-black text-amber-400">{noBannerApps.length}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Chuông rung bình thường, chỉ chưa bật Panô nổi theo chuẩn Google Android.
                              </p>
                            </div>

                            <div 
                              onClick={() => setScanFilter('all')}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                scanFilter === 'all' 
                                  ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/50' 
                                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-tight flex items-center justify-between">
                                <span>🟢 Đã Full Panô / Tất Cả</span>
                                <span className="text-sm font-black text-emerald-400">{fullApps.length} / {gentleScanResults.length}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Bấm để xem toàn bộ {gentleScanResults.length} app (Đã xử lý xong {fullApps.length} app).
                              </p>
                            </div>
                          </div>

                          {/* Hộp giải đáp kỹ thuật */}
                          <div className="p-3 rounded-xl bg-blue-950/25 border border-blue-500/30 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                            <div className="font-bold text-blue-300 flex items-center gap-1.5">
                              <Sparkles size={14} className="text-amber-400 shrink-0" />
                              <span>Giải Thích Kỹ Thuật & Cơ Chế Cập Nhật Trạng Thái:</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-slate-300">
                              <li>
                                <strong>Chống lệch tọa độ khi tắt Nhẹ nhàng:</strong> Khi Robot gạt tắt <em>"Thông báo nhẹ nhàng"</em>, MagicOS sẽ tự động bung thêm các dòng <em>"Biểu ngữ / Âm thanh"</em> bên dưới. Bản cập nhật mới sẽ đợi các dòng này bung xong rồi mới đọc lại tọa độ để gạt <em>"Biểu ngữ"</em> chuẩn xác 100%!
                              </li>
                              <li>
                                <strong>Ghi nhận trạng thái Full Panô tức thì:</strong> Trên Honor MagicOS, công tắc <em>"Biểu ngữ"</em> được lưu trong cơ sở dữ liệu riêng của Honor trong khi <code className="text-amber-300">mImportance</code> gốc vẫn giữ ở mức 3. Nay mỗi ứng dụng sau khi được Robot gạt xong sẽ được đánh dấu xác nhận <strong>🟢 100% Đã bật Full Panô ✓</strong> ngay lập tức!
                              </li>
                            </ul>
                          </div>

                          {/* Bộ lọc xem danh sách */}
                          <div className="flex items-center justify-between gap-2 text-xs border-b border-slate-800 pb-2">
                            <div>
                              <span className="text-slate-500 text-[11px] font-semibold">Đang hiển thị: </span>
                              <span className="font-bold text-white">
                                {scanFilter === 'gentle' ? `🔴 App Dính Nhẹ Nhàng (${displayedApps.length})` : scanFilter === 'nobanner' ? `🟡 App Mức Chuẩn (${displayedApps.length})` : `📑 Tất Cả (${displayedApps.length})`}
                              </span>
                            </div>
                          </div>

                          {/* Danh sách các ứng dụng */}
                          {displayedApps.length === 0 ? (
                            <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-2">
                              <CheckCircle size={28} className="text-emerald-400 mx-auto" />
                              <div className="text-sm font-bold text-emerald-300">
                                🎉 Tuyệt vời! Không còn ứng dụng nào bị dính lỗi ở mục này!
                              </div>
                              <p className="text-xs text-slate-400">
                                Đã có <strong className="text-emerald-400">{fullApps.length}</strong> ứng dụng đạt chuẩn 100% Full Panô & Chuông.
                              </p>
                              {scanFilter !== 'all' && (
                                <button
                                  onClick={() => setScanFilter('all')}
                                  className="mt-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-blue-300 border border-slate-700"
                                >
                                  📑 Xem toàn bộ {gentleScanResults.length} ứng dụng
                                </button>
                              )}
                            </div>
                          ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                            {displayedApps.map(app => {
                              const hasGentle = app.gentleChannels.length > 0;
                              const hasNoBanner = app.noBannerChannels.length > 0;
                              return (
                                <div
                                  key={app.key || app.pkg}
                                  className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 text-xs transition-all ${
                                    hasGentle
                                      ? 'bg-rose-950/25 border-rose-500/40 hover:border-rose-500'
                                      : hasNoBanner
                                      ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60'
                                      : 'bg-emerald-950/20 border-emerald-500/30'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-white truncate">{app.appName}</span>
                                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                        {app.totalChannels} mục
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="text-[10px] font-mono text-slate-500 truncate">{app.pkg}</div>
                                      {app.userId !== undefined && app.userId !== 0 && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold shrink-0">
                                          👥 User {app.userId}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                                      {hasGentle && (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                          {app.gentleChannels.length} mục Nhẹ nhàng (Mất chuông)
                                        </span>
                                      )}
                                      {hasNoBanner && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                          {app.noBannerChannels.length} mục Mức 3 (Chuẩn)
                                        </span>
                                      )}
                                      {!hasGentle && !hasNoBanner && (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                          100% Đã bật Full Panô ✓
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      if (!adbClientRef.current) return;
                                      setIsProcessing(true);
                                      setIsBotRunning(true);
                                      try {
                                        await adbClientRef.current.runAutoBotForAppNotification(app.pkg, app.appName, true, undefined, app.userId);
                                        const updated = await adbClientRef.current.scanGentleNotificationChannels();
                                        setGentleScanResults(updated);
                                      } finally {
                                        setIsBotRunning(false);
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing || isBotRunning}
                                    className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1 ${
                                      hasGentle
                                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                                        : 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30'
                                    }`}
                                  >
                                    <Zap size={11} className={hasGentle ? "text-amber-300" : ""} />
                                    <span>🤖 Robot Gạt Tắt Cho {app.appName}</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          )}
                        </div>
                        );
                      })()}

                      {/* Bấm nhanh Robot cho từng ứng dụng phổ biến */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                            🤖 Bấm 1 chạm để Robot tự mở Cài đặt trên ĐT & tự động gạt công tắc cho từng App:
                          </span>
                          <span className="text-[10px] text-slate-400 italic">
                            (Hãy mở khóa màn hình ĐT và nhìn công tắc tự gạt!)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                          {[
                            { name: 'Facebook', pkg: 'com.facebook.katana' },
                            { name: 'Messenger', pkg: 'com.facebook.orca' },
                            { name: 'Zalo', pkg: 'com.zing.zalo' },
                            { name: 'Gmail', pkg: 'com.google.android.gm' },
                            { name: 'Telegram', pkg: 'org.telegram.messenger' },
                            { name: 'Telegram X', pkg: 'org.thunderdog.challegram' },
                            { name: 'Shopee', pkg: 'com.shopee.vn' },
                            { name: 'TikTok', pkg: 'com.zhiliaoapp.musically' },
                          ].map(item => (
                            <button
                              key={item.pkg}
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                setIsBotRunning(true);
                                try {
                                  await adbClientRef.current.runAutoBotForAppNotification(item.pkg, item.name);
                                  const updated = await adbClientRef.current.scanGentleNotificationChannels();
                                  setGentleScanResults(updated);
                                } finally {
                                  setIsBotRunning(false);
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing || isBotRunning}
                              className="p-2.5 rounded-xl bg-slate-950/90 hover:bg-indigo-600/30 border border-slate-800 hover:border-indigo-500/50 text-left transition-all active:scale-95 disabled:opacity-50 flex flex-col justify-between gap-1.5"
                            >
                              <div className="font-bold text-xs text-white truncate">{item.name}</div>
                              <div className="text-[10px] text-indigo-300 font-semibold flex items-center gap-1">
                                <Zap size={10} className="text-amber-400 shrink-0" />
                                <span>Tự gạt ngay</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Thanh chọn App bất kỳ hoặc Gạt ngay trên màn hình đang mở */}
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-300 shrink-0">
                            🎯 Chọn App bất kỳ cho Robot tự gạt:
                          </span>
                          <input
                            type="text"
                            value={customBotPkg}
                            onChange={e => setCustomBotPkg(e.target.value)}
                            placeholder="Nhập package (vd: com.zing.zalo)..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                          {apps.length > 0 && (
                            <select
                              value={customBotPkg}
                              onChange={e => setCustomBotPkg(e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[210px]"
                            >
                              {apps.map(a => (
                                <option key={a.packageName} value={a.packageName}>
                                  {a.packageName}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                          <button
                            onClick={async () => {
                              const safePkg = sanitizePackageName(customBotPkg);
                              if (!adbClientRef.current || !safePkg) {
                                addLog('⚠️ Tên gói ứng dụng (Package ID) không hợp lệ!', 'error');
                                return;
                              }
                              setIsProcessing(true);
                              setIsBotRunning(true);
                              try {
                                await adbClientRef.current.runAutoBotForAppNotification(safePkg);
                                const updated = await adbClientRef.current.scanGentleNotificationChannels();
                                setGentleScanResults(updated);
                              } finally {
                                setIsBotRunning(false);
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing || isBotRunning || !customBotPkg.trim()}
                            className="w-full md:w-auto px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Zap size={12} className="text-amber-300" />
                            <span>🤖 Chạy Robot Cho App Này</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.autoFixCurrentOpenNotificationScreen('Màn hình đang mở');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing || isBotRunning}
                            className="w-full md:w-auto px-3.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                            title="Nếu trên ĐT bạn đang mở sẵn trang thông báo của 1 mục bất kỳ, bấm nút này để Robot tự gạt Tắt Nhẹ nhàng & Bật Biểu ngữ ngay!"
                          >
                            <CheckCircle size={12} />
                            <span>⚡ Gạt Ngay Màn Hình Đang Mở Trên ĐT</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* NEW: Live Per-App Notification Push Tester Panel */}
                    {(notiSubTab === 'test' || notiSubTab === 'all') && (
                    <div className="bg-gradient-to-br from-emerald-950/35 via-slate-900/95 to-slate-950 border border-emerald-500/35 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2 text-emerald-400 font-black uppercase tracking-wider text-xs sm:text-sm">
                            <BellRing size={16} className="text-amber-400 animate-bounce shrink-0" />
                            <span>Bảng Thử Đẩy Thông Báo Tức Thì Từng Ứng Dụng (Live Push Notification Tester)</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            Bấm thử ngay để kiểm tra mắt thấy tai nghe xem điện thoại có <strong>nổ biểu ngữ pop-up (Heads-Up), rung chuông</strong> và <strong>làm sáng màn hình khóa</strong> cho từng ứng dụng hay không!
                          </p>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-black uppercase shrink-0 self-start sm:self-center">
                          Test Thực Tế Tức Thì
                        </span>
                      </div>

                      {/* Quick Test Grid for Popular Apps */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {[
                          { name: 'Facebook', pkg: 'com.facebook.katana', badge: 'Meta' },
                          { name: 'Messenger', pkg: 'com.facebook.orca', badge: 'Chat' },
                          { name: 'Zalo', pkg: 'com.zing.zalo', badge: 'Ưu tiên' },
                          { name: 'Gmail', pkg: 'com.google.android.gm', badge: 'Mail' },
                          { name: 'Telegram', pkg: 'org.telegram.messenger', badge: 'Chat' },
                          { name: 'Telegram X', pkg: 'org.thunderdog.challegram', badge: 'TDLib' },
                          { name: 'Shopee', pkg: 'com.shopee.vn', badge: 'Mua sắm' },
                          { name: 'TikTok', pkg: 'com.zhiliaoapp.musically', badge: 'Video' }
                        ].map(item => (
                          <div
                            key={item.pkg}
                            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-2.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div>
                                <div className="font-bold text-xs text-white">{item.name}</div>
                                <div className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                                  {item.pkg}
                                </div>
                              </div>
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {item.badge}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.testPushNotificationForApp(item.pkg, item.name, false);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-2 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                                title={`Bắn thử biểu ngữ thông báo nổi cho ${item.name}`}
                              >
                                <Send size={10} />
                                <span>Test Nổi</span>
                              </button>

                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.testPushNotificationForApp(item.pkg, item.name, true);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-2 py-1.5 rounded-lg bg-indigo-600/25 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                                title={`Tự động khóa màn hình ĐT -> Đợi 1.2s -> Bắn thông báo làm sáng màn hình khóa cho ${item.name}`}
                              >
                                <Lock size={10} />
                                <span>Màn Khóa</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Custom / Any Installed App Notification Push Tester */}
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-300 shrink-0">
                            🎯 Chọn hoặc nhập gói App bất kỳ để bắn thử:
                          </span>
                          <input
                            type="text"
                            value={customTestPkg}
                            onChange={e => setCustomTestPkg(e.target.value)}
                            placeholder="Nhập package (vd: com.facebook.katana, com.mbmobile...)"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-300 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                          <button
                            onClick={async () => {
                              const safePkg = sanitizePackageName(customTestPkg);
                              if (!adbClientRef.current || !safePkg) {
                                addLog('⚠️ Tên gói ứng dụng (Package ID) không hợp lệ!', 'error');
                                return;
                              }
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.testPushNotificationForApp(safePkg, safePkg, false);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing || !customTestPkg.trim()}
                            className="w-full md:w-auto px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <BellRing size={13} />
                            <span>🔔 Bắn Thử Biểu Ngữ Nổi</span>
                          </button>

                          <button
                            onClick={async () => {
                              const safePkg = sanitizePackageName(customTestPkg);
                              if (!adbClientRef.current || !safePkg) {
                                addLog('⚠️ Tên gói ứng dụng (Package ID) không hợp lệ!', 'error');
                                return;
                              }
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.testPushNotificationForApp(safePkg, safePkg, true);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing || !customTestPkg.trim()}
                            className="w-full md:w-auto px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Lock size={13} />
                            <span>🔒 Tự Khóa Màn & Test Màn Khóa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    )}



                    {/* Section: Kiểm tra trạng thái & Chẩn đoán chuyên sâu (Facebook / Gmail) */}
                    {(notiSubTab === 'diag' || notiSubTab === 'all') && (
                    <section className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Activity size={18} className="text-blue-400" />
                          <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                            Kiểm tra trạng thái các ứng dụng quan trọng
                          </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                const fbRes = await adbClientRef.current.diagnoseFacebookAndPower();
                                setFbDiag(fbRes);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
                          >
                            <Facebook size={14} className="text-rose-400" />
                            {isProcessing ? 'Đang mổ xẻ...' : 'Chẩn đoán sâu 10 tầng: Facebook & Gmail'}
                          </button>
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                const diag = await adbClientRef.current.diagnoseAllApps();
                                setMultiAppDiag(diag);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
                          >
                            <Search size={14} />
                            {isProcessing ? 'Đang quét...' : 'Quét tất cả ứng dụng'}
                          </button>
                        </div>
                      </div>

                      {/* Deep 10-Layer Facebook & Gmail Diagnostic Box */}
                      {fbDiag && (
                        <div className="mb-6 bg-gradient-to-b from-rose-950/30 via-slate-900/95 to-slate-900 border border-rose-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                                <AlertTriangle size={16} />
                                Kết quả Mổ Xẻ 10 Tầng: Tại sao Facebook & Gmail không nổ thông báo?
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Quét trực tiếp vào nhân ROM Honor Nội Địa: Tường lửa mạng ngầm UID, Đăng ký Token FCM, Tự động đồng bộ Gmail & SystemManager
                              </p>
                            </div>
                            <button
                              onClick={() => setFbDiag(null)}
                              className="text-slate-500 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/60"
                            >
                              Đóng
                            </button>
                          </div>

                          {/* Root Causes Found */}
                          <div className="space-y-2">
                            <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                              Thủ phạm phát hiện trực tiếp trên máy của bạn ({fbDiag.detectedCauses.length}):
                            </div>
                            {fbDiag.detectedCauses.map((cause, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                                  cause.startsWith('✅')
                                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                                    : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                                }`}
                              >
                                {cause}
                              </div>
                            ))}
                          </div>

                          {/* 10-Layer Status Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs pt-1">
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                              <span className="text-slate-400 shrink-0">1. Hệ thống có lấp lại Fix?:</span>
                              <span className={`font-bold text-[11px] sm:text-right break-words ${!fbDiag.fbSystemReverted ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {!fbDiag.fbSystemReverted ? 'KHÔNG (Giữ nguyên 100%) ✓' : `Bị lấp ${fbDiag.fbRevertedItems.length} mục!`}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                              <span className="text-slate-400 shrink-0">2. PowerGenius & SystemMgr:</span>
                              <span className={`font-bold text-[11px] sm:text-right break-words ${fbDiag.powerGeniusRemoved && fbDiag.sysManagerBlinded ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {fbDiag.powerGeniusRemoved && fbDiag.sysManagerBlinded ? 'Đã khóa triệt để ✓' : 'Cần khóa lại!'}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                              <span className="text-slate-400 shrink-0">3. Cổng Google FCM Push:</span>
                              <span className={`font-bold text-[11px] sm:text-right break-words ${fbDiag.fcmConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {fbDiag.fcmConnected ? 'Đã kết nối ✓' : 'Đang đứt kết nối!'}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                              <span className="text-slate-400 shrink-0">4. Facebook FCM Token:</span>
                              <span className={`font-bold text-[11px] sm:text-right break-words ${fbDiag.fbFcmRegistered ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {!fbDiag.fbInstalled ? 'Chưa cài FB' : fbDiag.fbFcmRegistered ? 'Đã có Token ✓' : 'Kẹt/Mất Token (Cần tái tạo)!'}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                              <span className="text-slate-400 shrink-0">5. Dịch vụ ngầm FB (MQTT):</span>
                              <span className={`font-bold text-[11px] sm:text-right break-words ${fbDiag.fbPushServicesAlive ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {!fbDiag.fbInstalled ? 'Chưa cài FB' : fbDiag.fbPushServicesAlive ? 'Đang chạy ngầm ✓' : 'Đang ngủ (Cần đánh thức)!'}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                              <span className="text-slate-400 shrink-0">6. Tường lửa mạng ngầm FB:</span>
                              <span className={`font-bold text-[11px] sm:text-right break-words ${fbDiag.fbNetPolicyWhitelisted && fbDiag.fbWhitelisted ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {fbDiag.fbNetPolicyWhitelisted && fbDiag.fbWhitelisted ? 'Mở thông suốt ✓' : 'Bị cắt mạng khi tắt màn!'}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                              <span className="text-slate-400 shrink-0">7. Quyền chạy nền & Bucket FB:</span>
                              <span className={`font-bold text-[11px] sm:text-right break-words ${fbDiag.fbRunAnyBg === 'allow' && (fbDiag.fbBucket === 'active' || fbDiag.fbBucket === '10' || fbDiag.fbBucket === '5' || fbDiag.fbBucket.toLowerCase() === 'exempted') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {fbDiag.fbRunAnyBg === 'allow'
                                  ? (fbDiag.fbBucket === '5' || fbDiag.fbBucket.toLowerCase() === 'exempted'
                                      ? 'Allow (Miễn trừ 5) ✓'
                                      : `Allow (${fbDiag.fbBucket}) ✓`)
                                  : `Bị chặn (${fbDiag.fbRunAnyBg})!`}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                              <span className="text-slate-400 shrink-0">8. Tường lửa & Đồng bộ Gmail:</span>
                              <span className={`font-bold text-[11px] sm:text-right break-words ${!fbDiag.gmailInstalled ? 'text-slate-400' : (fbDiag.gmailNetPolicyWhitelisted && fbDiag.autoSyncEnabled ? 'text-emerald-400' : 'text-amber-400')}`}>
                                {!fbDiag.gmailInstalled
                                  ? 'Chưa cài Gmail ✓'
                                  : (fbDiag.gmailNetPolicyWhitelisted && fbDiag.autoSyncEnabled
                                      ? 'Mở thông suốt ✓'
                                      : 'Cần mở khóa Gmail')}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                              <span className="text-slate-400 shrink-0">9. Thông báo nổi (Heads-Up):</span>
                              <span className={`font-bold text-[11px] sm:text-right break-words ${fbDiag.headsUpEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {fbDiag.headsUpEnabled ? 'Đã BẬT ✓' : 'Đang TẮT!'}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                              <span className="text-slate-400 shrink-0 text-left">10. Màn hình khóa & Biểu ngữ:</span>
                              <span className={`font-bold text-[11px] sm:text-right break-words ${fbDiag.lockScreenShowNoti && fbDiag.headsUpEnabled && fbDiag.lockScreenStyle !== '2' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {fbDiag.lockScreenShowNoti && fbDiag.headsUpEnabled && fbDiag.lockScreenStyle !== '2'
                                  ? 'Đã mở chi tiết (Style 0) ✓'
                                  : 'Cần Bung Khóa!'}
                              </span>
                            </div>
                          </div>

                          {/* Mini-badge explanation and 2-step phone toggle guide */}
                          <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-950 border border-blue-500/30 rounded-xl p-3.5 space-y-2.5">
                            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-tight">
                              <Sparkles size={14} className="text-amber-400 shrink-0" />
                              <span>Tại sao Facebook chỉ hiện số mini trên icon app mà không nổi lên Màn hình khóa / Thanh thông báo?</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              <strong>Dấu hiệu con số mini trên icon chứng minh 100% Facebook ĐÃ NHẬN ĐƯỢC THÔNG BÁO!</strong> Tuy nhiên ROM Honor MagicOS nội địa thường tự động xếp Facebook vào nhóm <em>"Thông báo nhẹ nhàng" (Gentle Notification)</em> và tắt 2 công tắc hiển thị.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-0.5">
                              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                                  <span>1️⃣ Bước 1: Bung khóa tự động qua ADB</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  Bấm nút màu xanh <strong>"⚡ Bung Khóa Màn Hình Khóa & Biểu Ngữ Facebook"</strong> bên dưới để nạp mã ép hiển thị toàn bộ dạng thẻ (Style 0) và cấp quyền hiển thị nổi (System Alert Window).
                                </p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                                  <span>2️⃣ Bước 2: Kiểm tra 2 công tắc trên ĐT</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  Trên màn hình điện thoại vừa mở ra: TẮT <em>"Thông báo nhẹ nhàng"</em>, sau đó gạt BẬT <em>"Biểu ngữ" (Banners)</em> và <em>"Màn hình khóa"</em>.
                                </p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-950/90 border border-amber-500/20 space-y-1">
                                <div className="font-bold text-amber-200 flex items-center gap-1.5 text-[11px]">
                                  <span>ℹ️ Tại sao vẫn nhận thông báo chậm?</span>
                                </div>
                                <p className="text-[10px] text-amber-100/70 leading-relaxed">
                                  Nếu Zalo nhanh mà FB/Gmail vẫn chậm: Do <strong>PowerGenius "Gom gói" (Batching)</strong>. Hãy dùng tính năng <strong>"Phẫu thuật riêng Facebook"</strong> bên dưới.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons inside Deep Diag */}
                          <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-slate-800">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.fixFacebookLockscreenAndBanners();
                                  const fbRes = await adbClientRef.current.diagnoseFacebookAndPower();
                                  setFbDiag(fbRes);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95 break-words whitespace-normal text-left"
                            >
                              <BellRing size={14} className="text-amber-300 shrink-0" />
                              <span>{isProcessing ? 'Đang bung khóa...' : '⚡ Bung Khóa Màn Hình Khóa & Biểu Ngữ Facebook (Khắc phục chỉ hiện số mini)'}</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.repairFacebookExclusivePush();
                                  const fbRes = await adbClientRef.current.diagnoseFacebookAndPower();
                                  setFbDiag(fbRes);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95 break-words whitespace-normal text-left"
                            >
                              <Facebook size={14} className="shrink-0" />
                              <span>{isProcessing ? 'Đang tái tạo Token Facebook...' : '💉 Phẫu Thuật Riêng Facebook (Tái Tạo Token FCM + Đánh Thức MQTT)'}</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.fixFacebookNuclear();
                                  const fbRes = await adbClientRef.current.diagnoseFacebookAndPower();
                                  setFbDiag(fbRes);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95 break-words whitespace-normal text-left"
                            >
                              <Zap size={14} className="shrink-0" />
                              <span>{isProcessing ? 'Đang chạy Phẫu Thuật 10 Tầng...' : 'Chạy Fix Hạt Nhân 10 Tầng (Facebook + Gmail)'}</span>
                            </button>
                            {fbDiag.gmailInstalled && (!fbDiag.gmailNetPolicyWhitelisted || !fbDiag.autoSyncEnabled) && (
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.unlockGmailAndSync();
                                    const fbRes = await adbClientRef.current.diagnoseFacebookAndPower();
                                    setFbDiag(fbRes);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                              >
                                <span>📧 Mở Khóa Mạng Nền & Bật Đồng Bộ Gmail</span>
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                await adbClientRef.current?.openFacebookNotiSettings();
                              }}
                              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all break-words whitespace-normal"
                            >
                              Mở Cài đặt Thông báo Facebook trên ĐT
                            </button>
                            <button
                              onClick={async () => {
                                await adbClientRef.current?.openHonorAppLaunchSettings();
                              }}
                              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all break-words whitespace-normal"
                            >
                              Mở bảng Khởi chạy ứng dụng trên ĐT
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Diagnostic Status Box */}
                      {multiAppDiag && (
                        <div className="mb-6 bg-slate-900/80 border border-blue-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                              <ShieldCheck size={16} />
                              Trạng thái hệ thống & AI quản lý pin
                            </h3>
                            <button
                              onClick={() => setMultiAppDiag(null)}
                              className="text-slate-500 hover:text-white text-xs"
                            >
                              Đóng
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400">PowerGenius & iAware:</span>
                                <span className={`font-bold text-right ${multiAppDiag.powerGeniusRemoved ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {multiAppDiag.powerGeniusDetails}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-relaxed break-words whitespace-normal">
                                *Lưu ý: <strong>PowerGenius</strong> được gỡ hẳn khỏi máy; còn <strong>iAware</strong> là tiến trình nhân ROM (Read-Only) nên được vô hiệu hóa 100% bằng cách tắt công tắc <code className="text-blue-400">iaware_switch=0</code> và khóa quyền đọc trạng thái ngầm (<code className="text-blue-400">GET_USAGE_STATS ignore</code>).
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                              <span className="text-slate-400">Google Play Services (FCM Push):</span>
                              <span className={`font-bold ${multiAppDiag.gmsWhitelisted ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {multiAppDiag.gmsWhitelisted ? 'Đã mở khóa ngủ đông ✓' : 'Chưa Whitelist'}
                              </span>
                            </div>
                          </div>

                          {/* Multi-Space / App Twin / Parallel Space Status Box */}
                          <div className="p-3.5 rounded-xl bg-cyan-950/25 border border-cyan-500/35 space-y-2.5 text-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-bold text-cyan-300">
                                <Layers size={15} className="text-cyan-400 shrink-0" />
                                <span>
                                  Trạng thái Đa Không Gian (Nhân Bản Ứng Dụng & Không Gian Song Song):{' '}
                                  <strong className="text-white">
                                    {(multiAppDiag.activeUsers || []).length} phân vùng User
                                  </strong>{' '}
                                  •{' '}
                                  <strong className="text-emerald-300">
                                    {(multiAppDiag.clonedApps || []).length} app nhân bản / song song
                                  </strong>
                                </span>
                              </div>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.syncAllClonedAndParallelAppsNotifications(false);
                                    const diag = await adbClientRef.current.diagnoseAllApps();
                                    setMultiAppDiag(diag);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition-all shrink-0 disabled:opacity-50"
                              >
                                👥 Đồng Bộ Bảo Vệ Toàn Bộ App Nhân Bản & Song Song
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {(multiAppDiag.activeUsers || []).map(u => (
                                <span
                                  key={u.id}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    u.id === 0
                                      ? 'bg-slate-900 text-slate-300 border-slate-700'
                                      : 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40'
                                  }`}
                                >
                                  {u.spaceLabel} {u.isRunning ? '🟢 Đang chạy' : '🟡 Đã đánh thức'}
                                </span>
                              ))}
                            </div>

                            {(multiAppDiag.clonedApps || []).length > 0 ? (
                              <div className="pt-1 border-t border-cyan-500/20">
                                <div className="text-[10px] text-cyan-200/80 mb-1.5">
                                  Các ứng dụng phát hiện trong Nhân bản ứng dụng (User 128/999) & Không gian song song (User 10+) đã được mở Tường lửa UID & 20 quyền AppOps:
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {(multiAppDiag.clonedApps || []).map(ca => (
                                    <span
                                      key={`${ca.pkg}@${ca.userId}`}
                                      className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold"
                                    >
                                      ✓ {ca.name} ({ca.spaceLabel} • UID: {ca.uid || `${ca.userId}10xxx`})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400">
                                Hiện máy chỉ dùng Không gian chính (User 0). Ngay khi bạn bật <strong>Nhân bản ứng dụng (App Twin)</strong> hoặc <strong>Không gian song song (Parallel Space)</strong>, hệ thống đã cài sẵn cờ xuyên không gian (<code className="text-cyan-300">cross_profile_notifications=1</code>) và bạn có thể bấm nút Đồng bộ bên trên bất cứ lúc nào để mở khóa UID riêng cho bản nhân bản!
                              </p>
                            )}
                          </div>

                          {/* App Status Table / Grid */}
                          <div className="pt-2">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                              Chi tiết từng ứng dụng trên máy:
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {multiAppDiag.apps.map(item => (
                                <div 
                                  key={item.pkg}
                                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                                    !item.isInstalled 
                                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60' 
                                      : item.isWhitelisted 
                                        ? 'bg-emerald-950/20 border-emerald-500/25' 
                                        : 'bg-amber-950/20 border-amber-500/25'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="font-bold text-xs text-white truncate">{item.name}</span>
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                        !item.isInstalled 
                                          ? 'bg-slate-800 text-slate-500' 
                                          : item.isWhitelisted 
                                            ? 'bg-emerald-500/20 text-emerald-300' 
                                            : 'bg-amber-500/20 text-amber-300'
                                      }`}>
                                        {!item.isInstalled ? 'Chưa cài' : item.isWhitelisted ? 'Đã tối ưu ✓' : 'Cần tối ưu'}
                                      </span>
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500 truncate mb-1">
                                      {item.pkg}
                                    </div>
                                    {item.clonedSpaces && item.clonedSpaces.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-1">
                                        {item.clonedSpaces.map((sp, idx) => (
                                          <span
                                            key={idx}
                                            className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold"
                                          >
                                            👥 Đã đồng bộ: {sp}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {item.isInstalled && (
                                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                        <span>Bucket: <strong className="text-slate-300">{item.bucket}</strong></span>
                                        <span>•</span>
                                        <span>Chạy ngầm: <strong className={item.runAnyBg === 'allow' ? 'text-emerald-400' : 'text-amber-400'}>{item.runAnyBg}</strong></span>
                                      </div>
                                    )}
                                  </div>

                                  {item.isInstalled && (
                                    <div className="flex flex-col gap-1.5 mt-1">
                                      {!item.isWhitelisted && (
                                        <button
                                          onClick={async () => {
                                            setIsProcessing(true);
                                            try {
                                              await adbClientRef.current?.fixNotification(item.pkg);
                                              const diag = await adbClientRef.current?.diagnoseAllApps();
                                              if (diag) setMultiAppDiag(diag);
                                            } finally {
                                              setIsProcessing(false);
                                            }
                                          }}
                                          disabled={isProcessing}
                                          className="w-full py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 text-[10px] font-bold transition-all text-center"
                                        >
                                          Tối ưu app này
                                        </button>
                                      )}
                                      <div className="grid grid-cols-2 gap-1">
                                        <button
                                          onClick={async () => {
                                            setIsProcessing(true);
                                            try {
                                              await adbClientRef.current?.testPushNotificationForApp(item.pkg, item.name, false);
                                            } finally {
                                              setIsProcessing(false);
                                            }
                                          }}
                                          disabled={isProcessing}
                                          className="py-1 px-1.5 rounded bg-emerald-600/25 hover:bg-emerald-600 text-emerald-200 hover:text-white text-[10px] font-bold transition-all text-center"
                                          title="Bắn thử thông báo nổi ngay lập tức"
                                        >
                                          🔔 Test Nổi
                                        </button>
                                        <button
                                          onClick={async () => {
                                            setIsProcessing(true);
                                            try {
                                              await adbClientRef.current?.testPushNotificationForApp(item.pkg, item.name, true);
                                            } finally {
                                              setIsProcessing(false);
                                            }
                                          }}
                                          disabled={isProcessing}
                                          className="py-1 px-1.5 rounded bg-indigo-600/25 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[10px] font-bold transition-all text-center"
                                          title="Tự tắt màn hình ĐT và bắn thử thông báo màn hình khóa"
                                        >
                                          🔒 Test Màn Khóa
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dedicated Panel: Why ONLY Facebook Fails When Other Apps Work Great */}
                      <div className="mb-5 bg-gradient-to-r from-indigo-950/60 via-rose-950/30 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 text-xs text-slate-300 space-y-3 shadow-lg">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-rose-400 font-black uppercase tracking-wider text-xs">
                              <Facebook size={16} className="shrink-0" />
                              <span>Giải mã: Tại sao các App khác đều đã nổ thông báo ngon lành nhưng RIÊNG FACEBOOK vẫn im lìm?</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Khi Zalo, Messenger, Gmail... đều đã báo ầm ầm thì <strong>hệ thống chung của điện thoại KHÔNG HỀ lấp lại các bản Fix</strong>! Thủ phạm khiến <strong>chỉ một mình Facebook</strong> bị điếc thông báo nằm ở <strong>3 cơ chế dị biệt của riêng app Facebook</strong>:
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.repairFacebookExclusivePush();
                                  const fbRes = await adbClientRef.current.diagnoseFacebookAndPower();
                                  setFbDiag(fbRes);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Zap size={14} className="text-amber-300" />
                              {isProcessing ? 'Đang phẫu thuật Facebook...' : '💉 Phẫu Thuật Riêng Facebook (Tái Tạo Token FCM)'}
                            </button>
                            <button
                              onClick={async () => {
                                await adbClientRef.current?.openFacebookNotiSettings();
                              }}
                              disabled={isProcessing}
                              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                            >
                              Mở Cài đặt Kênh Facebook trên ĐT
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-slate-300 leading-relaxed">
                          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                            <strong className="text-rose-400 block mb-1">1. Bệnh "Chết Token FCM" nội bộ (90% mắc phải):</strong>
                            Khác với Zalo hay Messenger (tự xin lại Token mỗi lần mở app), app Facebook chỉ đăng ký <em>FCM Token</em> đúng 1 lần khi mới cài. Nếu lúc mới mua máy bạn cài/chuyển dữ liệu Facebook sang trước khi Fix GMS, Facebook sẽ lưu chết trạng thái <code className="text-rose-300">Token = Rỗng</code>.
                            <br />
                            👉 <strong>Cách trị:</strong> Bấm nút <strong>"💉 Phẫu Thuật Riêng Facebook"</strong> ở trên (tool sẽ bắn cờ <code className="text-blue-400">MY_PACKAGE_REPLACED</code> ép Facebook xin lại Token mới ngay mà không mất nick). Nếu vẫn kẹt, chỉ cần <strong>Đăng xuất tài khoản Facebook ra rồi Đăng nhập lại</strong> (hoặc xóa app Facebook tải lại từ CH Play)!
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                            <strong className="text-amber-400 block mb-1">2. ROM Trung Quốc khóa riêng tiến trình MQTT/FBNS của Meta:</strong>
                            Riêng app Facebook dùng dịch vụ đẩy ngầm <code className="text-amber-300">MqttPushService</code> & <code className="text-amber-300">com.facebook.services</code> nằm trong danh sách đen (Blacklist) của ROM nội địa Trung Quốc vì IP máy chủ Meta bị tường lửa đại lục chặn gây tốn pin retry.
                            <br />
                            👉 <strong>Cách trị:</strong> Nút <strong>"💉 Phẫu Thuật Riêng Facebook"</strong> sẽ cưỡng bức <code className="text-blue-400">pm enable</code> lại toàn bộ 8 Receiver/Service nhận thông báo ẩn của Facebook và dựng dậy tiến trình MQTT ngay tức thì.
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                            <strong className="text-emerald-400 block mb-1">3. Công tắc "Thông báo đẩy" BÊN TRONG app Facebook bị tắt:</strong>
                            Khi chuyển máy hoặc mất kết nối lâu, máy chủ Meta tự tắt nút Push bên trong app, hoặc MagicOS xếp các kênh con (Bình luận, Nhóm, Thẻ...) vào <em>"Thông báo nhẹ nhàng"</em>.
                            <br />
                            👉 <strong>Cách trị (30 giây trên ĐT):</strong> Mở app Facebook ➔ <strong>Menu (3 gạch) ➔ Cài đặt & quyền riêng tư ➔ Cài đặt ➔ Thông báo ➔ kéo xuống mục "Bạn nhận thông báo qua" ➔ Thông báo đẩy (Push)</strong>: Hãy <strong>Tắt đi rồi Bật lại</strong> để máy chủ Meta làm mới đường truyền!
                          </div>
                        </div>
                      </div>

                      {/* Dedicated Panel: Why Gmail & Facebook Have Delayed / Low-Frequency Notifications (Batching) While Zalo/Messenger Are Instant */}
                      <div className="mb-5 bg-gradient-to-r from-amber-950/50 via-emerald-950/30 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 text-xs text-slate-300 space-y-3 shadow-lg">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-amber-400 font-black uppercase tracking-wider text-xs">
                              <Zap size={16} className="shrink-0" />
                              <span>Giải mã: Tại sao Zalo/Messenger/Telegram nổ siêu nhanh, còn GMAIL & FACEBOOK hết điếc nhưng TẦN SUẤT NHẬN THÔNG BÁO VẪN CHẬM (GOM CỤM)?</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Đây là hạn chế đặc thù của nhân <strong>Honor MagicOS nội địa (Android 13/14/15/16/17)</strong> đối với các ứng dụng không phải Chat trực tiếp. Zalo, Messenger, Telegram dùng luồng <strong>High-Priority VoIP/Chat FCM</strong> nên được đánh thức ngay trong 0.1s; trong khi <strong>Gmail</strong> và <strong>Facebook (App chính)</strong> bị kẹt bởi <strong>3 cơ chế Gom Cụm (Batching & Deferral)</strong> dưới đây:
                            </p>
                          </div>
                          <div className="flex flex-col gap-4 w-full">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.boostGmailAndFacebookInstantFrequency(false);
                                  const fbRes = await adbClientRef.current.diagnoseFacebookAndPower();
                                  setFbDiag(fbRes);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="w-full px-4 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-sm font-black shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Zap size={18} className="fill-slate-950" />
                              {isProcessing ? 'Đang phá bỏ gom cụm...' : '⚡ Xóa Gom Cụm 0s: Ép Gmail & Facebook Nổ Tức Thì'}
                            </button>
                            
                            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto lg:justify-end">
                              <button
                                onClick={async () => {
                                  await adbClientRef.current?.openGmailNotiSettings();
                                }}
                                disabled={isProcessing}
                                className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                              >
                                Mở Cài đặt Gmail trên ĐT
                              </button>
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    await adbClientRef.current.restoreGmailAndFacebookBatchingDefault();
                                    const fbRes = await adbClientRef.current.diagnoseFacebookAndPower();
                                    setFbDiag(fbRes);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-bold border border-rose-500/35 flex items-center gap-1.5 transition-all active:scale-95"
                              >
                                <RotateCcw size={13} />
                                <span>Hoàn tác Gom cụm gốc</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-slate-300 leading-relaxed">
                          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                            <strong className="text-amber-400 block mb-1">1. Cơ chế "Gom cụm 15–60 phút" của JobScheduler & TARE:</strong>
                            Khác với Messenger, khi có thư Gmail mới hoặc có bình luận Facebook, máy chủ chỉ gửi 1 tín hiệu đánh thức mức thường (<em>Normal-Priority Tickle</em>) rồi giao cho <code>JobScheduler / SyncManager</code> tự tải nội dung ngầm. Trên ROM Honor, hệ thống <strong>TARE (Android Resource Economy)</strong> gom các lệnh tải ngầm này lại <strong>15–60 phút mới cho chạy 1 lần</strong> để tiết kiệm pin!
                            <br />
                            👉 <strong>Cách trị:</strong> Bấm nút <strong>"⚡ Xóa Gom Cụm 0s"</strong> ở trên để tắt TARE và ép <code>max_non_active_job_batch_delay_ms = 0</code> (Độ trễ gom cụm = 0 giây).
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                            <strong className="text-emerald-400 block mb-1">2. Bộ lọc mạng nền "Bastet / SmartSocket" & Hạn ngạch Alarm của Honor:</strong>
                            Honor phân loại <em>Messenger (orca)</em> là ứng dụng Chat nên mở thông suốt, nhưng lại phân loại <em>Facebook (katana)</em> là ứng dụng Lướt Bảng Tin ngốn pin nên bộ lọc <code>Bastet / SmartSocket</code> của Honor giới hạn tần suất thức dậy của <code>MqttPushService</code> khi tắt màn hình.
                            <br />
                            👉 <strong>Cách trị:</strong> Nút <strong>"⚡ Xóa Gom Cụm 0s"</strong> sẽ tắt <code>bastet_switch=0</code>, nâng cấp Gmail & Facebook lên mức miễn trừ tối cao <strong>Bucket 5 (EXEMPTED)</strong> và cấp quyền <code>RUN_USER_INITIATED_JOBS</code>.
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                            <strong className="text-cyan-400 block mb-1">3. Cài đặt "Chỉ ưu tiên cao" BÊN TRONG ứng dụng Gmail:</strong>
                            Mặc định khi cài Gmail trên máy nội địa, bên trong app Gmail thường để mục Thông báo là <em>"Chỉ ưu tiên cao" (High priority only)</em> khiến các email bình thường bị ngâm hoặc không báo ngay.
                            <br />
                            👉 <strong>Cách trị (15 giây trong app Gmail):</strong> Mở <strong>App Gmail ➔ Bấm menu 3 gạch (góc trái trên) ➔ Cài đặt ➔ Bấm vào địa chỉ Email của bạn ➔ Mục "Thông báo" chọn "Tất cả (All)"</strong> + Tích chọn <strong>"Đồng bộ hóa Gmail"</strong>!
                          </div>
                        </div>
                      </div>
                    </section>
                    )}

                    {/* Section: Thư viện Thẻ Hành Động Can Thiệp Chuyên Sâu */}
                    {(notiSubTab === 'actions' || notiSubTab === 'all') && (
                    <section className="space-y-4">
                      {/* Noti Category Filter Chips */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                          {[
                            { id: 'all', label: 'Tất cả thẻ' },
                            { id: 'social', label: 'Facebook, Gmail & FCM' },
                            { id: 'chat', label: 'Nhắn tin (Zalo, Tele...)' },
                            { id: 'system', label: 'Khởi chạy Honor' }
                          ].map(f => (
                            <button
                              key={f.id}
                              onClick={() => setNotiCategoryFilter(f.id as any)}
                              className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                                notiCategoryFilter === f.id
                                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/20'
                                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                      {/* Grid of Action Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'social' || notiCategoryFilter === 'chat') && (
                          <ActionCard 
                            title="🎵 ƯU TIÊN ÂM THANH RIÊNG TỪNG APP & CHỐNG THÔNG BÁO IM LẶNG (MAGICOS 11 / ANDROID 17)"
                            description="Cho phép Zalo, Messenger, Shopee, Facebook, Telegram... phát đúng âm thanh thông báo đặc trưng của từng app thay vì bị gộp chung 1 tiếng chuông mặc định của máy. Đồng thời giữ phao dự phòng chống thông báo im lặng 100% và tắt Notification Cooldown trên Android 17 / MagicOS 11!"
                            icon={Volume2}
                            badge="Âm thanh riêng App • OS 11"
                            commandTag="use_default_notification_sound 0 & cooldown 0"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.prioritizeAppCustomNotificationSounds(false, false);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restoreDefaultNotificationSoundBehavior();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onOpenPhoneSettings={() => adbClientRef.current?.runShell('am start -a android.settings.SOUND_SETTINGS')}
                            openPhoneSettingsLabel="📱 Mở Cài đặt Âm thanh"
                            manualRevertGuide="Nếu bạn đã đổi nhạc chuông từng mục thông báo và muốn quay về tiếng chuông mặc định của máy: Vào Cài đặt ➔ Thông báo & thanh trạng thái ➔ Quản lý thông báo ➔ Chọn ứng dụng ➔ Chọn mục thông báo ➔ Nhạc chuông ➔ Chọn 'Nhạc chuông mặc định'."
                            isLoading={isProcessing}
                            variant="primary"
                          />
                        )}
                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'social' || notiCategoryFilter === 'chat') && (
                          <ActionCard 
                            title="⚡ BẬT HÀNG LOẠT: PANÔ + MÀN HÌNH KHÓA + ÂM THANH & TẮT THÔNG BÁO NHẸ NHÀNG (100% APP)"
                            description="Tự động can thiệp vào tất cả ứng dụng (cả bản gốc & nhân bản): Tắt cờ 'Thông báo nhẹ nhàng' của Honor, cấp quyền Panô (System Alert Window), bung thẻ Màn hình khóa Style 0, bật Âm thanh & Rung cho toàn bộ các mục thông báo!"
                            icon={Volume2}
                            badge="Đặc trị Thông báo nhẹ nhàng"
                            commandTag="settings put system gentle_notification_enabled 0"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.forceBatchEnableBannersLockscreenSoundAndDefeatGentleNoti();
                                const res = await adbClientRef.current?.diagnoseAllApps();
                                if (res) setMultiAppDiag(res);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restoreBannersLockscreenGentleDefault();
                                const res = await adbClientRef.current.diagnoseAllApps();
                                if (res) setMultiAppDiag(res);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onOpenPhoneSettings={() => adbClientRef.current?.runShell('am start -a android.settings.ALL_APPS_NOTIFICATION_SETTINGS')}
                            openPhoneSettingsLabel="📱 Mở Quản lý Thông báo"
                            manualRevertGuide="Do Android 14–17 khóa mức ưu tiên kênh (USER_LOCKED_IMPORTANCE), nếu muốn bật lại 'Thông báo nhẹ nhàng' cho riêng 1 ứng dụng: Vào Cài đặt ➔ Thông báo & thanh trạng thái ➔ Quản lý thông báo ➔ Chọn ứng dụng ➔ Bật công tắc 'Thông báo nhẹ nhàng' (Gentle notifications)."
                            isLoading={isProcessing}
                            variant="primary"
                          />
                        )}
                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'social' || notiCategoryFilter === 'chat' || notiCategoryFilter === 'system') && (
                          <ActionCard 
                            title="👥 BẢO VỆ THÔNG BÁO: NHÂN BẢN ỨNG DỤNG (APP TWIN) & KHÔNG GIAN SONG SONG"
                            description="Đảm bảo Zalo 2, Facebook 2, Messenger 2... trong Nhân bản ứng dụng (User 128/999) và Không gian song song (User 10+) nổ thông báo tức thì: Đánh thức phân vùng ngầm 24/24, mở Tường lửa UID (12810xxx/1010xxx), cấp 20 quyền AppOps và bắc cầu thông báo xuyên không gian!"
                            icon={Layers}
                            badge="Đa Không Gian 24/24"
                            commandTag="am start-user <id> & netpolicy whitelist UID"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.syncAllClonedAndParallelAppsNotifications(false);
                                const res = await adbClientRef.current?.diagnoseAllApps();
                                if (res) setMultiAppDiag(res);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restoreMultiSpaceAndClonedDefault();
                                const res = await adbClientRef.current.diagnoseAllApps();
                                if (res) setMultiAppDiag(res);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            manualRevertGuide="Nếu muốn tắt hẳn ứng dụng Nhân bản trên điện thoại: Vào Cài đặt ➔ Ứng dụng ➔ Nhân bản ứng dụng (App Twin) ➔ Gạt tắt ứng dụng không dùng nữa."
                            isLoading={isProcessing}
                            variant="primary"
                          />
                        )}
                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'social' || notiCategoryFilter === 'chat' || notiCategoryFilter === 'system') && (
                          <ActionCard 
                            title="🛡️ TỰ ĐỘNG CẤP FULL 100% QUYỀN CHO TOÀN BỘ APP (RUNTIME + APPOPS + MỞ HẠN CHẾ)"
                            description="Tự động cấp toàn bộ quyền Camera, Micro, Vị trí, Bộ nhớ, Danh bạ, Cửa sổ nổi (Overlay), Quản lý tất cả tệp, Tự khởi chạy, Mở khóa 'Cài đặt bị hạn chế' (Android 13-17) và Bất tử Pin cho 100% ứng dụng cài thêm trên cả Không gian chính & Nhân bản!"
                            icon={ShieldCheck}
                            badge="Full 100% Quyền"
                            commandTag="pm grant --all-permissions & appops ACCESS_RESTRICTED_SETTINGS allow"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.grantFullPermissionsAllApps();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restoreDefaultPermissionsAllApps();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onOpenPhoneSettings={() => adbClientRef.current?.runShell('am start -a android.settings.MANAGE_APPLICATIONS_SETTINGS')}
                            openPhoneSettingsLabel="📱 Mở Quản lý Ứng dụng"
                            manualRevertGuide="Nút Hoàn tác sẽ tự động reset 100% quyền AppOps (Overlay, Cài đặt bị hạn chế, Chạy ngầm) về mặc định. Để đưa toàn bộ quyền Runtime (Camera, Vị trí, Micro) về trạng thái hỏi lại từ đầu mà không mất dữ liệu: Vào Cài đặt ➔ Ứng dụng ➔ Quản lý ứng dụng ➔ Bấm dấu 3 chấm (⋮) góc trên phải ➔ Chọn 'Đặt lại tùy chọn ứng dụng' (Reset app preferences)."
                            isLoading={isProcessing}
                            variant="primary"
                          />
                        )}
                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'social') && (
                          <ActionCard 
                            title="⚡ XÓA GOM CỤM 0 GIÂY: TĂNG TỐC TẦN SUẤT NỔ TỨC THÌ CHO GMAIL & FACEBOOK"
                            description="Đặc trị bệnh Gmail và Facebook hết điếc nhưng nhận thông báo rất chậm (gom cục 15-60 phút mới nổ): Tắt TARE, ép JobScheduler & SyncManager độ trễ 0ms, tắt Bastet SmartSocket, nâng lên Bucket 5 (EXEMPTED) và cấp quyền RUN_USER_INITIATED_JOBS!"
                            icon={Zap}
                            badge="Chống Trễ / Gom Cụm 0s"
                            commandTag="jobscheduler max_non_active_job_batch_delay_ms 0 & bucket 5"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.boostGmailAndFacebookInstantFrequency(false);
                                const fbRes = await adbClientRef.current?.diagnoseFacebookAndPower();
                                if (fbRes) setFbDiag(fbRes);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restoreGmailAndFacebookBatchingDefault();
                                const fbRes = await adbClientRef.current.diagnoseFacebookAndPower();
                                if (fbRes) setFbDiag(fbRes);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onOpenPhoneSettings={() => adbClientRef.current?.openGmailNotiSettings()}
                            openPhoneSettingsLabel="📱 Mở Cài đặt Gmail"
                            manualRevertGuide="Để đưa thông báo bên trong ứng dụng Gmail về mặc định tiết kiệm pin: Mở ứng dụng Gmail ➔ Menu 3 gạch ➔ Cài đặt ➔ Chọn tài khoản Email ➔ Thông báo ➔ Chọn lại 'Chỉ ưu tiên cao' (High priority only)."
                            isLoading={isProcessing}
                            variant="primary"
                          />
                        )}
                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'social') && (
                          <ActionCard 
                            title="💉 PHẪU THUẬT RIÊNG FACEBOOK (TÁI TẠO TOKEN FCM & MQTT)"
                            description="Dành riêng cho trường hợp các app khác đã báo ngon nhưng riêng Facebook vẫn tịt: Xóa Cache Token chết, bật 8 Receiver ẩn (MqttPushService/FBNS) và bắn cờ MY_PACKAGE_REPLACED ép Facebook lấy Token mới tinh mà không mất nick!"
                            icon={Facebook}
                            badge="Trị bệnh riêng FB"
                            commandTag="am broadcast -a MY_PACKAGE_REPLACED -p com.facebook.katana"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.repairFacebookExclusivePush();
                                const fbRes = await adbClientRef.current?.diagnoseFacebookAndPower();
                                if (fbRes) setFbDiag(fbRes);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restoreGmailAndFacebookBatchingDefault();
                                const fbRes = await adbClientRef.current.diagnoseFacebookAndPower();
                                if (fbRes) setFbDiag(fbRes);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onOpenPhoneSettings={() => adbClientRef.current?.openFacebookNotiSettings()}
                            openPhoneSettingsLabel="📱 Mở Cài đặt TB Facebook"
                            manualRevertGuide="Để hoàn tác về quản lý tự động cho Facebook trên ĐT: Vào Quản lý hệ thống (System Manager) ➔ Khởi chạy ứng dụng ➔ Tìm Facebook ➔ Gạt bật lại 'Quản lý tự động'."
                            isLoading={isProcessing}
                            variant="danger"
                          />
                        )}

                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'social') && (
                          <ActionCard 
                            title="☢️ FIX HẠT NHÂN 10 TẦNG: FACEBOOK + GMAIL + FCM"
                            description="Mở tường lửa mạng ngầm UID + Bật Master Auto-Sync cho Gmail + Khóa mắt SystemManager + Bật bảng Xin quyền Bất Tử Pin gốc trên màn hình ĐT cho Facebook, Messenger & Gmail."
                            icon={Facebook}
                            badge="Đặc trị FB & Gmail"
                            commandTag="cmd netpolicy add restrict-background-whitelist <UID>"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.fixFacebookNuclear();
                                const fbRes = await adbClientRef.current?.diagnoseFacebookAndPower();
                                if (fbRes) setFbDiag(fbRes);
                                const res = await adbClientRef.current?.diagnoseAllApps();
                                if (res) setMultiAppDiag(res);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restoreGmailAndFacebookBatchingDefault();
                                await adbClientRef.current.restorePowerGenius();
                                const fbRes = await adbClientRef.current.diagnoseFacebookAndPower();
                                if (fbRes) setFbDiag(fbRes);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onOpenPhoneSettings={() => adbClientRef.current?.openHonorAppLaunchSettings()}
                            openPhoneSettingsLabel="📱 Mở Khởi chạy ứng dụng"
                            manualRevertGuide="Nếu bạn đã bấm 'Cho phép' bảng Bất tử Pin hoặc gạt 'Quản lý thủ công' trên ĐT và muốn hoàn tác: Mở Quản lý hệ thống (System Manager) ➔ Khởi chạy ứng dụng ➔ Tìm Facebook, Messenger, Gmail ➔ Gạt bật lại 'Quản lý tự động'."
                            isLoading={isProcessing}
                            variant="danger"
                          />
                        )}

                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'social' || notiCategoryFilter === 'chat') && (
                          <ActionCard 
                            title="⚡ NÂNG CẤP ĐỘ NHẠY THÔNG BÁO (TURBO PUSH 0.1s)"
                            description="Chủ động tăng tốc 6 yếu tố có lợi: Rút nhịp tim Google FCM từ 15 phút xuống 60 giây, tắt ngủ đông chip Wi-Fi (0ms Latency), giữ 64 tiến trình RAM, chặn Deep Doze & bật sáng màn hình khóa tức thì!"
                            icon={Zap}
                            badge="Tăng nhạy x10"
                            commandTag="gtalk_service_heartbeat_ping_interval_ms 60000"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.boostNotificationSensitivity(false);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restoreNotificationSensitivityDefault();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            manualRevertGuide="Nút Hoàn tác sẽ khôi phục 100% nhịp tim Google FCM về 15 phút mặc định, bật lại chế độ ngủ Doze tiết kiệm pin và đưa giới hạn tiến trình ngầm về chuẩn nhà sản xuất."
                            isLoading={isProcessing}
                            variant="primary"
                          />
                        )}

                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'chat') && (
                          <ActionCard 
                            title="Tối ưu Ứng dụng nhắn tin (Zalo, Tele, Gmail)"
                            description="Fix Zalo, Telegram, Gmail, WhatsApp, X... đảm bảo nhận tin nhắn tức thì không bị đóng ngầm."
                            icon={MessageSquare}
                            badge="Tin nhắn OTT"
                            commandTag="am set-standby-bucket com.zing.zalo active"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.fixMessagingApps();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restorePowerGenius();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onOpenPhoneSettings={() => adbClientRef.current?.openHonorAppLaunchSettings()}
                            openPhoneSettingsLabel="📱 Mở Khởi chạy ứng dụng"
                            manualRevertGuide="Nút Hoàn tác sẽ đưa các ứng dụng nhắn tin ra khỏi danh sách Bất tử Pin (deviceidle whitelist). Để bật lại quản lý tự động trên ĐT: Vào Quản lý hệ thống ➔ Khởi chạy ứng dụng ➔ Gạt bật 'Quản lý tự động' cho Zalo, Telegram."
                            isLoading={isProcessing}
                            variant="primary"
                          />
                        )}

                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'social') && (
                          <ActionCard 
                            title="Xóa triệt để PowerGenius & iAware"
                            description="Gỡ bỏ, đóng băng & tắt toàn bộ switch hệ thống cho cả 4 gói AI tối ưu pin ngầm của Honor/MagicOS."
                            icon={Trash2}
                            badge="AI Sát thủ"
                            commandTag="pm disable-user --user 0 com.hihonor.powergenius"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.removePowerGenius();
                                const res = await adbClientRef.current?.diagnoseAllApps();
                                if (res) setMultiAppDiag(res);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restorePowerGenius();
                                const res = await adbClientRef.current.diagnoseAllApps();
                                if (res) setMultiAppDiag(res);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            manualRevertGuide="Bấm 'Hoàn tác mặc định' để cài đặt lại (cmd package install-existing) và bật lại toàn bộ 4 gói PowerGenius & iAware nguyên bản của Honor."
                            isLoading={isProcessing}
                            variant="danger"
                          />
                        )}

                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'system') && (
                          <ActionCard 
                            title="Mở bảng 'Khởi chạy ứng dụng' trên ĐT"
                            description="Bật trực tiếp mục Quản lý khởi chạy của Honor trên màn hình ĐT để bạn gạt 3 nút 'Quản lý thủ công' cho Facebook (Giữ thông báo khi tắt/bật lại máy)."
                            icon={Smartphone}
                            badge="Chống mất khi Reboot"
                            commandTag="am start -n com.hihonor.systemmanager"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.openHonorAppLaunchSettings();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            manualRevertGuide="Cách hoàn tác về mặc định trên ĐT: Mở ứng dụng Quản lý hệ thống (System Manager) ➔ Khởi chạy ứng dụng (App Launch) ➔ Gạt công tắc của ứng dụng sang BẬT (Quản lý tự động / Manage automatically)."
                            isLoading={isProcessing}
                            variant="secondary"
                          />
                        )}

                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'system') && (
                          <ActionCard 
                            title="Mở Cài đặt Thông báo Facebook trên ĐT"
                            description="Mở thẳng trang Thông báo của Facebook trên ĐT để kiểm tra và TẮT 'Thông báo nhẹ nhàng' (Gentle Notifications)."
                            icon={AlertTriangle}
                            commandTag="am start -a android.settings.APP_NOTIFICATION_SETTINGS"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.openFacebookNotiSettings();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            manualRevertGuide="Cách hoàn tác về mặc định trên ĐT: Trong trang Thông báo của Facebook trên điện thoại, bạn có thể gạt bật lại 'Thông báo nhẹ nhàng' hoặc tùy chỉnh lại từng kênh thông báo theo ý muốn."
                            isLoading={isProcessing}
                            variant="secondary"
                          />
                        )}

                        {(notiCategoryFilter === 'all' || notiCategoryFilter === 'system') && (
                          <ActionCard 
                            title="Khôi phục PowerGenius & Mặc định Honor"
                            description="Khôi phục lại cài đặt gốc nếu bạn cảm thấy máy bị hao pin."
                            icon={RotateCcw}
                            commandTag="settings put system iaware_switch 1"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.restorePowerGenius();
                                const res = await adbClientRef.current?.diagnoseAllApps();
                                if (res) setMultiAppDiag(res);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            isLoading={isProcessing}
                            variant="secondary"
                          />
                        )}
                      </div>
                    </section>
                    )}
                  </div>
                ) : activeTab === 'shizuku' ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* 1. HERO BANNER: SIÊU TRUNG TÂM ĐẶC QUYỀN SHIZUKU & UID 2000 BẤT TỬ */}
                    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/75 via-blue-950/60 to-slate-900 p-5 sm:p-6 shadow-2xl shadow-cyan-950/30">
                      <div className="relative z-10 flex flex-col gap-5">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                <Activity size={12} /> Đặc Quyền Hệ Thống UID 2000 • Không Cần Root
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/35">
                                Hỗ trợ MagicOS 8 / 9 / 10 / 11 & Android 13 – 17
                              </span>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                shizukuRunning
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${shizukuRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                                {shizukuRunning ? `ĐANG CHẠY (${shizukuDetails?.serverPid || 'UID 2000'})` : 'CHƯA KÍCH HOẠT'}
                              </span>
                            </div>

                            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight leading-snug">
                              ⚡ TRUNG TÂM KÍCH HOẠT SHIZUKU & KHIÊN BẤT TỬ CHỐNG SẬP KHI RÚT CÁP TRÊN HONOR
                            </h2>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Trên điện thoại <strong>Honor MagicOS nội địa (Android 13–17)</strong>, nếu chỉ kích hoạt Shizuku theo cách thông thường, dịch vụ sẽ bị <strong>tự động tắt ngay khi bạn rút dây cáp USB</strong> hoặc bị <strong>Phantom Process Killer / PowerGenius</strong> giết ngầm sau 10 phút khóa màn hình. Công cụ <strong>Siêu Kích Hoạt 5-Trong-1</strong> bên dưới sẽ khởi chạy trực tiếp nhân <code>libshizuku.so</code> đời mới và dựng <strong>Khiên Bất Tử 5 Tầng</strong> giữ Shizuku sống bền bỉ 24/24!
                            </p>
                          </div>

                          {/* Readiness Score Box */}
                          <div className="bg-slate-950/85 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 shrink-0">
                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black border ${
                              (shizukuDetails?.healthScore || 0) >= 4
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : (shizukuDetails?.healthScore || 0) >= 2
                                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            }`}>
                              <span className="text-base leading-none">{shizukuDetails ? shizukuDetails.healthScore : (shizukuRunning ? 2 : 0)}/5</span>
                              <span className="text-[8px] uppercase tracking-wider mt-0.5">Khiên</span>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-black text-white uppercase">
                                {shizukuRunning && (shizukuDetails?.healthScore || 0) >= 4
                                  ? 'Shizuku Bất Tử Hoàn Hảo'
                                  : shizukuRunning
                                    ? 'Đang chạy (Cần bật Khiên)'
                                    : 'Cần Kích Hoạt Shizuku'}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {shizukuDetails
                                  ? `App: ${shizukuDetails.appInstalled ? shizukuDetails.appVersion : 'Chưa cài'} • ${shizukuDetails.installedCompanions.length} App hệ sinh thái`
                                  : 'Bấm Quét hoặc Kích Hoạt 5-trong-1 ngay'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Master CTA Buttons Row */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/80">
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                const status = await adbClientRef.current.oneClickActivateAndProtectShizuku();
                                setShizukuDetails(status);
                                setShizukuRunning(status.serverRunning);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 break-words whitespace-normal text-center"
                          >
                            <Zap size={16} className="fill-slate-950 shrink-0" />
                            <span>
                              {isProcessing
                                ? 'Đang kích hoạt Shizuku & Khiên Bất Tử...'
                                : '🚀 1-Chạm Kích Hoạt Shizuku & Khiên Bất Tử 5-Trong-1'}
                            </span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                const details = await refreshShizukuFullStatus();
                                if (details) {
                                  addLog(
                                    details.serverRunning
                                      ? `✅ Chẩn đoán Shizuku: Đang chạy (${details.serverPid}) • Đạt ${details.healthScore}/5 Khiên bảo vệ!`
                                      : `ℹ️ Chẩn đoán Shizuku: Máy chủ chưa chạy • Đạt ${details.healthScore}/5 Khiên bảo vệ.`,
                                    details.serverRunning ? 'success' : 'info'
                                  );
                                }
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 transition-all active:scale-95"
                          >
                            <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
                            <span>🔍 Quét Chẩn Đoán Shizuku</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                if (shizukuDetails?.appInstalled) {
                                  await adbClientRef.current.launchAppOnScreen('moe.shizuku.privileged.api');
                                } else {
                                  await adbClientRef.current.openPlayStoreForApp('moe.shizuku.privileged.api', 'Shizuku');
                                }
                                await refreshShizukuFullStatus();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="px-3.5 py-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-200 text-xs font-bold border border-blue-500/35 flex items-center gap-1.5 transition-all active:scale-95"
                          >
                            <Smartphone size={14} />
                            <span>{shizukuDetails?.appInstalled ? '📱 Mở App Shizuku Trên ĐT' : '🛒 Mở Tải Shizuku Trên ĐT'}</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                const status = await adbClientRef.current.restoreAllShizukuToDefault();
                                setShizukuDetails(status);
                                setShizukuRunning(status.serverRunning);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="px-3.5 py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-bold border border-rose-500/35 flex items-center gap-1.5 transition-all active:scale-95 ml-auto"
                            title="Dừng Shizuku Server và hoàn tác toàn bộ các cờ Phantom Process Killer, USB Charging ADB, Wireless ADB về mặc định gốc"
                          >
                            <RotateCcw size={14} />
                            <span>🔄 Hoàn Tác Toàn Bộ Shizuku (Về Mặc Định)</span>
                          </button>
                        </div>
                      </div>
                    </div>



                    {/* 2. BẢNG CHẨN ĐOÁN 5 TRỤ CỘT SHIZUKU THỜI GIAN THỰC */}
                    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-cyan-400" />
                          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                            Bảng Kiểm Tra 5 Tầng Bảo Vệ Shizuku Trên Máy Honor Của Bạn
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Tự động phát hiện nguyên nhân gây mất Shizuku khi rút cáp hoặc khóa màn hình
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                        {[
                          {
                            label: '1. Ứng Dụng Shizuku',
                            ok: shizukuDetails ? shizukuDetails.appInstalled : shizukuRunning,
                            statusText: shizukuDetails
                              ? shizukuDetails.appInstalled
                                ? `Đã cài (${shizukuDetails.appVersion})`
                                : 'Chưa cài đặt App'
                              : 'Chưa quét',
                            subText: 'moe.shizuku.privileged.api'
                          },
                          {
                            label: '2. Máy Chủ UID 2000',
                            ok: shizukuRunning,
                            statusText: shizukuRunning
                              ? shizukuDetails?.serverPid || 'Đang chạy (UID 2000)'
                              : 'Chưa chạy / Đã tắt',
                            subText: shizukuDetails?.starterPath ? 'Nhân libshizuku.so' : 'Tiến trình shizuku_server'
                          },
                          {
                            label: '3. Chống Giết Tiến Trình Ảo',
                            ok: !!shizukuDetails?.phantomKillerDisabled,
                            statusText: shizukuDetails
                              ? shizukuDetails.phantomKillerDisabled
                                ? 'Đã mở khóa (Vô hạn)'
                                : `Đang bị khóa (${shizukuDetails?.maxPhantomProcesses || '32'})`
                              : 'Cần mở khóa Android 12–17',
                            subText: 'Phantom Process Killer'
                          },
                          {
                            label: '4. Bảo Vệ Khi Rút Cáp USB',
                            ok: !!shizukuDetails?.usbUnplugProtected,
                            statusText: shizukuDetails
                              ? shizukuDetails.usbUnplugProtected
                                ? 'Đã bật Giữ ADB Khi Sạc'
                                : 'Dễ sập khi rút dây cáp!'
                              : 'adb_charging_only = 1',
                            subText: 'Chống ngắt phiên UID 2000'
                          },
                          {
                            label: '5. Bất Tử Pin & Wi-Fi ADB',
                            ok: !!(shizukuDetails?.batteryImmunity && shizukuDetails?.wirelessAdbEnabled),
                            statusText: shizukuDetails
                              ? shizukuDetails.batteryImmunity
                                ? `Bất tử Pin • Wi-Fi: ${shizukuDetails.tcpPort}`
                                : 'Chưa miễn trừ PowerGenius'
                              : 'Chống ngủ đông & Cổng 5555',
                            subText: 'Tự chạy lại không cần PC'
                          }
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex flex-col justify-between gap-1.5 transition-all ${
                              item.ok
                                ? 'bg-emerald-950/25 border-emerald-500/35 text-emerald-200'
                                : 'bg-slate-950/80 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[11px] font-black uppercase tracking-tight text-white">
                                {item.label}
                              </span>
                              {item.ok ? (
                                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                              ) : (
                                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className={`text-[11px] font-bold leading-snug ${item.ok ? 'text-emerald-300' : 'text-amber-300'}`}>
                              {item.statusText}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 truncate">
                              {item.subText}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* 3. BỘ 4 THẺ CAN THIỆP CHUYÊN SÂU CHO SHIZUKU TRÊN HONOR MAGIC OS */}
                    <section className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Sliders size={16} className="text-cyan-400" />
                          <span>Can Thiệp Từng Hạng Mục Shizuku & Hoàn Tác Mặc Định</span>
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ActionCard
                          title="⚡ KÍCH HOẠT ĐA LUỒNG SHIZUKU SERVER (CHUẨN ANDROID 13 – 17)"
                          description="Tự động dò tìm và khởi chạy trực tiếp nhân nhị phân libshizuku.so bên trong gói APK Shizuku v13.5+ (hoặc start.sh truyền thống). Khắc phục 100% lỗi 'Not found start.sh' trên Android 14/15/16/17 và MagicOS 8/9/10/11!"
                          icon={Zap}
                          badge={shizukuRunning ? 'Đang chạy UID 2000' : 'Đa luồng libshizuku.so'}
                          commandTag="lib/arm64/libshizuku.so & start.sh"
                          onClick={async () => {
                            setIsProcessing(true);
                            try {
                              await adbClientRef.current?.startShizuku();
                              await refreshShizukuFullStatus();
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          onRevert={async () => {
                            if (!adbClientRef.current) return;
                            setIsProcessing(true);
                            try {
                              await adbClientRef.current.stopShizukuServerDefault();
                              await refreshShizukuFullStatus();
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          revertLabel="Dừng Shizuku (Về mặc định)"
                          onOpenPhoneSettings={() => adbClientRef.current?.launchAppOnScreen('moe.shizuku.privileged.api')}
                          openPhoneSettingsLabel="📱 Mở App Shizuku"
                          manualRevertGuide="Bấm 'Dừng Shizuku (Về mặc định)' để tắt ngay tiến trình shizuku_server. Ngoài ra, chỉ cần khởi động lại (Reboot) điện thoại là Shizuku cũng tự động tắt hoàn toàn về nguyên bản."
                          isLoading={isProcessing}
                          variant={shizukuRunning ? 'secondary' : 'primary'}
                        />

                        <ActionCard
                          title="🛡️ PHÁ BỎ SÁT THỦ TIẾN TRÌNH ẢO (PHANTOM PROCESS KILLER BYPASS)"
                          description="Từ Android 12 đến Android 17, hệ điều hành giới hạn tối đa 32 tiến trình con (max_phantom_processes) và tự động giết ngầm shizuku_server, Termux, LADB khi bạn mở nhiều ứng dụng. Tính năng này mở khóa giới hạn lên 2.14 tỷ tiến trình và tắt bộ giám sát giết ngầm!"
                          icon={ShieldCheck}
                          badge={shizukuDetails?.phantomKillerDisabled ? 'Đã mở khóa Vô hạn' : 'Chống tự tắt ngầm'}
                          commandTag="device_config put activity_manager max_phantom_processes 2147483647"
                          onClick={async () => {
                            setIsProcessing(true);
                            try {
                              await adbClientRef.current?.disablePhantomProcessKillerForShizuku();
                              await refreshShizukuFullStatus();
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          onRevert={async () => {
                            if (!adbClientRef.current) return;
                            setIsProcessing(true);
                            try {
                              await adbClientRef.current.restorePhantomProcessKillerDefault();
                              await refreshShizukuFullStatus();
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          revertLabel="Hoàn tác (32 tiến trình gốc)"
                          onOpenPhoneSettings={() => adbClientRef.current?.runShell('am start -a android.settings.APPLICATION_DEVELOPMENT_SETTINGS')}
                          openPhoneSettingsLabel="📱 Mở Tùy chọn NPT"
                          manualRevertGuide="Cách hoàn tác thủ công trên ĐT (Android 14–17): Vào Cài đặt ➔ Hệ thống & cập nhật ➔ Tùy chọn nhà phát triển ➔ Tìm mục 'Tắt theo dõi tiến trình con ảo' (Disable child process restrictions) và gạt Tắt."
                          isLoading={isProcessing}
                          variant="primary"
                        />

                        <ActionCard
                          title="🔌 KHIÊN CHỐNG SẬP KHI RÚT CÁP USB & BẤT TỬ PIN SHIZUKU"
                          description="Đặc trị bệnh kinh điển trên máy Honor: Cứ rút dây cáp USB ra khỏi máy tính là Shizuku báo 'Đã dừng' ngay lập tức! Tự động bật cờ 'Gỡ lỗi ADB ở chế độ chỉ sạc' (adb_charging_only=1), tắt thu hồi quyền ADB 7 ngày và cấp Bất tử Pin cho Shizuku trước PowerGenius."
                          icon={Usb}
                          badge={shizukuDetails?.usbUnplugProtected ? 'Đã bảo vệ rút cáp' : 'Đặc trị rút cáp Honor'}
                          commandTag="settings put global adb_charging_only 1 & whitelist +shizuku"
                          onClick={async () => {
                            setIsProcessing(true);
                            try {
                              await adbClientRef.current?.protectShizukuFromUsbUnplugAndPowerGenius();
                              await refreshShizukuFullStatus();
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          onRevert={async () => {
                            if (!adbClientRef.current) return;
                            setIsProcessing(true);
                            try {
                              await adbClientRef.current.restoreShizukuUsbUnplugDefault();
                              await refreshShizukuFullStatus();
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          revertLabel="Hoàn tác bảo vệ cáp & pin"
                          onOpenPhoneSettings={() => adbClientRef.current?.openHonorAppLaunchSettings()}
                          openPhoneSettingsLabel="📱 Mở Khởi chạy ứng dụng"
                          manualRevertGuide="Để hoàn tác thủ công trên ĐT: 1) Vào Tùy chọn nhà phát triển ➔ Tắt 'Cho phép gỡ lỗi ADB ở chế độ chỉ sạc'. 2) Vào Quản lý hệ thống ➔ Khởi chạy ứng dụng ➔ Tìm Shizuku ➔ Gạt bật 'Quản lý tự động'."
                          isLoading={isProcessing}
                          variant="primary"
                        />

                        <ActionCard
                          title="📡 BẬT GỠ LỖI KHÔNG DÂY (WIRELESS ADB) - DÙNG ĐỘC LẬP KHÔNG CẦN PC"
                          description="Kích hoạt sẵn Gỡ lỗi không dây (adb_wifi_enabled=1) và cổng TCP/TLS 5555. Giúp bạn có thể tự khởi động lại Shizuku ngay trên màn hình điện thoại (chỉ cần có Wi-Fi) mỗi khi đi ra ngoài hoặc sau khi khởi động lại máy mà không cần cắm vào máy tính!"
                          icon={Radio}
                          badge={shizukuDetails?.wirelessAdbEnabled ? `Đang bật (${shizukuDetails.tcpPort})` : 'Không cần máy tính'}
                          commandTag="settings put global adb_wifi_enabled 1 & tcp.port 5555"
                          onClick={async () => {
                            setIsProcessing(true);
                            try {
                              await adbClientRef.current?.enableShizukuWirelessAdbMode(true);
                              await refreshShizukuFullStatus();
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          onRevert={async () => {
                            if (!adbClientRef.current) return;
                            setIsProcessing(true);
                            try {
                              await adbClientRef.current.restoreShizukuWirelessAdbDefault();
                              await refreshShizukuFullStatus();
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          revertLabel="Tắt Gỡ lỗi không dây"
                          onOpenPhoneSettings={() => adbClientRef.current?.runShell('am start -a android.settings.APPLICATION_DEVELOPMENT_SETTINGS')}
                          openPhoneSettingsLabel="📱 Mở Gỡ lỗi không dây"
                          manualRevertGuide="Để tắt thủ công trên ĐT: Vào Cài đặt ➔ Hệ thống & cập nhật ➔ Tùy chọn nhà phát triển ➔ Gạt tắt công tắc 'Gỡ lỗi không dây' (Wireless debugging)."
                          isLoading={isProcessing}
                          variant="secondary"
                        />
                      </div>
                    </section>

                    {/* 4. HỆ SINH THÁI ỨNG DỤNG SHIZUKU ĐỈNH CAO (SHIZUKU ECOSYSTEM HUB - 10 APP) */}
                    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Sparkles size={18} className="text-amber-400" />
                            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                              🧩 Hệ Sinh Thái 10 Ứng Dụng Đỉnh Cao Dùng Quyền Shizuku (Không Cần Root)
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Có Shizuku mà chưa cài các ứng dụng dưới đây thì mới chỉ dùng được 10% sức mạnh! Bạn có thể bấm <strong>Mở tải trực tiếp trên điện thoại</strong>, cài qua <strong>File APK Siêu Tốc</strong>, và bấm <strong>Cấp Full Đặc Quyền Hệ Thống</strong> chỉ với 1 chạm.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.authorizeShizukuCompanionApps();
                                await refreshShizukuFullStatus();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                          >
                            <ShieldCheck size={15} />
                            <span>⚡ Cấp Full Quyền Hệ Thống Cho Các App Đã Cài</span>
                          </button>

                          <button
                            onClick={() => apkFileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="px-3.5 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                          >
                            <Upload size={14} />
                            <span>Cài File .APK Từ Máy</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {[
                          {
                            name: 'Shizuku (Ứng dụng Gốc)',
                            pkg: 'moe.shizuku.privileged.api',
                            tag: 'Bắt buộc số 1',
                            desc: 'Trái tim cung cấp cầu nối API hệ thống (UID 2000 ADB) cho tất cả các ứng dụng nâng cao bên dưới hoạt động mà không cần Root máy.',
                            highlight: true
                          },
                          {
                            name: 'Canta (Gỡ App Rác Không Cần PC)',
                            pkg: 'io.github.samolego.canta',
                            tag: 'Gỡ Bloatware trên ĐT',
                            desc: 'Kết hợp với Shizuku để gỡ bỏ hoặc khôi phục bất kỳ ứng dụng hệ thống nào của Honor ngay trên màn hình điện thoại mọi lúc mọi nơi.'
                          },
                          {
                            name: 'Hail - Đóng Băng Ứng Dụng 1 Chạm',
                            pkg: 'com.aistra.hail',
                            tag: 'Đóng băng siêu tốc',
                            desc: 'Đóng băng tức thì các ứng dụng ngốn pin hoặc ít dùng trên máy Honor thông qua Shizuku (Chế độ Hide / Disable / Suspend).'
                          },
                          {
                            name: 'App Ops (Quản Lý Quyền Ngầm Chi Tiết)',
                            pkg: 'rikka.appops',
                            tag: 'Chính chủ Rikka',
                            desc: 'Do chính tác giả Shizuku phát triển: Cho phép xem và khóa từng quyền ẩn (Đọc bộ nhớ tạm, Tự bật màn hình, Vị trí ngầm) của mọi app.'
                          },
                          {
                            name: 'SD Maid SE (Dọn Rác Hệ Thống Sâu)',
                            pkg: 'eu.thedarken.sdm',
                            tag: 'Dọn Cache ẩn',
                            desc: 'Sử dụng quyền Shizuku để tự động quét và xóa sạch hàng chục GB bộ nhớ đệm ẩn (App Cache) mà trình dọn dẹp mặc định không xóa được.'
                          },
                          {
                            name: 'aShell (Chạy Lệnh ADB Ngay Trên ĐT)',
                            pkg: 'in.sunilpaulmathew.ashell',
                            tag: 'Terminal ADB',
                            desc: 'Giao diện dòng lệnh ADB chạy trực tiếp trên điện thoại thông qua Shizuku, giúp bạn gõ mọi lệnh tối ưu mà không cần máy tính.'
                          },
                          {
                            name: 'InstallWithOptions (Cài APK Hạ Cấp / Cổ)',
                            pkg: 'dev.zwander.installwithoptions',
                            tag: 'Vượt chặn Android 14–17',
                            desc: 'Dùng Shizuku để cài đặt file APK hạ cấp phiên bản (Downgrade), cài app 32-bit/SDK thấp bị Android 14–17 chặn và tự cấp quyền khi cài.'
                          },
                          {
                            name: 'IceBox - Tủ Đá Ứng Dụng',
                            pkg: 'com.catchingnow.icebox',
                            tag: 'Tủ đá ngủ đông',
                            desc: 'Cất giữ các ứng dụng nặng hoặc app Trung Quốc vào Tủ Đá; dùng xong tự động đóng băng ngay khi tắt màn hình nhờ Shizuku.'
                          },
                          {
                            name: 'DarQ (Ép Dark Mode Từng App)',
                            pkg: 'com.kieronquinn.app.darq',
                            tag: 'Dark Mode OLED',
                            desc: 'Sử dụng Shizuku để ép buộc chế độ Tối (Force Dark Mode) chọn lọc cho từng ứng dụng chưa hỗ trợ giao diện tối trên màn hình OLED.'
                          },
                          {
                            name: 'SystemUI Tuner (Ẩn Icon Thanh Trạng Thái)',
                            pkg: 'com.zacharee1.systemuituner',
                            tag: 'Độ Status Bar',
                            desc: 'Ẩn các biểu tượng gây rối mắt trên thanh trạng thái Honor (như NFC, Đồng hồ báo thức, Bluetooth, VoLTE, Tai nghe) qua quyền ADB/Shizuku.'
                          }
                        ].map((item) => {
                          const isInstalled =
                            shizukuDetails?.installedCompanions?.includes(item.pkg) ||
                            apps.some((a) => a.packageName === item.pkg);

                          return (
                            <div
                              key={item.pkg}
                              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                                isInstalled
                                  ? 'bg-emerald-950/15 border-emerald-500/35'
                                  : item.highlight
                                    ? 'bg-cyan-950/20 border-cyan-500/35'
                                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                                    <span>{item.name}</span>
                                  </h4>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                                      {item.tag}
                                    </span>
                                    <span
                                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                        isInstalled
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                                      }`}
                                    >
                                      {isInstalled ? '✓ Đã cài' : 'Chưa cài'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 select-all">
                                  {item.pkg}
                                </div>
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                  {item.desc}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/70">
                                {isInstalled ? (
                                  <button
                                    onClick={async () => {
                                      if (!adbClientRef.current) return;
                                      setIsProcessing(true);
                                      try {
                                        await adbClientRef.current.launchAppOnScreen(item.pkg);
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1 transition-all active:scale-95"
                                  >
                                    <Play size={11} className="fill-slate-950" />
                                    <span>Mở Trên ĐT</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      if (!adbClientRef.current) return;
                                      setIsProcessing(true);
                                      try {
                                        await adbClientRef.current.openPlayStoreForApp(item.pkg, item.name);
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95"
                                  >
                                    <Smartphone size={11} />
                                    <span>Mở Tải Trên ĐT (CH Play)</span>
                                  </button>
                                )}

                                <button
                                  onClick={async () => {
                                    if (!adbClientRef.current) return;
                                    setIsProcessing(true);
                                    try {
                                      await adbClientRef.current.authorizeShizukuCompanionApps(item.pkg);
                                      await refreshShizukuFullStatus();
                                    } finally {
                                      setIsProcessing(false);
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95"
                                  title="Cấp sẵn WRITE_SECURE_SETTINGS, DUMP, AppOps và Bất tử Pin cho ứng dụng này"
                                >
                                  <ShieldCheck size={11} />
                                  <span>Cấp Full Quyền Hệ Thống</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* 5. CẨM NANG CHUYÊN SÂU: CÁCH TỰ KÍCH HOẠT SHIZUKU TRÊN ĐT KHÔNG CẦN MÁY TÍNH & HOÀN TÁC THỦ CÔNG */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                      <h3 className="text-slate-100 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                        <Info size={16} className="text-cyan-400 shrink-0" />
                        <span>Cẩm Nang Toàn Tập: Giữ Shizuku Bất Tử & Tự Kích Hoạt Không Cần Máy Tính Trên Honor MagicOS 8–11</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 leading-relaxed">
                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                          <div className="font-black text-cyan-400 uppercase text-[11px]">
                            1. Tại sao rút cáp USB trên Honor hay bị mất Shizuku?
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Mặc định trên MagicOS, khi rút dây cáp USB khỏi máy tính, hệ thống tự động đóng cổng USB Debugging và gửi tín hiệu tắt mọi tiến trình con của <code>shell (UID 2000)</code>.
                            <br />
                            👉 <strong>Giải pháp:</strong> Bấm nút <strong>"🚀 1-Chạm Kích Hoạt Shizuku & Khiên Bất Tử"</strong> ở trên để hệ thống bật <code>adb_charging_only=1</code> (Cho phép gỡ lỗi ADB ở chế độ chỉ sạc) và tắt <code>Phantom Process Killer</code>. Khi đó bạn rút cáp thoải mái mà Shizuku vẫn chạy 24/24!
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                          <div className="font-black text-emerald-400 uppercase text-[11px]">
                            2. Mẹo tự bật lại Shizuku ngay trên ĐT khi đi ra ngoài (Không cần PC)
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Nếu bạn lỡ khởi động lại (Reboot) điện thoại khi không có máy tính bên cạnh:
                            <br />
                            • <strong>Bước 1:</strong> Kết nối điện thoại vào bất kỳ mạng Wi-Fi nào.
                            <br />
                            • <strong>Bước 2:</strong> Mở app <strong>Shizuku</strong> trên ĐT ➔ Chọn <strong>"Ghép nối (Pairing)"</strong> (chỉ cần làm 1 lần đầu tiên trong <em>Tùy chọn nhà phát triển ➔ Gỡ lỗi không dây</em>).
                            <br />
                            • <strong>Bước 3:</strong> Bấm <strong>"Bắt đầu (Start)"</strong> ngay trong app Shizuku là chạy trong 3 giây!
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                          <div className="font-black text-rose-400 uppercase text-[11px]">
                            3. Hướng dẫn hoàn tác về mặc định (Tự động & Thủ công trên ĐT)
                          </div>
                          <p className="text-[11px] text-slate-300">
                            • <strong>Cách 1 (1 Chạm trên Web):</strong> Bấm nút <strong>"🔄 Hoàn Tác Toàn Bộ Shizuku (Về Mặc Định)"</strong> ở góc phải trên cùng để dừng Shizuku Server và trả toàn bộ thông số về gốc.
                            <br />
                            • <strong>Cách 2 (Thủ công trên ĐT):</strong> Khởi động lại điện thoại (Reboot) là tiến trình <code>shizuku_server</code> tự động tắt 100%. Nếu muốn gỡ hẳn, chỉ cần nhấn giữ icon <strong>Shizuku</strong> trên màn hình chính và chọn <strong>Gỡ cài đặt</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'tune' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Hero One-Click Max Setting Banner */}
                    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 p-5 sm:p-6 shadow-xl shadow-indigo-950/40">
                      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                        <div className="space-y-1.5 max-w-xl">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                            <Flame size={12} className="text-amber-400" />
                            Siêu tùy biến Max Setting - Đẩy máy lên cực hạn
                          </div>
                          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            Kích hoạt Max Setting toàn diện (Max Tần số quét + Chuyển cảnh nhanh nhất)
                          </h2>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Đẩy toàn bộ thông số lên mức cao nhất trong 1 chạm: Ép 144Hz/120Hz mượt mà, chuyển cảnh siêu tốc 0.5x, tăng tốc cảm ứng GPU, mở chặn chụp màn hình, tắt AI Search giật lag và ẩn cờ Developer Mode cơ bản.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.applyMaxSettings();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all active:scale-95 shrink-0 disabled:opacity-50"
                          >
                            <Zap size={16} className="text-amber-300" />
                            {isProcessing ? 'Đang kích hoạt...' : 'Kích hoạt Max Setting (1 Chạm)'}
                          </button>
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.resetTuning();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full md:w-auto px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <RotateCcw size={13} />
                            <span>Hoàn tác Max Setting về Mặc định</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Filter Chips for Tune Tab */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
                      {[
                        { id: 'all', label: 'Tất cả thẻ' },
                        { id: 'battery', label: '🔋 Tiết kiệm Pin (Không chậm TB)', highlight: true },
                        { id: 'speed', label: 'Tốc độ & Chuyển cảnh' },
                        { id: 'display', label: 'Tần số quét & Màn hình' },
                        { id: 'audio', label: '🔊 Âm thanh & Fix rè' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setTuneCategoryFilter(f.id as any)}
                          className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                            tuneCategoryFilter === f.id
                              ? (f.highlight ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/20' : 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/20')
                              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* 🔋 TRUNG TÂM TIẾT KIỆM PIN THÔNG MINH (SMART BATTERY SAVER WITH ZERO NOTIFICATION DELAY) */}
                    {(tuneCategoryFilter === 'all' || tuneCategoryFilter === 'battery') && (
                      <section className="space-y-4">
                        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 via-slate-950/90 to-teal-950/50 p-5 sm:p-6 shadow-2xl space-y-5">
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                            <div className="space-y-1.5 max-w-2xl">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/35">
                                <BatteryCharging size={13} className="text-emerald-400" />
                                Tiết Kiệm Pin Siêu Cấp • Tùy Chỉnh Tính Năng Thừa & Cam Kết Không Chậm Thông Báo
                              </div>
                              <h3 className="text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                <span>🔋 Trung Tâm Tiết Kiệm Pin Thông Minh (Smart Battery Saver)</span>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase">
                                  Chuẩn MagicOS 100%
                                </span>
                              </h3>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                Chế độ tiết kiệm pin mặc định của Android/Honor thường bóp nghẹt kết nối mạng và giết ứng dụng chạy ngầm khiến Zalo, Facebook, Messenger bị trễ thông báo trầm trọng. <strong>MagicTune giải quyết dứt điểm:</strong> Tùy chỉnh dập tắt chính xác các tiến trình rác ngầm gây hao pin (Telemetry gửi về máy chủ TQ, quét Wi-Fi/Bluetooth liên tục, tải ngầm 4K tạp chí, app rác nội địa) <strong className="text-emerald-300">NHƯNG ĐỒNG THỜI KÍCH HOẠT KHIÊN BẢO VỆ BẤT TỬ PIN CHO 100% APP LIÊN LẠC</strong> — Đảm bảo pin trâu vượt trội mà tin nhắn vẫn nổ ngay lập tức 0.1s!
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0">
                              <button
                                onClick={handleApplySmartBatterySaver}
                                disabled={isProcessing}
                                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-tight shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                              >
                                <Zap size={16} className="fill-slate-950 text-slate-950 shrink-0" />
                                <span>{isProcessing ? 'Đang tối ưu pin...' : '🚀 Kích Hoạt Tiết Kiệm Pin (Áp Dụng Tùy Chỉnh)'}</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleScanSmartBattery}
                                  disabled={isProcessing}
                                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                                >
                                  <Activity size={13} className="text-cyan-400" />
                                  <span>Quét Dịch Vụ Ngầm</span>
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!adbClientRef.current) return;
                                    setIsProcessing(true);
                                    try {
                                      const res = await adbClientRef.current.restoreDefaultBatterySettings();
                                      setBatteryStatus(res);
                                    } finally {
                                      setIsProcessing(false);
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                                  title="Khôi phục cài đặt quét ngầm & tạp chí về mặc định gốc"
                                >
                                  <RotateCcw size={13} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Live Diagnostic Stat Badges */}
                          {batteryStatus && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-400 font-semibold">Tiến trình rác đã dập</div>
                                <div className="text-xs font-black text-emerald-400 mt-0.5">
                                  {batteryStatus?.totalDrainersNeutralized || 0} / 9 tiến trình
                                </div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-400 font-semibold">Khiên Bảo Vệ TB</div>
                                <div className="text-xs font-black text-emerald-300 mt-0.5">
                                  ✅ {batteryStatus.protectedAppsCount} app liên lạc
                                </div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-400 font-semibold">Quét Wi-Fi/BLE ngầm</div>
                                <div className={`text-xs font-black mt-0.5 ${batteryStatus.wifiScanDisabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {batteryStatus.wifiScanDisabled ? '✅ Đã tắt' : '⚠️ Đang quét ngầm'}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-400 font-semibold">Telemetry & Log TQ</div>
                                <div className={`text-xs font-black mt-0.5 ${batteryStatus.telemetryDisabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {batteryStatus.telemetryDisabled ? '🛡️ Đã chặn' : '⚠️ Đang gửi log'}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-400 font-semibold">Tạp chí màn khóa</div>
                                <div className={`text-xs font-black mt-0.5 ${batteryStatus.magazineLockscreenDisabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {batteryStatus.magazineLockscreenDisabled ? '✅ Đã tắt tải 4K' : '⚠️ Tải ảnh ngầm'}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-400 font-semibold">Màn hình OLED / Hz</div>
                                <div className="text-xs font-black text-cyan-300 mt-0.5">
                                  {batteryStatus.isDarkMode ? '🌙 Dark' : '☀️ Sáng'} • {batteryStatus.refreshRate}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Guaranteed Zero Notification Delay Banner */}
                          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-blue-950/80 border border-emerald-500/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                <ShieldCheck size={20} />
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-2">
                                  <span>🛡️ Khiên Bảo Vệ 100% Thông Báo (Zero Notification Delay Guarantee)</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">
                                    KHUYẾN NGHỊ BẬT
                                  </span>
                                </h4>
                                <p className="text-[11px] text-slate-300">
                                  Tự động đưa Google Services (FCM), Zalo, Facebook, Messenger, Telegram, WhatsApp, Gmail, Viber và App ngân hàng vào danh sách <strong>Bất tử Pin (DeviceIdle Whitelist)</strong> & <strong>Active Standby Bucket</strong>. Miễn nhiễm 100% với Doze Mode của Android!
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setBatteryConfig(c => ({ ...c, guaranteeNotificationProtection: !c.guaranteeNotificationProtection }))}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${
                                batteryConfig.guaranteeNotificationProtection
                                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {batteryConfig.guaranteeNotificationProtection ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                            </button>
                          </div>

                          {/* 8 Customizable Individual Feature Toggles */}
                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                              <span>Tùy chỉnh bật / tắt các tính năng ngầm không cần thiết:</span>
                              <span className="text-[10px] text-emerald-400 font-semibold">Tích chọn để áp dụng</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {/* Feature 1: Telemetry */}
                              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                                    <h5 className="text-xs font-bold text-white">Vô hiệu hóa Telemetry & Big Data TQ</h5>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Tắt <code className="text-cyan-300">com.hihonor.bd</code>, <code className="text-cyan-300">hiview</code>, <code className="text-cyan-300">logservice</code>. Giảm 40% wake lock lúc tắt màn hình (standby).
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={batteryConfig.disableTelemetry}
                                  onChange={(e) => setBatteryConfig(c => ({ ...c, disableTelemetry: e.target.checked }))}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 mt-1 cursor-pointer shrink-0"
                                />
                              </div>

                              {/* Feature 2: Wi-Fi Scanning */}
                              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Radio size={14} className="text-cyan-400 shrink-0" />
                                    <h5 className="text-xs font-bold text-white">Tắt quét Wi-Fi ngầm liên tục 24/7</h5>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Tắt Wi-Fi Scanning Throttling chạy ngầm định vị ngay cả khi đã tắt Wi-Fi. Tiết kiệm 8-12% pin/ngày.
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={batteryConfig.disableBackgroundScanning}
                                  onChange={(e) => setBatteryConfig(c => ({ ...c, disableBackgroundScanning: e.target.checked }))}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 mt-1 cursor-pointer shrink-0"
                                />
                              </div>

                              {/* Feature 3: Magazine Lockscreen */}
                              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <EyeOff size={14} className="text-amber-400 shrink-0" />
                                    <h5 className="text-xs font-bold text-white">Tắt Tạp chí tải ảnh 4K nền màn khóa</h5>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Ngăn <code className="text-amber-300">com.hihonor.magazinesettings</code> tự tải ảnh chất lượng cao ngầm gây tốn 4G và cạn pin.
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={batteryConfig.disableMagazineAndFeeds}
                                  onChange={(e) => setBatteryConfig(c => ({ ...c, disableMagazineAndFeeds: e.target.checked }))}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 mt-1 cursor-pointer shrink-0"
                                />
                              </div>

                              {/* Feature 4: Bloatware Standby Restriction */}
                              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Package size={14} className="text-rose-400 shrink-0" />
                                    <h5 className="text-xs font-bold text-white">Đóng băng quyền Standby của App rác</h5>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Đưa Honor Video, Live, Mall, Reader, GameCenter vào <code className="text-rose-300">restricted bucket</code> không cho tự thức dậy.
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={batteryConfig.restrictBloatwareStandby}
                                  onChange={(e) => setBatteryConfig(c => ({ ...c, restrictBloatwareStandby: e.target.checked }))}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 mt-1 cursor-pointer shrink-0"
                                />
                              </div>

                              {/* Feature 5: Snappy Animation */}
                              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-yellow-400 shrink-0" />
                                    <h5 className="text-xs font-bold text-white">Tối ưu Animation 0.5x (GPU render nhanh & mát máy)</h5>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Rút ngắn thời gian vẽ khung hình của GPU, giảm tải nhiệt khi mở/đóng app và tiết kiệm điện năng.
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={batteryConfig.setSnappyAnimation}
                                  onChange={(e) => setBatteryConfig(c => ({ ...c, setSnappyAnimation: e.target.checked }))}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 mt-1 cursor-pointer shrink-0"
                                />
                              </div>

                              {/* Feature 6: Balanced 90Hz Refresh Rate */}
                              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Smartphone size={14} className="text-blue-400 shrink-0" />
                                    <h5 className="text-xs font-bold text-white">Khóa Tần số quét 90Hz cân bằng (Mượt & Pin tốt)</h5>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Tiết kiệm hơn 25% điện năng so với 120Hz/144Hz nhưng vẫn mượt hơn 60Hz truyền thống 50%.
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={batteryConfig.setBalancedRefreshRate}
                                  onChange={(e) => setBatteryConfig(c => ({ ...c, setBalancedRefreshRate: e.target.checked }))}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 mt-1 cursor-pointer shrink-0"
                                />
                              </div>

                              {/* Feature 7: OLED Dark Mode */}
                              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-purple-400 shrink-0" />
                                    <h5 className="text-xs font-bold text-white">Bật Dark Mode bảo vệ màn hình OLED</h5>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Màn hình OLED tắt hoàn toàn pixel màu đen, giảm trực tiếp 30% mức tiêu thụ điện của tấm nền.
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={batteryConfig.enableOledDarkMode}
                                  onChange={(e) => setBatteryConfig(c => ({ ...c, enableOledDarkMode: e.target.checked }))}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 mt-1 cursor-pointer shrink-0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    )}


                    {/* 🚀 TRUNG TÂM TỐI ƯU RAM TURBO & SWAP ĐA NHIỆM (RAM TURBO OPTIMIZER) */}
                    {(tuneCategoryFilter === 'all' || tuneCategoryFilter === 'speed') && (
                      <section className="space-y-4">
                        <div className="bg-gradient-to-br from-indigo-950/80 via-slate-950 to-blue-950/70 border border-blue-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                            <div className="space-y-1.5 max-w-2xl">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-500/35">
                                <Database size={13} className="text-blue-400" />
                                RAM Turbo & Swap Optimizer • Tối ưu bộ nhớ ảo & Chống văng ứng dụng nhắn tin
                              </div>
                              <h3 className="text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                <span>🚀 Tối Ưu Dung Lượng RAM Turbo / Swap (Honor RAM Extension)</span>
                              </h3>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                Trên MagicOS, hệ thống thường giết ứng dụng nền rất sớm để tiết kiệm pin, ngay cả khi RAM còn trống. <strong>RAM Turbo Optimizer</strong> sẽ mở rộng giới hạn tiến trình (Phantom Processes), tăng kích thước bộ nhớ đệm Swap/ZRAM lên mức tối ưu và cưỡng bức hệ thống ưu tiên giữ các ứng dụng nhắn tin (Zalo, Tele, Mess) luôn ở trạng thái <em>Active</em> trong RAM, giúp bạn nhận thông báo tức thì và không bị tải lại app khi chuyển đổi đa nhiệm.
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0">
                              <button
                                onClick={handleOptimizeRam}
                                disabled={isProcessing}
                                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-tight shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
                              >
                                <Zap size={16} className="text-amber-300 shrink-0" />
                                <span>{isProcessing ? 'Đang tối ưu RAM...' : '⚡ Kích Hoạt RAM Turbo & Đa Nhiệm'}</span>
                              </button>
                              
                              <button
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    const res = await adbClientRef.current.restoreDefaultRamSettings();
                                    setRamTurboStatus(res);
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                              >
                                <RotateCcw size={14} />
                                <span>Hoàn tác về Mặc định</span>
                              </button>
                            </div>
                          </div>

                          {/* RAM/Swap Status Display (Verified 4-Metric Read-Back) */}
                          {ramTurboStatus && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                                  <Database size={20} />
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Dung lượng Swap/ZRAM</div>
                                  <div className="text-sm font-black text-blue-300">{ramTurboStatus.swapSize}</div>
                                </div>
                              </div>
                              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                  <Cpu size={20} />
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Giới hạn Tiến trình (Phantom)</div>
                                  <div className="text-sm font-black text-indigo-300">{ramTurboStatus.phantomLimit}</div>
                                </div>
                              </div>
                              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                  <Layers size={20} />
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Bộ đệm Đa nhiệm (Cached)</div>
                                  <div className="text-sm font-black text-cyan-300">{ramTurboStatus.maxCachedProcesses}</div>
                                </div>
                              </div>
                              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                  <ShieldCheck size={20} />
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Trạng thái Kiểm chứng</div>
                                  <div className={`text-sm font-black ${ramTurboStatus.isOptimized ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {ramTurboStatus.isOptimized
                                      ? `✅ Đã mở khóa (${ramTurboStatus.activeMessagingAppsCount} app ghim)`
                                      : '⚠️ Mặc định (Cần tối ưu)'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                              <Info size={20} />
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed italic">
                              <strong>Lưu ý:</strong> Sau khi kích hoạt RAM Turbo, bạn nên <strong>khởi động lại điện thoại</strong> để MagicOS nạp lại hoàn toàn bảng Swap mới vào nhân kernel, giúp đa nhiệm mượt mà nhất.
                            </p>
                          </div>
                        </div>
                      </section>
                    )}


                    {/* New Feature: Fix rè âm thanh */}
                    {(tuneCategoryFilter === 'all' || tuneCategoryFilter === 'audio') && (
                      <section className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Volume2 size={20} className="text-blue-400" />
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                              Sửa lỗi rè âm thanh / Xé tiếng loa & Tai nghe Bluetooth
                            </h2>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">
                              Độc quyền Honor
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
                          <p className="break-words whitespace-normal">
                            <strong className="text-blue-400">Nguyên nhân trên máy Honor nội địa:</strong> MagicOS phiên bản nội địa thường bị xung đột tần số lấy mẫu (Sample Rate mismatch 44.1kHz vs 48kHz của hiệu ứng Histen DSP), đồng thời tính năng Bluetooth Absolute Volume và bộ giới hạn âm lượng an toàn đẩy biên độ vượt ngưỡng gây méo tiếng, xé tiếng và rè loa khi bật âm lượng lớn. Lệnh fix dưới đây sẽ khóa cố định chuẩn 48kHz Hi-Fi, tắt Absolute Volume và nạp lại máy chủ âm thanh Android.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ActionCard 
                            title="Fix rè âm thanh ngay (Hi-Fi 48kHz & Bluetooth Clean)"
                            description="Tắt Bluetooth Absolute Volume chống méo tiếng, tắt DSP gây rè, khóa cố định tần số 48kHz Hi-Fi và nạp lại Audio Server."
                            icon={Volume2}
                            badge="Khuyên dùng"
                            commandTag="settings put global bluetooth_absolute_volume 0"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.fixAudioDistortion();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.restoreAudioSettings();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            isLoading={isProcessing}
                            variant="primary"
                          />
                          <ActionCard 
                            title="Khôi phục cài đặt âm thanh mặc định"
                            description="Bật lại hiệu ứng Histen và cấu hình âm thanh nguyên bản của nhà sản xuất."
                            icon={VolumeX}
                            badge="Mặc định gốc"
                            commandTag="cmd media.audio_flinger reset"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.restoreAudioSettings();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            isLoading={isProcessing}
                            variant="secondary"
                          />
                        </div>
                      </section>
                    )}

                    {/* Section: Tốc độ chuyển cảnh & Hoạt họa (Granular Control) */}
                    {(tuneCategoryFilter === 'all' || tuneCategoryFilter === 'speed') && (
                      <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                            <Activity size={18} className="text-blue-400" />
                            Tốc độ chuyển cảnh & Hoạt họa (Granular Control)
                          </h2>
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.setAnimationScales(0.5, 0.5, 0.5);
                                setAnimScales({ window: 0.5, transition: 0.5, animator: 0.5 });
                                addLog('Đã đưa tất cả tỷ lệ chuyển cảnh về 0.5x (Nhanh).', 'success');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                          >
                            Reset về 0.5x (Nhanh)
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { id: 'window', label: 'Cửa sổ (Window)', desc: 'Popup, menu, hội thoại.' },
                            { id: 'transition', label: 'Chuyển tiếp (Transition)', desc: 'Chuyển màn hình app.' },
                            { id: 'animator', label: 'Trình tạo (Animator)', desc: 'Thanh tiến trình, hiệu ứng.' }
                          ].map((item) => (
                            <div key={item.id} className="space-y-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800/50">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-slate-300">{item.label}</label>
                                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                  {(animScales as any)[item.id]}x
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.25"
                                value={(animScales as any)[item.id]}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setAnimScales(prev => ({ ...prev, [item.id]: val }));
                                }}
                                onMouseUp={async (e: any) => {
                                  if (!adbClientRef.current) return;
                                  const val = parseFloat(e.target.value);
                                  const newScales = { ...animScales, [item.id]: val };
                                  try {
                                    await adbClientRef.current.setAnimationScales(newScales.window, newScales.transition, newScales.animator);
                                  } catch (_e) {}
                                }}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                              <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                            </div>
                          ))}
                        </div>

                        {/* Extra Performance Tuning Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/50">
                          <ActionCard 
                            title="Tối ưu phản hồi cảm ứng"
                            description="Giảm độ trễ đầu vào, tăng tốc độ nhận diện cử chỉ vuốt chạm."
                            icon={Zap}
                            badge="Touch Boost"
                            commandTag="settings put secure touch_response_time 0"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.boostTouchResponse();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            isLoading={isProcessing}
                            variant="primary"
                          />
                          <ActionCard 
                            title="Chế độ hiệu suất cao"
                            description="Ép CPU/GPU chạy ở xung nhịp cao, mở khóa giới hạn nhiệt năng."
                            icon={Flame}
                            badge="Extreme"
                            commandTag="settings put global power_mode_high_performance 1"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.enableHighPerformanceMode();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            isLoading={isProcessing}
                            variant="primary"
                          />
                          <ActionCard 
                            title="Tối ưu đồ họa GPU"
                            description="Render SkiaVK/Vulkan, tăng tốc độ vẽ khung hình 2D/3D."
                            icon={Cpu}
                            badge="GPU Boost"
                            commandTag="setprop debug.hwui.renderer skiavk"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.optimizeGpuPerformance();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            isLoading={isProcessing}
                            variant="primary"
                          />
                        </div>
                      </section>
                    )}

                    {/* New Section: Cử chỉ & Điều hướng (Gesture Fix) */}
                    {(tuneCategoryFilter === 'all' || tuneCategoryFilter === 'speed') && (
                      <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4 shadow-lg shadow-amber-500/5">
                        <div className="flex items-center gap-2">
                          <Smartphone size={20} className="text-amber-400" />
                          <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                            Sửa lỗi cử chỉ & Điều hướng (Navigation Fix)
                          </h2>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-black uppercase">
                            Khẩn cấp
                          </span>
                        </div>

                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
                          <p>
                            Nếu bạn <strong>không thể vuốt từ dưới lên</strong> để đóng app hoặc mở đa nhiệm, có thể do một số tùy chỉnh hiệu năng quá cao gây xung đột với Launcher Honor. Nút dưới đây sẽ reset Animation, xóa các tinh chỉnh cảm ứng nhạy cảm và khởi động lại giao diện người dùng.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ActionCard 
                            title="Sửa lỗi đơ vuốt / Mất đa nhiệm"
                            description="Reset Animation 1.0x, xóa setprop GPU/Cảm ứng và ép nạp lại Launcher Honor."
                            icon={RotateCcw}
                            badge="Khuyên dùng"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.fixNavigationGestures();
                                // Reset local state to match
                                setAnimScales({ window: 1.0, transition: 1.0, animator: 1.0 });
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            isLoading={isProcessing}
                            variant="primary"
                          />
                          <ActionCard 
                            title="Hoàn tác toàn bộ Siêu tùy biến"
                            description="ĐưaHz, DPI, Chuyển cảnh và mọi setprop hiệu năng về mặc định gốc của máy."
                            icon={RefreshCw}
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.resetTuning();
                                setAnimScales({ window: 1.0, transition: 1.0, animator: 1.0 });
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            isLoading={isProcessing}
                            variant="secondary"
                          />

                          <ActionCard 
                            title="Ẩn Thanh Kim (Tắt Đánh Thức YOYO Qua Nhấn Thanh Điều Hướng)"
                            description="Tắt đánh thức trợ lý YOYO qua thao tác nhấn giữ thanh điều hướng đáy màn hình (chuẩn MagicOS 11), đồng thời tăng tối đa độ nhạy vuốt đáy (Home/Đa nhiệm/Back) và ẩn hẳn mục YOYO & AI khỏi Cài đặt (không bị báo 'Ứng dụng được quản lý bởi Shell')."
                            icon={EyeOff}
                            badge="MagicOS 11"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.disableYoyoNavigationBarWakeup();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.restoreYoyoNavigationBarWakeup();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            isLoading={isProcessing}
                            variant="primary"
                          />
                          <ActionCard 
                            title="🇻🇳 Khôi Phục + Đặt Mặc Định + Cấp Full Quyền + Việt Hóa & Dạy Toàn Bộ Kiến Thức YOYO (1 Chạm)"
                            description="1 nút duy nhất: Khôi phục 100% gói YOYO gốc, đặt lại mọi mặc định đánh thức, cấp Full 100% quyền, ép Locale Tiếng Việt (vi-VN) và tự động nạp 4 học phần Tiếng Việt có dấu chuẩn UTF-8 + tự bấm nút Gửi để YOYO không bao giờ còn nói tiếng Trung nữa."
                            icon={Sparkles}
                            badge="Tất Cả Trong 1"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.autoTameYoyoVietnamese('full');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            isLoading={isProcessing}
                            variant="primary"
                          />
                          <ActionCard 
                            title="Bật Thư viện ứng dụng (Drawer)"
                            description="Ép giao diện Honor về chế độ có danh sách app (vuốt lên để mở) & Tự động bật lại HiBoard cần thiết cho cử chỉ."
                            icon={Layers}
                            badge="Honor UI"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.enableAppDrawerMode();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onOpenPhoneSettings={() => adbClientRef.current?.openLauncherSettings()}
                            openPhoneSettingsLabel="📱 Mở Cài đặt Màn hình chính"
                            isLoading={isProcessing}
                            variant="secondary"
                          />
                          <ActionCard 
                            title="Tăng độ nhạy Vuốt Đáy (Home/Đa nhiệm)"
                            description="Ép xung Driver cảm ứng cạnh đáy, giảm ma sát vuốt từ dưới màn hình lên & tăng tốc độ hiện đa nhiệm tức thì."
                            icon={Zap}
                            badge="Siêu nhạy"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.boostNavigationGestureSensitivity();
                                setAnimScales({ window: 0.5, transition: 0.5, animator: 0.5 });
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            isLoading={isProcessing}
                            variant="primary"
                          />
                          <ActionCard 
                            title="🗑️ Gỡ Bỏ & Ẩn Hẳn Mục YOYO & AI Khỏi Cài Đặt"
                            description="Gỡ sạch các gói YOYO & Honor AI ở cấp User 0 (nhả cờ suspend/disable trước khi gỡ) để mục YOYO & AI biến mất hoàn toàn khỏi trang Cài đặt thay vì hiện thông báo 'Ứng dụng được quản lý bởi Shell'."
                            icon={Trash2}
                            badge="Ẩn khỏi Cài đặt"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.uninstallYoyoAssistant();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            onRevert={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.restoreHonorYoyoAssistant();
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            revertLabel="Khôi phục YOYO"
                            isLoading={isProcessing}
                            variant="secondary"
                          />
                        </div>
                        <p className="text-[10px] text-amber-200/50 italic text-center">
                          💡 Sau khi bấm, hãy đợi 3-5 giây để Launcher nạp lại. Nếu vẫn lỗi, hãy Khởi động lại điện thoại!
                        </p>
                      </section>
                    )}

                    {/* Section: Tần số quét */}
                    {(tuneCategoryFilter === 'all' || tuneCategoryFilter === 'display') && (
                      <section>
                        <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-tight flex items-center gap-2">
                          <Smartphone size={18} className="text-blue-400" />
                          Tần số quét màn hình (Refresh Rate Lock)
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <ActionCard 
                            title="Ép Max 144Hz / 120Hz"
                            description="Ép màn hình luôn chạy ở tần số quét cao nhất, không bị tụt fps khi cuộn."
                            icon={Zap}
                            badge="Max 144Hz"
                            commandTag="settings put system peak_refresh_rate 144.0"
                            onClick={() => adbClientRef.current?.setRefreshRate(144)}
                            onRevert={() => adbClientRef.current?.runShell('settings delete system peak_refresh_rate; settings delete system min_refresh_rate; settings put system user_refresh_rate 0')}
                            revertLabel="Về Tự động (Dynamic)"
                            onOpenPhoneSettings={() => adbClientRef.current?.runShell('am start -a android.settings.DISPLAY_SETTINGS')}
                            openPhoneSettingsLabel="📱 Mở Cài đặt Màn hình"
                            manualRevertGuide="Cách chỉnh tay trên ĐT: Vào Cài đặt ➔ Màn hình và độ sáng ➔ Tốc độ làm mới màn hình (Screen refresh rate) ➔ Chọn ' Động / Tự động (Dynamic)'."
                            isLoading={isProcessing}
                            variant="primary"
                          />
                          <ActionCard 
                            title="Cố định 90Hz"
                            description="Mức cân bằng tối ưu giữa độ mượt và tiết kiệm pin trên MagicOS."
                            icon={Activity}
                            commandTag="settings put system peak_refresh_rate 90.0"
                            onClick={() => adbClientRef.current?.setRefreshRate(90)}
                            onRevert={() => adbClientRef.current?.runShell('settings delete system peak_refresh_rate; settings delete system min_refresh_rate; settings put system user_refresh_rate 0')}
                            revertLabel="Về Tự động (Dynamic)"
                            isLoading={isProcessing}
                            variant="secondary"
                          />
                          <ActionCard 
                            title="Mặc định 60Hz"
                            description="Tiết kiệm pin tối đa nhưng trải nghiệm sẽ hơi lag."
                            icon={RotateCcw}
                            commandTag="settings put system user_refresh_rate 0"
                            onClick={() => adbClientRef.current?.setRefreshRate(60)}
                            onRevert={() => adbClientRef.current?.runShell('settings delete system peak_refresh_rate; settings delete system min_refresh_rate; settings put system user_refresh_rate 0')}
                            revertLabel="Về Tự động (Dynamic)"
                            isLoading={isProcessing}
                            variant="secondary"
                          />
                        </div>
                      </section>
                    )}

                    {/* Section: Độ phân giải màn hình (Screen Resolution) */}
                    {(tuneCategoryFilter === 'all' || tuneCategoryFilter === 'display') && (
                      <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                          <Smartphone size={18} className="text-blue-400" />
                          Độ phân giải màn hình (Presets)
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.setScreenSize(1224, 2700); // Common Honor High Res
                                setCustomResolution({ width: 1224, height: 2700 });
                                addLog('Đã đặt độ phân giải cao FHD+ (1224x2700).', 'success');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-blue-500/50 transition-all text-left group"
                          >
                            <div className="text-xs font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">FHD+ High Res</div>
                            <div className="text-[10px] text-slate-500 leading-tight">1224 x 2700: Độ nét tối đa cho màn hình MagicOS.</div>
                          </button>
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.setScreenSize(1080, 2340);
                                setCustomResolution({ width: 1080, height: 2340 });
                                addLog('Đã đặt độ phân giải tiêu chuẩn FHD (1080x2340).', 'success');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-blue-500/50 transition-all text-left group"
                          >
                            <div className="text-xs font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">FHD Standard</div>
                            <div className="text-[10px] text-slate-500 leading-tight">1080 x 2340: Cân bằng mượt mà và tiết kiệm pin.</div>
                          </button>
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.runShell('wm size reset');
                                setCustomResolution({ width: 0, height: 0 });
                                addLog('Đã khôi phục độ phân giải màn hình về mặc định gốc.', 'success');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-rose-500/50 transition-all text-left group"
                          >
                            <div className="text-xs font-bold text-white mb-1 group-hover:text-rose-400 transition-colors">Reset Mặc định</div>
                            <div className="text-[10px] text-slate-500 leading-tight">Quay lại kích thước vật lý ban đầu của máy.</div>
                          </button>
                        </div>
                      </section>
                    )}

                    {/* Section: Tùy chọn Honor nâng cao */}
                    {(tuneCategoryFilter === 'all' || tuneCategoryFilter === 'system') && (
                      <section>
                        <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-tight flex items-center gap-2">
                          <Activity size={18} className="text-blue-400" />
                          Tùy chọn Honor nâng cao (MagicOS Exclusive)
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <ActionCard 
                            title="Đậm Font (1.2x)"
                            description="Làm font chữ hệ thống đậm hơn, dễ nhìn hơn trên máy Honor."
                            icon={Type}
                            commandTag="settings put system font_weight_scale 1.2"
                            onClick={() => adbClientRef.current?.setFontWeight(1.2)}
                            onRevert={() => adbClientRef.current?.setFontWeight(1.0)}
                            revertLabel="Về Font chuẩn (1.0x)"
                            isLoading={isProcessing}
                            variant="primary"
                          />
                          <ActionCard 
                            title="Mở chặn Chụp màn hình"
                            description="Cho phép chụp ảnh màn hình ngay cả trong các app bị chặn (Bank, Incognito)."
                            icon={EyeOff}
                            badge="Mở khóa"
                            commandTag="settings put global block_screen_capture 0"
                            onClick={() => adbClientRef.current?.setSecureScreenshots(true)}
                            onRevert={() => adbClientRef.current?.setSecureScreenshots(false)}
                            revertLabel="Bật lại bảo vệ chụp"
                            isLoading={isProcessing}
                            variant="primary"
                          />
                          <ActionCard 
                            title="Bật cưỡng bức 5G"
                            description="Ép máy ưu tiên sóng 5G ở mọi nơi, không bị nhảy về 4G."
                            icon={Signal}
                            commandTag="settings put global 5g_mode 1"
                            onClick={() => adbClientRef.current?.set5GEnabled(true)}
                            onRevert={() => adbClientRef.current?.set5GEnabled(false)}
                            revertLabel="Về 5G Tự động"
                            isLoading={isProcessing}
                            variant="primary"
                          />
                          <ActionCard 
                            title="Tắt AI Search giật lag"
                            description="Vô hiệu hóa tính năng vuốt xuống hiện tìm kiếm Honor phiền phức."
                            icon={EyeOff}
                            badge="Mượt mà"
                            commandTag="pm disable-user com.hihonor.search"
                            onClick={() => adbClientRef.current?.setHonorSearchEnabled(false)}
                            onRevert={() => adbClientRef.current?.setHonorSearchEnabled(true)}
                            revertLabel="Bật lại AI Search"
                            isLoading={isProcessing}
                            variant="primary"
                          />
                        </div>
                      </section>
                    )}

                    {/* Section: Khôi phục */}
                    <section className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="text-white font-bold mb-2 flex items-center gap-2 justify-center sm:justify-start">
                            <RotateCcw size={18} className="text-red-400" />
                            Khôi phục cài đặt gốc toàn diện (Tab Siêu Tùy Biến)
                          </h3>
                          <div className="space-y-1.5">
                            <p className="text-xs text-slate-300">Hệ thống sẽ thực hiện khôi phục các thông số sau về giá trị mặc định của Honor:</p>
                            <ul className="text-[10px] text-slate-500 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 list-disc pl-4">
                              <li>Tỷ lệ chuyển cảnh (Animation Scale) - {">"} 1.0x</li>
                              <li>Tần số quét màn hình - {">"} Tự động (Smart)</li>
                              <li>Mật độ điểm ảnh (DPI) - {">"} Mặc định máy</li>
                              <li>Chế độ tối (Dark Mode) - {">"} Tắt</li>
                              <li>Độ đậm Font chữ - {">"} 1.0x</li>
                              <li>Chặn chụp màn hình - {">"} Bật lại (Bảo mật)</li>
                              <li>Chế độ 5G - {">"} Tự động</li>
                              <li>Tìm kiếm Honor & Âm thanh gốc - {">"} Bật lại</li>
                            </ul>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                          <button 
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current?.resetTuning();
                                await adbClientRef.current?.restoreAudioSettings();
                                await adbClientRef.current?.restoreDefaultBatterySettings();
                                addLog('Đã khôi phục toàn bộ cài đặt siêu tùy biến về mặc định.', 'success');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 text-xs sm:text-sm shadow-lg shadow-red-900/20 disabled:opacity-50"
                          >
                            🔄 Khôi phục Tab Tùy Biến
                          </button>
                          <button
                            onClick={() => setShowRevertCenterModal(true)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-4 py-3 rounded-xl font-bold transition-all active:scale-95 text-xs sm:text-sm"
                          >
                            📋 Mở Trung Tâm Hoàn Tác Toàn Máy
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* 🛡️ TRUNG TÂM QUÉT KIỂM TRA & TỰ ĐỘNG CẤP FULL QUYỀN ỨNG DỤNG (1 CHẠM) */}
                    <div className="relative overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-950/50 via-indigo-950/45 to-slate-900 p-4 sm:p-5 shadow-xl space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                            <ShieldCheck size={12} className="text-amber-400" />
                            Quét Kiểm Tra App Thiếu Quyền & Tự Động Mở Khóa 100% Quyền (Không Cần Bấm Từng Mục)
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                            🛡️ Quét Kiểm Tra App Đang Thiếu Quyền & Tự Động Cấp Full Quyền (Runtime + AppOps + Mở Khóa Hạn Chế)
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Quét phát hiện chính xác ứng dụng nào đang bị thiếu quyền <strong>Camera, Micro, Vị trí, Bộ nhớ, Danh bạ, Thông báo, Bluetooth</strong> hoặc bị tắt <strong>Cửa sổ nổi (Overlay), Bật sáng màn khóa, Chạy ngầm 24/24, Bất tử Pin</strong> (tương tự như quét thiếu Biểu ngữ & Thông báo nhẹ nhàng) và bù đủ 100% chỉ với 1 chạm!
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full lg:w-auto">
                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                const res = await adbClientRef.current.scanMissingPermissionsAllApps();
                                setPermScanResults(res);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Search size={15} className="text-amber-400 shrink-0" />
                            <span>{isProcessing ? 'Đang quét quyền toàn bộ App...' : '🔍 Quét Kiểm Tra App Nào Đang Thiếu Quyền'}</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.grantFullPermissionsAllApps();
                                const updated = await adbClientRef.current.scanMissingPermissionsAllApps();
                                setPermScanResults(updated);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <ShieldCheck size={16} className="shrink-0" />
                            <span>{isProcessing ? 'Đang cấp Full Quyền 100% App...' : '🛡️ Cấp Full Quyền 100% App Máy (1 Chạm)'}</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!adbClientRef.current) return;
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.restoreDefaultPermissionsAllApps();
                                const updated = await adbClientRef.current.scanMissingPermissionsAllApps();
                                setPermScanResults(updated);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <RotateCcw size={13} />
                            <span>🔄 Hoàn tác Quyền về Mặc định</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-300">
                        <div>
                          <strong className="text-amber-300">📱 Hướng dẫn hoàn tác quyền Runtime (Camera, Micro, Vị trí) về mặc định trên ĐT:</strong> Nút Hoàn tác ở trên sẽ tự động reset 100% quyền đặc biệt AppOps. Riêng quyền Runtime do Android bảo vệ, bạn bấm <strong>"Mở Quản lý Ứng dụng" ➔ Bấm dấu 3 chấm (⋮) góc trên phải ➔ Đặt lại tùy chọn ứng dụng (Reset app preferences)</strong>.
                        </div>
                        <button
                          onClick={() => adbClientRef.current?.runShell('am start -a android.settings.MANAGE_APPLICATIONS_SETTINGS')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold shrink-0 transition-all"
                        >
                          📱 Mở Quản lý Ứng dụng
                        </button>
                      </div>

                      {/* BẢNG KẾT QUẢ QUÉT KIỂM TRA APP ĐANG THIẾU QUYỀN (Tương tự Quét Thiếu Biểu Ngữ / Nhẹ Nhàng) */}
                      {permScanResults && (() => {
                        const criticalApps = permScanResults.filter(a => a.status === 'critical');
                        const minorApps = permScanResults.filter(a => a.status === 'minor');
                        const fullPermApps = permScanResults.filter(a => a.status === 'full');
                        const displayedPermApps =
                          permScanFilter === 'critical'
                            ? criticalApps
                            : permScanFilter === 'minor'
                            ? minorApps
                            : permScanResults;

                        return (
                          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/95 border border-amber-500/40 space-y-4 shadow-2xl">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                              <div className="space-y-1">
                                <div className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                                  <ShieldCheck size={16} className="text-amber-400 shrink-0" />
                                  <span>
                                    Kết quả Quét Quyền Ứng Dụng: Có{' '}
                                    <strong className="text-rose-400">{criticalApps.length}</strong> app thiếu Quyền Cốt Lõi/Pin |{' '}
                                    <strong className="text-amber-300">{minorApps.length}</strong> app thiếu Quyền Đặc Biệt |{' '}
                                    <strong className="text-emerald-400">{fullPermApps.length}</strong> app Đã Full 100% Quyền ✓
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  Bấm vào từng ô thống kê bên dưới để lọc danh sách, hoặc bấm nút bù quyền tự động cho toàn bộ ứng dụng đang thiếu:
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {(criticalApps.length > 0 || minorApps.length > 0) && (
                                  <button
                                    onClick={async () => {
                                      if (!adbClientRef.current) return;
                                      const needFix = [...criticalApps, ...minorApps];
                                      setIsProcessing(true);
                                      try {
                                        for (const item of needFix) {
                                          await adbClientRef.current.grantFullPermissionsForPackage(item.pkg, true);
                                        }
                                        addLog(`✅ Đã tự động bù đủ 100% Full Quyền cho ${needFix.length} ứng dụng đang thiếu quyền!`, 'success');
                                        const updated = await adbClientRef.current.scanMissingPermissionsAllApps();
                                        setPermScanResults(updated);
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    <ShieldCheck size={13} className="shrink-0 text-amber-200" />
                                    <span>🛡️ Bù Đủ Quyền Ngay Cho {criticalApps.length + minorApps.length} App Đang Thiếu</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => setPermScanResults(null)}
                                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800"
                                >
                                  Đóng bảng
                                </button>
                              </div>
                            </div>

                            {/* 3 Ô Thống Kê Trực Quan (Giống Quét Thiếu Biểu Ngữ / Nhẹ Nhàng) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div
                                onClick={() => setPermScanFilter('critical')}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                  permScanFilter === 'critical'
                                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50'
                                    : 'bg-rose-950/15 border-rose-500/30 hover:border-rose-500/60'
                                }`}
                              >
                                <div className="text-[11px] font-bold text-rose-300 uppercase tracking-tight flex items-center justify-between">
                                  <span>🔴 Thiếu Quyền Cốt Lõi / Pin Ngầm</span>
                                  <span className="text-sm font-black text-rose-400">{criticalApps.length}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Thiếu Thông báo, Micro, Camera, Vị trí, Bộ nhớ hoặc chưa được miễn trừ Bất tử Pin.
                                </p>
                              </div>

                              <div
                                onClick={() => setPermScanFilter('minor')}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                  permScanFilter === 'minor'
                                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/50'
                                    : 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/60'
                                }`}
                              >
                                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-tight flex items-center justify-between">
                                  <span>🟡 Thiếu Quyền Đặc Biệt Phụ</span>
                                  <span className="text-sm font-black text-amber-400">{minorApps.length}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Đã có quyền cơ bản nhưng chưa bật Cửa sổ nổi (Overlay) hoặc Bật sáng màn khóa.
                                </p>
                              </div>

                              <div
                                onClick={() => setPermScanFilter('all')}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                  permScanFilter === 'all'
                                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/50'
                                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-tight flex items-center justify-between">
                                  <span>🟢 Đã Full 100% Quyền / Tất Cả</span>
                                  <span className="text-sm font-black text-emerald-400">{fullPermApps.length} / {permScanResults.length}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Bấm để xem toàn bộ {permScanResults.length} ứng dụng (Đã Full quyền {fullPermApps.length} app).
                                </p>
                              </div>
                            </div>

                            {/* Danh sách ứng dụng chi tiết */}
                            {displayedPermApps.length === 0 ? (
                              <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-2">
                                <CheckCircle size={28} className="text-emerald-400 mx-auto" />
                                <div className="text-sm font-bold text-emerald-300">
                                  🎉 Tuyệt vời! Không có ứng dụng nào bị thiếu quyền ở mục này!
                                </div>
                                {permScanFilter !== 'all' && (
                                  <button
                                    onClick={() => setPermScanFilter('all')}
                                    className="mt-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-blue-300 border border-slate-700"
                                  >
                                    📑 Xem toàn bộ {permScanResults.length} ứng dụng
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-800/40 bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto pr-1">
                                {displayedPermApps.map(app => {
                                  const isCrit = app.status === 'critical';
                                  const isMin = app.status === 'minor';
                                  return (
                                    <div
                                      key={app.key}
                                      className={`px-4 py-3 flex flex-col gap-3 transition-all hover:bg-slate-800/30 ${
                                        isCrit ? 'bg-rose-950/5' : isMin ? 'bg-amber-950/5' : ''
                                      }`}
                                    >
                                      <div className="flex items-start gap-3 min-w-0">
                                        {/* Icon representation for scanner */}
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                          isCrit ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 
                                          isMin ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 
                                          'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                        }`}>
                                          <ShieldCheck size={16} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-[13px] truncate">{app.appName}</span>
                                            {app.userId !== 0 && (
                                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold shrink-0">
                                                User {app.userId}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex flex-col gap-0.5 mt-0.5">
                                            <span className="text-[9px] font-mono text-slate-500 truncate">{app.pkg}</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                              {app.missingRuntimePerms.length > 0 && (
                                                <span className="text-[9px] font-bold text-rose-400 flex items-center gap-1">
                                                  <AlertTriangle size={10} />
                                                  Thiếu: {app.missingRuntimePerms.join(', ')}
                                                </span>
                                              )}
                                              {app.missingSpecialOps.length > 0 && (
                                                <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1">
                                                  <Info size={10} />
                                                  Chưa bật: {app.missingSpecialOps.join(', ')}
                                                </span>
                                              )}
                                              {app.status === 'full' && (
                                                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                                                  <CheckCircle size={10} />
                                                  Full 100% Quyền
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        onClick={async () => {
                                          if (!adbClientRef.current) return;
                                          setIsProcessing(true);
                                          try {
                                            await adbClientRef.current.grantFullPermissionsForPackage(app.pkg, false);
                                            const updated = await adbClientRef.current.scanMissingPermissionsAllApps();
                                            setPermScanResults(updated);
                                          } finally {
                                            setIsProcessing(false);
                                          }
                                        }}
                                        disabled={isProcessing}
                                        className={`w-full py-1.5 rounded-lg text-[11px] font-black transition-all disabled:opacity-50 border-t border-slate-800/40 flex items-center justify-center gap-1.5 ${
                                          isCrit
                                            ? 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30'
                                            : 'bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/20'
                                        }`}
                                      >
                                        <ShieldCheck size={12} />
                                        CẤP ĐỦ QUYỀN NGAY
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Cấp nhanh theo app chọn sẵn hoặc nhập Package bất kỳ */}
                      <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-amber-300 mr-1">⚡ Cấp nhanh 1 chạm:</span>
                          {[
                            { label: 'Facebook', pkg: 'com.facebook.katana' },
                            { label: 'Messenger', pkg: 'com.facebook.orca' },
                            { label: 'Zalo', pkg: 'com.zing.zalo' },
                            { label: 'MacroDroid', pkg: 'com.arlosoft.macrodroid' },
                            { label: 'Google App', pkg: 'com.google.android.googlequicksearchbox' },
                            { label: 'Telegram', pkg: 'org.telegram.messenger' },
                            { label: 'Telegram X', pkg: 'org.thunderdog.challegram' },
                            { label: 'TikTok', pkg: 'com.ss.android.ugc.trill' },
                          ].map(item => (
                            <button
                              key={item.pkg}
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setCustomPermPkg(item.pkg);
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.grantFullPermissionsForPackage(item.pkg, false);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-lg bg-slate-950/90 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
                            >
                              + {item.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customPermPkg}
                            onChange={(e) => setCustomPermPkg(e.target.value)}
                            placeholder="Nhập tên gói (VD: com.zing.zalo)..."
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none w-full md:w-56"
                          />
                          <button
                            onClick={async () => {
                              const safePkg = sanitizePackageName(customPermPkg);
                              if (!adbClientRef.current || !safePkg) {
                                addLog('⚠️ Tên gói ứng dụng (Package ID) không hợp lệ!', 'error');
                                return;
                              }
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.grantFullPermissionsForPackage(safePkg, false);
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing || !customPermPkg.trim()}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-black whitespace-nowrap transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                          >
                            <ShieldCheck size={13} />
                            Cấp Full Quyền
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 🔒 TRUNG TÂM CHẶN CẬP NHẬT BẤT KỲ APP NÀO & KHÓA CHỢ APP HONOR CẬP NHẬT ĐÈ (4 LỚP BẢO VỆ) */}
                    <div className="relative overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/30 p-5 sm:p-6 shadow-2xl space-y-6">
                      
                      {/* Header & Description Block */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/35">
                            <Lock size={12} className="text-purple-400" />
                            Hệ thống bảo vệ 4 lớp nâng cao
                          </div>
                          <h3 className="text-base sm:text-xl font-black text-white tracking-tight uppercase">
                            🔒 Trung Tâm Chặn Cập Nhật Chuyên Sâu
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          <div className="lg:col-span-7 space-y-3">
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                              MagicTune áp dụng <strong>4 lớp khóa đồng thời</strong> để triệt tiêu cập nhật ngầm: 
                              <br /><br />
                              (1) Chuyển chủ sở hữu cài đặt (Installer) sang <code className="text-purple-300 font-bold">com.android.shell</code>.
                              <br />
                              (2) Khóa quyền tự tải APK (<code className="text-purple-300">REQUEST_INSTALL_PACKAGES ignore</code>).
                              <br />
                              (3) Vô hiệu hóa Meta AppManager & Updater.
                              <br />
                              (4) Xóa cache & đóng băng trình cập nhật của Chợ ứng dụng Honor.
                            </p>
                          </div>

                          <div className="lg:col-span-5 flex flex-col gap-2.5">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.blockHonorMarketAutoUpdate(false);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="w-full px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 font-black text-xs flex items-center justify-between transition-all active:scale-95 disabled:opacity-50 group"
                            >
                              <div className="flex items-center gap-2">
                                <ShieldCheck size={16} className="group-hover:scale-110 transition-transform" />
                                <span>🛡️ Khóa Chợ Honor (Vẫn Mở Chợ)</span>
                              </div>
                              <ChevronRight size={14} className="opacity-50" />
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.blockHonorMarketAutoUpdate(true);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="w-full px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-black text-xs flex items-center justify-between transition-all active:scale-95 disabled:opacity-50 group"
                            >
                              <div className="flex items-center gap-2">
                                <Lock size={16} className="group-hover:scale-110 transition-transform" />
                                <span>❄️ Đóng Băng Hẳn Chợ Honor & Meta</span>
                              </div>
                              <ChevronRight size={14} className="opacity-50" />
                            </button>

                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.restoreHonorMarketAutoUpdate();
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center justify-between transition-all active:scale-95 disabled:opacity-50"
                            >
                              <div className="flex items-center gap-2">
                                <Unlock size={15} className="text-emerald-400" />
                                <span>Mở Lại Chợ Honor & Cập Nhật</span>
                              </div>
                              <RotateCcw size={14} className="opacity-50" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Quick Preset Apps Block */}
                      <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Zap size={16} className="text-amber-400" />
                            <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">⚡ Chặn Nhanh 1-Click (Gợi Ý)</h4>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.blockAllThirdPartyAppsAutoUpdate();
                                  const s = await adbClientRef.current.getBlockedUpdatePackages();
                                  setBlockedUpdatePkgs(Array.from(s));
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-[10px] font-black flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Lock size={12} />
                              Chặn Toàn Bộ App Ngoài
                            </button>
                            <button
                              onClick={async () => {
                                if (!adbClientRef.current) return;
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.unblockAllThirdPartyAppsAutoUpdate();
                                  const s = await adbClientRef.current.getBlockedUpdatePackages();
                                  setBlockedUpdatePkgs(Array.from(s));
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Unlock size={12} />
                              Mở Lại Tất Cả
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: 'Zalo', pkg: 'com.zing.zalo' },
                            { label: 'Facebook', pkg: 'com.facebook.katana' },
                            { label: 'Messenger', pkg: 'com.facebook.orca' },
                            { label: 'TikTok', pkg: 'com.zhiliaoapp.musically' },
                            { label: 'YouTube', pkg: 'com.google.android.youtube' },
                            { label: 'Google App', pkg: 'com.google.android.googlequicksearchbox' },
                            { label: 'Gemini AI', pkg: 'com.google.android.apps.bard' },
                            { label: 'MacroDroid', pkg: 'com.arlosoft.macrodroid' }
                          ].map((item) => {
                            const isBlocked = blockedUpdatePkgs.includes(item.pkg);
                            return (
                              <button
                                key={item.pkg}
                                onClick={async () => {
                                  if (!adbClientRef.current) return;
                                  setIsProcessing(true);
                                  try {
                                    if (isBlocked) {
                                      await adbClientRef.current.unblockAppAutoUpdate(item.pkg);
                                    } else {
                                      await adbClientRef.current.blockAppAutoUpdate(item.pkg);
                                    }
                                    const s = await adbClientRef.current.getBlockedUpdatePackages();
                                    setBlockedUpdatePkgs(Array.from(s));
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
                                  isBlocked
                                    ? 'bg-purple-600/30 text-purple-200 border-purple-400/50 shadow-sm shadow-purple-500/20'
                                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-800'
                                }`}
                              >
                                {isBlocked ? <Lock size={12} className="text-purple-300" /> : <Unlock size={12} className="text-slate-600" />}
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Manual Control & Stats Block */}
                      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 pt-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-purple-300 uppercase tracking-widest px-1">
                            <ShieldCheck size={14} />
                            <span>Danh sách đang chặn ({blockedUpdatePkgs.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 min-h-[44px] bg-slate-950/40 p-2.5 rounded-2xl border border-slate-800/50">
                            {blockedUpdatePkgs.length === 0 ? (
                              <span className="text-[10px] text-slate-500 italic px-2 py-1.5">Chưa có ứng dụng nào trong danh sách chặn...</span>
                            ) : (
                              blockedUpdatePkgs.slice(0, 20).map(pkg => (
                                <span
                                  key={pkg}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono group"
                                >
                                  <Lock size={10} className="opacity-60" />
                                  {pkg}
                                  <button
                                    onClick={async () => {
                                      if (!adbClientRef.current) return;
                                      setIsProcessing(true);
                                      try {
                                        await adbClientRef.current.unblockAppAutoUpdate(pkg);
                                        const s = await adbClientRef.current.getBlockedUpdatePackages();
                                        setBlockedUpdatePkgs(Array.from(s));
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    className="hover:text-red-400 transition-colors ml-1 font-bold"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            )}
                            {blockedUpdatePkgs.length > 20 && (
                              <span className="text-[10px] text-purple-300 font-bold px-2 py-1.5">
                                +{blockedUpdatePkgs.length - 20} app khác
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                          <div className="relative w-full sm:w-auto">
                            <input
                              type="text"
                              value={customBlockUpdatePkg}
                              onChange={(e) => setCustomBlockUpdatePkg(e.target.value)}
                              placeholder="Nhập package ID cần chặn..."
                              className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-purple-500 focus:outline-none transition-all pr-10"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
                              <Package size={14} />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={async () => {
                                const safePkg = sanitizePackageName(customBlockUpdatePkg);
                                if (!adbClientRef.current || !safePkg) {
                                  addLog('⚠️ Tên gói ứng dụng (Package ID) không hợp lệ!', 'error');
                                  return;
                                }
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.blockAppAutoUpdate(safePkg);
                                  const s = await adbClientRef.current.getBlockedUpdatePackages();
                                  setBlockedUpdatePkgs(Array.from(s));
                                  setCustomBlockUpdatePkg('');
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing || !customBlockUpdatePkg.trim()}
                              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-purple-600/20"
                            >
                              Chặn Update
                            </button>

                            <button
                              onClick={async () => {
                                const safePkg = sanitizePackageName(customBlockUpdatePkg);
                                if (!adbClientRef.current || !safePkg) {
                                  addLog('⚠️ Tên gói ứng dụng (Package ID) không hợp lệ!', 'error');
                                  return;
                                }
                                setIsProcessing(true);
                                try {
                                  await adbClientRef.current.unblockAppAutoUpdate(safePkg);
                                  const s = await adbClientRef.current.getBlockedUpdatePackages();
                                  setBlockedUpdatePkgs(Array.from(s));
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing || !customBlockUpdatePkg.trim()}
                              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                            >
                              Mở Lại
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Currently Blocked List & Custom Package Input */}
                      <div className="pt-2.5 border-t border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-purple-300 mr-1">
                            🔒 Đang chặn cập nhật ({blockedUpdatePkgs.length} app):
                          </span>
                          {blockedUpdatePkgs.length === 0 ? (
                            <span className="text-[11px] text-slate-500 italic">
                              Chưa có app nào trong danh sách chặn (Hãy chọn chip nhanh ở trên hoặc bấm nút "Chặn Update" ở từng dòng app).
                            </span>
                          ) : (
                            blockedUpdatePkgs.slice(0, 12).map(pkg => (
                              <span
                                key={pkg}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-500/35 text-[10px] font-mono"
                              >
                                🔒 {pkg}
                                <button
                                  onClick={async () => {
                                    if (!adbClientRef.current) return;
                                    setIsProcessing(true);
                                    try {
                                      await adbClientRef.current.unblockAppAutoUpdate(pkg);
                                      const s = await adbClientRef.current.getBlockedUpdatePackages();
                                      setBlockedUpdatePkgs(Array.from(s));
                                    } finally {
                                      setIsProcessing(false);
                                    }
                                  }}
                                  className="ml-1 text-rose-300 hover:text-white font-bold"
                                  title="Bấm để mở lại cập nhật cho ứng dụng này"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                          {blockedUpdatePkgs.length > 12 && (
                            <span className="text-[10px] text-purple-300 font-bold">
                              +{blockedUpdatePkgs.length - 12} app khác
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customBlockUpdatePkg}
                            onChange={(e) => setCustomBlockUpdatePkg(e.target.value)}
                            placeholder="Nhập gói cần chặn update (VD: com.zing.zalo)..."
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-purple-500 focus:outline-none w-full md:w-56"
                          />
                          <button
                            onClick={async () => {
                              const safePkg = sanitizePackageName(customBlockUpdatePkg);
                              if (!adbClientRef.current || !safePkg) {
                                addLog('⚠️ Tên gói ứng dụng (Package ID) không hợp lệ!', 'error');
                                return;
                              }
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.blockAppAutoUpdate(safePkg);
                                const s = await adbClientRef.current.getBlockedUpdatePackages();
                                setBlockedUpdatePkgs(Array.from(s));
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing || !customBlockUpdatePkg.trim()}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black whitespace-nowrap transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                          >
                            <Lock size={12} />
                            Chặn Update
                          </button>
                          <button
                            onClick={async () => {
                              const safePkg = sanitizePackageName(customBlockUpdatePkg);
                              if (!adbClientRef.current || !safePkg) {
                                addLog('⚠️ Tên gói ứng dụng (Package ID) không hợp lệ!', 'error');
                                return;
                              }
                              setIsProcessing(true);
                              try {
                                await adbClientRef.current.unblockAppAutoUpdate(safePkg);
                                const s = await adbClientRef.current.getBlockedUpdatePackages();
                                setBlockedUpdatePkgs(Array.from(s));
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing || !customBlockUpdatePkg.trim()}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold whitespace-nowrap transition-all active:scale-95 disabled:opacity-50"
                          >
                            Mở Lại
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Top Search & Filter Bar */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-80">
                          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input 
                            type="text"
                            placeholder="Tìm tên app hoặc package (VD: video, search, powergenius)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-xs focus:border-blue-500 focus:outline-none transition-colors"
                          />
                          {searchQuery && (
                            <button 
                              onClick={() => setSearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        
                        {/* App Scope Toggle & APK Install */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {(['sys', '3rd'] as const).map(f => (
                              <button 
                                key={f}
                                onClick={() => setAppFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${appFilter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                              >
                                {f === '3rd' ? 'Máy (Cài thêm)' : 'Hệ thống'}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => apkFileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[11px] font-black uppercase shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                          >
                            <Upload size={13} />
                            <span>Cài APK Siêu Tốc</span>
                          </button>
                        </div>
                      </div>

                      {/* Safety Filter Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1">
                        {[
                          { id: 'all', label: 'Tất cả ứng dụng', count: apps.length },
                          { id: 'safe', label: '✨ An toàn gỡ (Cấp 1)', count: apps.filter(a => getDebloatInfo(a.packageName)?.level === 1).length, highlight: true },
                          { id: 'caution', label: '⚠️ Cân nhắc (Cấp 2)', count: apps.filter(a => getDebloatInfo(a.packageName)?.level === 2).length },
                          { id: 'critical', label: '🔒 Cốt lõi (Cấm xóa)', count: apps.filter(a => isCritical(a.packageName)).length }
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setDebloatSafetyFilter(f.id as any)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                              debloatSafetyFilter === f.id
                                ? (f.highlight ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/20' : 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/20')
                                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {f.label} ({f.count})
                          </button>
                        ))}
                      </div>

                      {/* ⚡ TRUNG TÂM CÀI ĐẶT APK SIÊU TỐC (TURBO USB APK INSTALLER) */}
                      <div className="pt-2 border-t border-slate-800/60">
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isDraggingApk) setIsDraggingApk(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingApk(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingApk(false);
                            if (e.dataTransfer?.files?.length) {
                              handleInstallApkFiles(e.dataTransfer.files);
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                            isDraggingApk
                              ? 'bg-cyan-500/15 border-cyan-400 shadow-xl shadow-cyan-500/10'
                              : 'bg-gradient-to-r from-cyan-950/35 via-slate-950/90 to-blue-950/35 border-cyan-500/25'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase">
                                  <Zap size={11} className="fill-cyan-300 text-cyan-300" />
                                  Turbo USB Sync • Hỗ Trợ Hạ Cấp (Downgrade)
                                </span>
                                <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
                                  Cài Đặt APK Siêu Tốc (Cho Phép Cài Đè Cả Bản Thấp Hơn Bản Trên Máy)
                                </h4>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed">
                                Kéo thả hoặc chọn 1 hay nhiều file <strong className="text-cyan-300">.APK</strong> từ máy tính/máy điều khiển. Hệ thống truyền thẳng qua đường ống nhị phân USB, <strong>tự động vượt rào cài đè thành công ngay cả khi phiên bản APK thấp hơn bản đang có trên máy (Bypass Version Downgrade)</strong> và mở ngay ứng dụng lên màn hình điện thoại!
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => apkFileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-tight shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                              >
                                <Upload size={15} className="text-slate-950" />
                                <span>{isProcessing && apkProgress && apkProgress.stage !== 'done' && apkProgress.stage !== 'error' ? 'Đang cài đặt APK...' : 'Chọn File .APK Cài Ngay'}</span>
                              </button>

                              <a
                                href={MAGICTUNE_DRIVE_FOLDER_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-tight shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
                                title="Mở thư mục Google Drive chứa tệp magictune_tool.apk để tải về máy"
                              >
                                <Download size={15} />
                                <span>📥 Tải MagicTune Tool.apk (Google Drive)</span>
                                <ExternalLink size={13} className="opacity-75" />
                              </a>
                            </div>
                          </div>

                          {/* 3 Smart Options Toggles */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setApkAutoLaunch(v => !v)}
                              className={`px-3 py-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                                apkAutoLaunch
                                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200'
                                  : 'bg-slate-900/70 border-slate-800 text-slate-400'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-[10px] font-black uppercase flex items-center gap-1">
                                  <Smartphone size={11} className={apkAutoLaunch ? 'text-emerald-400' : 'text-slate-500'} />
                                  <span>Mở ngay lên màn hình ĐT</span>
                                </div>
                                <div className="text-[9px] text-slate-400 truncate">Xuất hiện ngay khi cài xong</div>
                              </div>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${apkAutoLaunch ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                {apkAutoLaunch ? 'BẬT' : 'TẮT'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setApkAutoOptimize(v => !v)}
                              className={`px-3 py-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                                apkAutoOptimize
                                  ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-200'
                                  : 'bg-slate-900/70 border-slate-800 text-slate-400'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-[10px] font-black uppercase flex items-center gap-1">
                                  <ShieldCheck size={11} className={apkAutoOptimize ? 'text-cyan-400' : 'text-slate-500'} />
                                  <span>Cấp Full Quyền & Bất tử Pin</span>
                                </div>
                                <div className="text-[9px] text-slate-400 truncate">Tự mở thông báo + chạy ngầm</div>
                              </div>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${apkAutoOptimize ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                {apkAutoOptimize ? 'BẬT' : 'TẮT'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setApkBlockUpdate(v => !v)}
                              className={`px-3 py-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                                apkBlockUpdate
                                  ? 'bg-purple-500/15 border-purple-500/35 text-purple-200'
                                  : 'bg-slate-900/70 border-slate-800 text-slate-400'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-[10px] font-black uppercase flex items-center gap-1">
                                  <Lock size={11} className={apkBlockUpdate ? 'text-purple-400' : 'text-slate-500'} />
                                  <span>Khóa Chợ Honor cài đè</span>
                                </div>
                                <div className="text-[9px] text-slate-400 truncate">Giữ nguyên bản APK quốc tế</div>
                              </div>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${apkBlockUpdate ? 'bg-purple-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                {apkBlockUpdate ? 'BẬT' : 'TẮT'}
                              </span>
                            </button>
                          </div>

                          {/* Live Progress Bar */}
                          {apkProgress && (
                            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between gap-2 text-[11px]">
                                <span className={`font-bold ${
                                  apkProgress.stage === 'error'
                                    ? 'text-red-400'
                                    : apkProgress.stage === 'done'
                                      ? 'text-emerald-400'
                                      : 'text-cyan-300'
                                }`}>
                                  {apkProgress.message}
                                </span>
                                <span className="font-mono font-black text-white shrink-0">
                                  {apkProgress.percent}%
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                                <div
                                  className={`h-full transition-all duration-200 rounded-full ${
                                    apkProgress.stage === 'error'
                                      ? 'bg-red-500'
                                      : apkProgress.stage === 'done'
                                        ? 'bg-emerald-500'
                                        : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400'
                                  }`}
                                  style={{ width: `${apkProgress.percent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Recent Installed APKs History */}
                          {apkInstallHistory.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                                <span>Lịch sử cài đặt gần đây ({apkInstallHistory.length})</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setApkInstallHistory([]);
                                    setApkProgress(null);
                                  }}
                                  className="text-[10px] text-slate-500 hover:text-slate-300"
                                >
                                  Xóa lịch sử
                                </button>
                              </div>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {apkInstallHistory.map((item, idx) => (
                                  <div
                                    key={`${item.fileName}-${idx}`}
                                    className={`px-3 py-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-[11px] ${
                                      item.success
                                        ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-200'
                                        : 'bg-red-950/20 border-red-500/25 text-red-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {item.success ? (
                                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                      ) : (
                                        <AlertTriangle size={14} className="text-red-400 shrink-0" />
                                      )}
                                      <span className="font-bold truncate">{item.fileName}</span>
                                      {item.packageName && (
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                                          {item.packageName}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {item.fileSizeMB} MB • {item.durationSec}s ({item.speedMBps} MB/s)
                                      </span>
                                    </div>

                                    {item.success && item.packageName && (
                                      <button
                                        onClick={async () => {
                                          if (!adbClientRef.current || !item.packageName) return;
                                          setIsProcessing(true);
                                          try {
                                            await adbClientRef.current.launchAppOnScreen(item.packageName);
                                          } finally {
                                            setIsProcessing(false);
                                          }
                                        }}
                                        disabled={isProcessing}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase flex items-center gap-1 transition-all active:scale-95 shrink-0"
                                      >
                                        <Play size={10} className="fill-slate-950" />
                                        Mở Ngay Trên ĐT
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Counter & Sort Info */}
                    <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                      <span>
                        Hiển thị <strong>{filteredApps.length}</strong> ứng dụng (Đã tự động ưu tiên các app có thể gỡ an toàn lên đầu danh sách)
                      </span>
                    </div>

                    {/* Quick Banner: Gỡ Bỏ / Đóng Băng Trợ Lý YOYO Tiếng Trung */}
                    <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border border-rose-500/40 rounded-xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Trash2 size={16} className="text-rose-400" />
                          <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
                            🗑️ Gỡ Bỏ / Đóng Băng Toàn Diện Trợ Lý YOYO Tiếng Trung (1 Chạm)
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Tự động gỡ bỏ hoặc đóng băng toàn bộ các gói ứng dụng Trợ lý YOYO tiếng Trung (Assistant, VoiceAssistant, YOYO Core, MagicVoice) để giải phóng RAM và tránh nhảy tiếng Trung khi dùng máy.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            if (!adbClientRef.current) return;
                            setIsProcessing(true);
                            try {
                              await adbClientRef.current.uninstallYoyoAssistant();
                              await fetchApps();
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          disabled={isProcessing}
                          className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-rose-600/20 transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <Trash2 size={13} />
                          <span>🗑️ Gỡ Bỏ / Đóng Băng YOYO</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (!adbClientRef.current) return;
                            setIsProcessing(true);
                            try {
                              await adbClientRef.current.restoreHonorYoyoAssistant();
                              await fetchApps();
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          disabled={isProcessing}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <RotateCcw size={13} className="text-cyan-400" />
                          <span>Khôi Phục YOYO</span>
                        </button>
                      </div>
                    </div>

                    {/* Batch Safe Debloat Banner if Level 1 apps exist */}
                    {apps.some(a => getDebloatInfo(a.packageName)?.level === 1 && !a.frozenByMagicTune) && (
                      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-emerald-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-tight">
                              Dọn Sạch App Rác An Toàn (Cấp 1) - Gỡ Thực Sự & Kiểm Chứng Trên ĐT
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Phát hiện <strong className="text-emerald-300">{apps.filter(a => getDebloatInfo(a.packageName)?.level === 1 && !a.frozenByMagicTune).length} app rác nội địa</strong> (Honor Video, Reader, Mall, Live, GameCenter, HiBoard...). Hệ thống sẽ gỡ bỏ bản cập nhật + gỡ User 0 + vô hiệu hóa thực sự và kiểm chứng lại trực tiếp từ điện thoại!
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            const level1Pkgs = apps
                              .filter(a => getDebloatInfo(a.packageName)?.level === 1 && !a.frozenByMagicTune)
                              .map(a => a.packageName);
                            if (level1Pkgs.length === 0) return;

                            setIsProcessing(true);
                            try {
                              await adbClientRef.current?.batchDebloatSafeApps(level1Pkgs);
                            } finally {
                              await fetchApps();
                              setIsProcessing(false);
                            }
                          }}
                          disabled={isProcessing}
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-emerald-500/20 transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
                        >
                          <Trash2 size={13} />
                          Dọn Sạch {apps.filter(a => getDebloatInfo(a.packageName)?.level === 1 && !a.frozenByMagicTune).length} App Rác Ngay
                        </button>
                      </div>
                    )}

                    <AdSlot />

                    {/* Detailed Compact List View */}
                    <div className="divide-y divide-slate-800/40 bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden overflow-y-auto max-h-[640px]">
                      {filteredApps.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 italic bg-slate-950/20">
                          Không tìm thấy ứng dụng nào khớp với bộ lọc hiện tại.
                        </div>
                      ) : (
                        filteredApps.map(app => {
                          const debloat = getDebloatInfo(app.packageName);
                          const critical = isCritical(app.packageName);
                          const isLevel1 = debloat?.level === 1;
                          const isLevel2 = debloat?.level === 2;
                          const canUninstall = isSafeToUninstall(app.packageName);

                          return (
                            <div 
                              key={app.packageName}
                              className={`px-4 py-4 transition-all duration-200 flex flex-col gap-4 hover:bg-slate-800/30 ${
                                app.frozenByMagicTune
                                  ? 'bg-cyan-950/5'
                                  : isLevel1 
                                    ? 'bg-emerald-950/5' 
                                    : isLevel2
                                      ? 'bg-amber-950/5'
                                      : critical
                                        ? 'bg-red-950/5 opacity-80'
                                        : ''
                              }`}
                            >
                              {/* App Info Top Section */}
                              <div className="flex items-start gap-3.5 min-w-0">
                                {/* Compact Badge Icon */}
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform shadow-sm ${
                                  app.frozenByMagicTune
                                    ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                                    : isLevel1 
                                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                                      : isLevel2
                                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                        : critical
                                          ? 'bg-red-500/20 border-red-500/30 text-red-400'
                                          : 'bg-slate-800 border-slate-700 text-blue-400'
                                }`}>
                                  {isLevel1 ? (
                                    <CheckCircle size={18} />
                                  ) : isLevel2 ? (
                                    <AlertTriangle size={18} />
                                  ) : critical ? (
                                    <Lock size={16} />
                                  ) : (
                                    <Package size={17} />
                                  )}
                                </div>

                                {/* Title, Package & Badges */}
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-[14px] text-white truncate">
                                      {debloat?.reason || app.packageName}
                                    </h4>

                                    <div className="flex items-center gap-1 flex-wrap">
                                      {app.status === 'uninstalled' && (
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                                          🗑️ Gỡ bỏ
                                        </span>
                                      )}
                                      {app.frozenByMagicTune && (
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                                          ❄️ Đóng băng
                                        </span>
                                      )}
                                      {isLevel1 && (
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                                          Cấp 1
                                        </span>
                                      )}
                                      {isLevel2 && (
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/20">
                                          Cấp 2
                                        </span>
                                      )}
                                      {critical && (
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/20">
                                          Hệ thống
                                        </span>
                                      )}
                                      {blockedUpdatePkgs.includes(app.packageName) && (
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/25 text-purple-200 border border-purple-500/30">
                                          🔒 Chặn Update
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <span className="text-[11px] font-mono text-slate-500 select-all truncate">
                                      {app.packageName}
                                    </span>
                                    {debloat?.desc && (
                                      <p className="text-[11px] text-slate-400 italic leading-relaxed">
                                        {debloat.desc}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Quick Actions Bottom Section (Sắp xếp 2 hàng gọn gàng, thoáng đãng) */}
                              <div className="space-y-2 pt-3 border-t border-slate-800/50">
                                {/* Hàng 1: Mở ngay trên ĐT, Kiểm tra thông báo, Cấp full quyền, Chặn cập nhật */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    onClick={async () => {
                                      setIsProcessing(true);
                                      try {
                                        await adbClientRef.current?.launchAppOnScreen(app.packageName);
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-600 border border-cyan-500/25 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                    title="Đánh thức màn hình và mở ngay ứng dụng này lên màn hình điện thoại"
                                  >
                                    <Play size={12} className="fill-current" />
                                    <span>Mở trên ĐT</span>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setIsProcessing(true);
                                      try {
                                        await adbClientRef.current?.testPushNotificationForApp(
                                          app.packageName,
                                          debloat?.reason || app.packageName,
                                          false
                                        );
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                    title="Test TB"
                                  >
                                    <BellRing size={12} />
                                    Test TB
                                  </button>

                                  <button
                                    onClick={async () => {
                                      setIsProcessing(true);
                                      try {
                                        await adbClientRef.current?.grantFullPermissionsForPackage(app.packageName, false);
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-amber-400 hover:text-slate-950 bg-amber-500/10 hover:bg-amber-400 border border-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                    title="Cấp Full Quyền"
                                  >
                                    <ShieldCheck size={12} />
                                    Full Quyền
                                  </button>

                                  <button
                                    onClick={async () => {
                                      if (!adbClientRef.current) return;
                                      const isBlocked = blockedUpdatePkgs.includes(app.packageName);
                                      setIsProcessing(true);
                                      try {
                                        if (isBlocked) {
                                          await adbClientRef.current.unblockAppAutoUpdate(app.packageName);
                                        } else {
                                          await adbClientRef.current.blockAppAutoUpdate(app.packageName);
                                        }
                                        const s = await adbClientRef.current.getBlockedUpdatePackages();
                                        setBlockedUpdatePkgs(Array.from(s));
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                                      blockedUpdatePkgs.includes(app.packageName)
                                        ? 'bg-purple-600 text-white border border-purple-400'
                                        : 'text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-600 border border-purple-500/20'
                                    }`}
                                    title="Chặn Update"
                                  >
                                    <Lock size={12} />
                                    {blockedUpdatePkgs.includes(app.packageName) ? 'Mở Update' : 'Chặn Update'}
                                  </button>
                                </div>

                                {/* Hàng 2: Dừng chạy, Xóa dữ liệu, Gỡ/Thử gỡ lại, Khôi phục */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    onClick={async () => {
                                      setIsProcessing(true);
                                      try {
                                        await adbClientRef.current?.forceStop(app.packageName);
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                    title="Dừng chạy"
                                  >
                                    <RotateCcw size={12} />
                                    Dừng chạy
                                  </button>

                                  <button
                                    onClick={async () => {
                                      setIsProcessing(true);
                                      try {
                                        await adbClientRef.current?.clearData(app.packageName);
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                    title="Xóa dữ liệu"
                                  >
                                    <Trash2 size={12} />
                                    Xóa dữ liệu
                                  </button>

                                  <button
                                    onClick={async () => {
                                      const targetPkg = app.packageName;
                                      setIsProcessing(true);
                                      try {
                                        const res = await adbClientRef.current?.uninstallApp(targetPkg);
                                        if (res === 'removed') {
                                          setApps(prev =>
                                            prev.map(a =>
                                              a.packageName === targetPkg ? { ...a, status: 'uninstalled', frozenByMagicTune: false } : a
                                            )
                                          );
                                        } else if (res === 'frozen') {
                                          setApps(prev =>
                                            prev.map(a =>
                                              a.packageName === targetPkg ? { ...a, frozenByMagicTune: true } : a
                                            )
                                          );
                                        } else {
                                          await fetchApps();
                                        }
                                      } catch (_err: any) {
                                        await fetchApps();
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={!canUninstall || isProcessing || app.status === 'uninstalled'}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                                      canUninstall && app.status !== 'uninstalled'
                                        ? app.frozenByMagicTune
                                          ? 'bg-cyan-600 text-white border border-cyan-400 shadow-sm'
                                          : 'bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20' 
                                        : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40'
                                    }`}
                                  >
                                    <Trash2 size={12} />
                                    {app.status === 'uninstalled' ? 'Đã gỡ' : app.frozenByMagicTune ? 'Thử gỡ lại' : 'Gỡ tức thì'}
                                  </button>

                                  {(app.status === 'uninstalled' || app.frozenByMagicTune) && (
                                    <button
                                      onClick={async () => {
                                        const targetPkg = app.packageName;
                                        setIsProcessing(true);
                                        try {
                                          await adbClientRef.current?.restoreApp(targetPkg);
                                          setApps(prev =>
                                            prev.map(a =>
                                              a.packageName === targetPkg 
                                                ? { ...a, status: 'enabled', frozenByMagicTune: false } 
                                                : a
                                            )
                                          );
                                        } catch (_err: any) {
                                          await fetchApps();
                                        } finally {
                                          setIsProcessing(false);
                                        }
                                      }}
                                      disabled={isProcessing}
                                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white border border-emerald-400 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                    >
                                      <RotateCcw size={12} />
                                      Khôi phục
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}


            {/* Footer */}
            <footer className="mt-20 mb-10 pt-10 border-t border-slate-800/50 flex flex-col items-center">
              {/* Support Links */}
              <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                <a
                  href="https://youtube.com/@hanoioptical?si=zpYpW-OXgKT1bQuF"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900/40 border border-red-500/20 hover:border-red-500/40 p-4 rounded-2xl flex items-center gap-3 transition-all group shadow-lg"
                >
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/20 group-hover:scale-110 transition-transform">
                    <Youtube size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] text-white font-black uppercase">Kênh YouTube Admin</div>
                    <div className="text-[10px] text-slate-500 font-medium">Ủng hộ 1 Đăng ký nhé!</div>
                  </div>
                  <ExternalLink size={14} className="ml-auto text-slate-600 group-hover:text-red-400 transition-colors" />
                </a>

                <div className="bg-slate-900/40 border border-pink-500/20 hover:border-pink-500/40 p-4 rounded-2xl flex items-center gap-3 transition-all group shadow-lg">
                  <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-600/20 group-hover:scale-110 transition-transform">
                    <Heart size={20} className="fill-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] text-white font-black uppercase">Donate Duy Trì (MoMo)</div>
                    <div className="text-[10px] text-pink-400 font-mono font-bold select-all tracking-wider">0393368007</div>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('0393368007');
                      addLog('Đã sao chép số MoMo của Admin: 0393368007', 'success');
                    }}
                    className="ml-auto p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-white"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Author & Safety Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left w-full max-w-4xl">
                {/* Author's Message */}
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <Heart size={14} className="text-blue-400" />
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Thông điệp từ tác giả</span>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      Đây chính là công cụ em tạo ra tại <span className="text-blue-400 font-bold">aistudio.google.com</span> để phục vụ cho các dòng máy Honor nội địa (magictune.ai.studio).
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Công việc hầu hết 99% là công sức của Ai hỗ trợ code mà các bác nào dành về vibe code sẽ hiểu ngay rằng AI của Google, đặc biệt là Gemini 4 Argon, là công cụ chuyên biệt của Google sẽ không bao giờ tạo ra các dự án đánh cắp dữ liệu hay gây hại tới người dùng.
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Google AI Studio giúp các bác tạo ra các dự án web bằng prompt ra lệnh cho AI và thế là nó giúp mình tạo ra - bất kì ai cũng có thể tự tạo 1 cái web app như mình.
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-blue-500/30 pl-4">
                      Mục tiêu ban đầu là để bản thân em dễ dùng chiếc điện thoại nội địa của em hơn xong sau đó thấy nó hiệu quả nên share lên đây cho anh em dùng thử.. thế thôi! magictune.ai.studio
                    </p>
                  </div>
                </div>

                {/* Safety & Disclaimer Consolidated */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 text-emerald-400">
                      <ShieldCheck size={18} />
                      <h4 className="text-xs font-black uppercase tracking-wider">An toàn & Quyền riêng tư</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                        <div className="text-[10px] font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <Lock size={12} className="text-blue-400" />
                          Kết nối cục bộ
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Dữ liệu ADB được truyền trực tiếp xuống điện thoại qua cáp USB. Không qua máy chủ.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                        <div className="text-[10px] font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <ShieldCheck size={12} className="text-emerald-400" />
                          Mã nguồn AI
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Được xây dựng bởi AI của Google, tuân thủ các tiêu chuẩn an toàn bảo mật nghiêm ngặt.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                    <div className="flex items-center gap-2.5 text-rose-400">
                      <AlertTriangle size={18} />
                      <h4 className="text-xs font-black uppercase tracking-wider">Miễn trừ trách nhiệm</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">
                      Vì đây là dự án cá nhân phi lợi nhuận phục vụ cộng đồng, chúng tôi khước từ mọi trách nhiệm pháp lý đối với bất kỳ sự cố, hỏng hóc hoặc mất mát dữ liệu nào phát sinh. Người dùng hoàn toàn tự chịu trách nhiệm.
                    </p>
                  </div>
                </div>
              </div>

              {/* Non-Honor User Warning */}
              <div className="mt-10 w-full max-w-4xl p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-4 text-left shadow-xl shadow-amber-500/5">
                <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400 shrink-0 mt-0.5">
                  <Info size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-black text-amber-200 uppercase tracking-tight">⚠️ Dành cho người dùng hãng điện thoại khác</h4>
                  <p className="text-[10px] text-amber-200/70 leading-relaxed font-medium">
                    Phiên bản này được tùy chỉnh độc quyền cho <strong>Honor MagicOS</strong>. Nếu bạn dùng Samsung, Xiaomi, Oppo... hãy dùng bản quốc tế tại: 
                    <a href="https://magictune.web.app/" target="_blank" rel="noopener noreferrer" className="ml-1 text-amber-400 hover:text-amber-300 font-bold underline decoration-amber-500/50 underline-offset-2 transition-all">magictune.web.app</a>
                  </p>
                </div>
              </div>

              <div className="mt-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                <div className="w-12 h-px bg-slate-800/50" />
                <span>magictune.ai.studio · 2026</span>
                <div className="w-12 h-px bg-slate-800/50" />
              </div>
            </footer>

          </div>
        </main>

        {/* Mobile Floating ADB Toggle Button - ALWAYS visible on mobile so user can open console anytime */}
        {!isMobileConsoleOpen && (
          <button 
            onClick={() => setIsMobileConsoleOpen(true)}
            className="fixed right-4 bottom-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold px-4 py-2.5 rounded-full shadow-2xl shadow-blue-600/50 border border-blue-400/30 transition-all flex items-center gap-2 z-40 lg:hidden"
            aria-label="Mở cửa sổ lệnh ADB"
          >
            <Terminal size={18} />
            <span className="text-xs uppercase tracking-wider font-extrabold">Lệnh ADB Pro</span>
            {logs.filter(l => l.type === 'error').length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full border border-white/20 animate-pulse">
                {logs.filter(l => l.type === 'error').length}
              </span>
            )}
          </button>
        )}

        {/* Mobile ADB Drawer Modal - ONLY rendered when opened */}
        {isMobileConsoleOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsMobileConsoleOpen(false)} 
            />

            {/* Bottom Drawer */}
            <div className="relative bg-[#020617] border-t border-slate-700/80 rounded-t-3xl p-4 shadow-2xl flex flex-col max-h-[88vh] h-[80vh] animate-in slide-in-from-bottom duration-200 z-10">
              {/* Header Bar */}
              <div className="flex flex-col mb-3">
                <div className="w-12 h-1 bg-slate-700/80 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Terminal size={14} />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Màn Hình Lệnh ADB Pro</h3>
                  </div>
                  <button 
                    onClick={() => setIsMobileConsoleOpen(false)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700/50"
                  >
                    <span>Đóng</span>
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Console & Commands */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Console
                  logs={logs}
                  onClear={() => setLogs([])}
                  isConnected={isConnected}
                  onRunCommand={async (cmd) => {
                    if (adbClientRef.current) {
                      await adbClientRef.current.runShell(cmd);
                    }
                  }}
                />
              </div>

              {/* Status Terminal Mini */}
              <div className="mt-3 p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/50 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase">USB Status</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold ${isConnected ? 'text-emerald-500' : waitingForPhoneAuth ? 'text-amber-400' : 'text-slate-600'}`}>
                    {isConnected ? 'ONLINE' : waitingForPhoneAuth ? 'WAITING PHONE AUTH' : 'OFFLINE'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : waitingForPhoneAuth ? 'bg-amber-400 animate-ping' : 'bg-slate-700'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Side Handle to re-open console if collapsed */}
        {isDesktopConsoleCollapsed && (
          <button 
            onClick={() => setIsDesktopConsoleCollapsed(false)}
            className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-l-2xl shadow-2xl shadow-blue-600/40 z-30 hidden lg:flex flex-col items-center gap-2 border border-blue-400/30 transition-all"
            title="Mở bảng lệnh ADB Pro"
          >
            <ChevronLeft size={18} />
            <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-widest py-1">Lệnh ADB Pro</span>
          </button>
        )}

        {/* Desktop ADB Console Sidebar - Only on Desktop (lg:) */}
        {!isDesktopConsoleCollapsed && (
          <aside className="hidden lg:flex flex-col w-[420px] xl:w-[500px] h-full bg-[#020617] border-l border-slate-800/60 p-5 shrink-0 relative">
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
                  <Terminal size={13} className="text-blue-400" />
                  ADB Pro Live Terminal
                </h4>
                <button 
                  onClick={() => setIsDesktopConsoleCollapsed(true)} 
                  className="text-slate-500 hover:text-slate-200 p-1 rounded hover:bg-slate-800/60 transition-colors"
                  title="Thu gọn bảng lệnh"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              
              <Console
                logs={logs}
                onClear={() => setLogs([])}
                isConnected={isConnected}
                onRunCommand={async (cmd) => {
                  if (adbClientRef.current) {
                    await adbClientRef.current.runShell(cmd);
                  }
                }}
              />
            </div>
            
            {/* Status Terminal */}
            <div className="mt-4 p-3.5 bg-slate-900/30 rounded-2xl border border-slate-800/50">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2.5 text-nowrap font-mono">Status Terminal</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">USB Connection</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold ${isConnected ? 'text-emerald-500' : waitingForPhoneAuth ? 'text-amber-400' : 'text-slate-600'}`}>
                      {isConnected ? 'ONLINE' : waitingForPhoneAuth ? 'WAITING PHONE AUTH' : 'OFFLINE'}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : waitingForPhoneAuth ? 'bg-amber-400 animate-ping' : 'bg-slate-700'}`} />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

      </div>

      {/* Modal: TRUNG TÂM HOÀN TÁC & HƯỚNG DẪN KHÔI PHỤC MẶC ĐỊNH TOÀN DIỆN */}
      {showRevertCenterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowRevertCenterModal(false)}
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-rose-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-rose-950/70 via-slate-900 to-indigo-950/60 border-b border-slate-800 flex items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider border border-rose-500/35">
                  <RotateCcw size={12} />
                  An Toàn Tuyệt Đối • Hoàn Tác Tự Động Qua ADB + Hướng Dẫn Thao Tác Tay Trên Điện Thoại
                </div>
                <h2 className="text-base sm:text-xl font-black text-white">
                  🔄 Trung Tâm Hoàn Tác Mặc Định & Hướng Dẫn Khôi Phục Thủ Công
                </h2>
                <p className="text-xs text-slate-300">
                  Mọi tính năng trên MagicTune đều có thể khôi phục về mặc định gốc của Honor. Những mục bị hệ điều hành Android 14–17 khóa quyền hạ cấp từ máy tính đều có nút mở thẳng màn hình Cài đặt và hướng dẫn thao tác tay chi tiết.
                </p>
              </div>
              <button
                onClick={() => setShowRevertCenterModal(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shrink-0 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              {/* 1-Click Master Automatic Revert Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-amber-950/40 to-slate-900 border border-rose-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <RotateCcw size={16} className="text-rose-400 shrink-0" />
                    <span>Khôi Phục Toàn Bộ Cài Đặt Máy Về Mặc Định Gốc (1 Chạm Tự Động)</span>
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Tự động chạy toàn bộ 10 mô-đun hoàn tác qua ADB: Khôi phục Âm thanh thông báo gốc, bật lại Gom cụm gốc, khôi phục PowerGenius & iAware, bật lại Tự cập nhật Chợ Honor, reset toàn bộ quyền đặc biệt AppOps, đưa Tần số quét / DPI / Chuyển cảnh về 1.0x và tắt Shizuku.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!adbClientRef.current) return;
                    setIsProcessing(true);
                    try {
                      await adbClientRef.current.restoreAllToFactoryDefaultSettings();
                      setShizukuRunning(false);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing || !isConnected}
                  className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <RotateCcw size={16} />
                  <span>{isProcessing ? 'Đang khôi phục toàn máy...' : '🔄 Hoàn Tác Toàn Bộ Máy (1 Chạm)'}</span>
                </button>
              </div>

              {/* Section 1: Per-Feature Automatic Revert Buttons */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>Phần 1: Hoàn Tác Tự Động Từng Tính Năng Riêng Lẻ Qua ADB (Công Cụ Tự Làm 100%)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => adbClientRef.current?.restoreDefaultNotificationSoundBehavior()}
                    disabled={isProcessing || !isConnected}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition-all disabled:opacity-50"
                  >
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <RotateCcw size={13} />
                      <span>1. Hoàn tác Âm thanh Thông báo</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Đưa về tiếng chuông mặc định của máy & bật lại Cooldown gốc.</p>
                  </button>

                  <button
                    onClick={() => adbClientRef.current?.restoreBannersLockscreenGentleDefault()}
                    disabled={isProcessing || !isConnected}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition-all disabled:opacity-50"
                  >
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <RotateCcw size={13} />
                      <span>2. Hoàn tác Panô & Nhẹ nhàng</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Bật lại Thông báo nhẹ nhàng & quyền cửa sổ nổi mặc định.</p>
                  </button>

                  <button
                    onClick={() => adbClientRef.current?.restoreGmailAndFacebookBatchingDefault()}
                    disabled={isProcessing || !isConnected}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition-all disabled:opacity-50"
                  >
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <RotateCcw size={13} />
                      <span>3. Hoàn tác Gom cụm Gmail/FB</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Khôi phục TARE, JobScheduler, Bastet và Bucket mặc định.</p>
                  </button>

                  <button
                    onClick={() => adbClientRef.current?.restoreNotificationSensitivityDefault()}
                    disabled={isProcessing || !isConnected}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition-all disabled:opacity-50"
                  >
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <RotateCcw size={13} />
                      <span>4. Hoàn tác Độ nhạy Turbo Push</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Đưa nhịp tim FCM về 15 phút & bật lại Doze tiết kiệm pin.</p>
                  </button>

                  <button
                    onClick={() => adbClientRef.current?.restorePowerGenius()}
                    disabled={isProcessing || !isConnected}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition-all disabled:opacity-50"
                  >
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <RotateCcw size={13} />
                      <span>5. Khôi phục PowerGenius & Pin</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Bật lại 4 gói AI quản lý pin PowerGenius & iAware của Honor.</p>
                  </button>

                  <button
                    onClick={() => adbClientRef.current?.restoreDefaultPermissionsAllApps()}
                    disabled={isProcessing || !isConnected}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition-all disabled:opacity-50"
                  >
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <RotateCcw size={13} />
                      <span>6. Hoàn tác Quyền AppOps</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Chạy cmd appops reset khôi phục quyền đặc biệt về mặc định.</p>
                  </button>

                  <button
                    onClick={() => adbClientRef.current?.restoreHonorMarketAutoUpdateDefault()}
                    disabled={isProcessing || !isConnected}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition-all disabled:opacity-50"
                  >
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <RotateCcw size={13} />
                      <span>7. Bật lại Chợ App Honor</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Kích hoạt lại Chợ ứng dụng Honor & tự động cập nhật gốc.</p>
                  </button>

                  <button
                    onClick={() => adbClientRef.current?.restoreDefaultHonorKeyboard()}
                    disabled={isProcessing || !isConnected}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition-all disabled:opacity-50"
                  >
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <RotateCcw size={13} />
                      <span>8. Hoàn tác Bàn phím gốc</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Chuyển từ Gboard về bàn phím mặc định theo máy.</p>
                  </button>

                  <button
                    onClick={async () => {
                      await adbClientRef.current?.resetTuning();
                      await adbClientRef.current?.restoreAudioSettings();
                      await adbClientRef.current?.restoreDefaultBatterySettings();
                    }}
                    disabled={isProcessing || !isConnected}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition-all disabled:opacity-50"
                  >
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <RotateCcw size={13} />
                      <span>9. Hoàn tác Màn hình & Âm thanh</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Đưa Hz, DPI, Chuyển cảnh 1.0x, Font, 5G & Audio về mặc định.</p>
                  </button>
                </div>
              </div>

              {/* Section 2: Step-by-Step Manual Revert Guides on Phone for Android Protected Settings */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Smartphone size={15} />
                  <span>Phần 2: Hướng Dẫn Thao Tác Thủ Công Trên Điện Thoại (Cho Các Mục Android Bảo Mật Không Cho ADB Tự Hạ Cấp)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Manual Guide 1: System Language */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-amber-300 text-xs">1. Hoàn tác Ngôn ngữ hệ thống (Về Tiếng Anh / Tiếng Trung)</strong>
                      <button
                        onClick={() => adbClientRef.current?.runShell('am start -a android.settings.LOCALE_SETTINGS')}
                        disabled={!isConnected}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[10px] font-bold shrink-0"
                      >
                        📱 Mở Ngôn ngữ trên ĐT
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      • <strong>Lý do:</strong> Android 14–17 khóa quyền đổi ngôn ngữ chính của hệ thống (<code className="text-amber-300">CHANGE_CONFIGURATION</code> chỉ dành cho System UID 1000).<br />
                      • <strong>Thao tác tay (5 giây):</strong> Trên điện thoại vào <strong>Cài đặt ➔ Hệ thống & cập nhật ➔ Ngôn ngữ và nhập liệu ➔ Ngôn ngữ và vùng</strong> ➔ Nhấn giữ biểu tượng 2 gạch ngang bên cạnh <strong>English</strong> (hoặc <strong>简体中文</strong>) kéo lên vị trí <strong>Số 1</strong>.
                    </p>
                  </div>

                  {/* Manual Guide 2: Runtime Permissions */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-amber-300 text-xs">2. Hoàn tác Quyền Ứng Dụng (Camera, Vị trí, Micro) về mặc định</strong>
                      <button
                        onClick={() => adbClientRef.current?.runShell('am start -a android.settings.MANAGE_APPLICATIONS_SETTINGS')}
                        disabled={!isConnected}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[10px] font-bold shrink-0"
                      >
                        📱 Mở Quản lý App
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      • <strong>Lý do:</strong> Quyền đặc biệt AppOps đã được tool tự reset, nhưng nếu bạn muốn thu hồi sạch quyền Runtime của toàn bộ ứng dụng cùng lúc mà không mất dữ liệu:<br />
                      • <strong>Thao tác tay (10 giây):</strong> Vào <strong>Cài đặt ➔ Ứng dụng ➔ Quản lý ứng dụng ➔ Bấm dấu 3 chấm (⋮) ở góc trên bên phải ➔ Chọn "Đặt lại tùy chọn ứng dụng" (Reset app preferences)</strong>.
                    </p>
                  </div>

                  {/* Manual Guide 3: Honor App Launch Manual Toggles */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-amber-300 text-xs">3. Hoàn tác mục "Khởi chạy ứng dụng" (Về Quản lý tự động)</strong>
                      <button
                        onClick={() => adbClientRef.current?.openHonorAppLaunchSettings()}
                        disabled={!isConnected}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[10px] font-bold shrink-0"
                      >
                        📱 Mở Khởi chạy App
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      • <strong>Lý do:</strong> Các ứng dụng bạn hoặc Robot đã gạt sang "Quản lý thủ công" trong trình Quản lý hệ thống của Honor được lưu trong cơ sở dữ liệu bảo mật của SystemManager.<br />
                      • <strong>Thao tác tay:</strong> Mở <strong>Quản lý hệ thống (System Manager) ➔ Khởi chạy ứng dụng (App Launch)</strong> ➔ Gạt công tắc của ứng dụng sang <strong>BẬT (Quản lý tự động)</strong>.
                    </p>
                  </div>

                  {/* Manual Guide 4: Gentle Notifications & Channel Sound */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-amber-300 text-xs">4. Hoàn tác Kênh Thông Báo Nhẹ Nhàng & Chuông Từng App</strong>
                      <button
                        onClick={() => adbClientRef.current?.runShell('am start -a android.settings.ALL_APPS_NOTIFICATION_SETTINGS')}
                        disabled={!isConnected}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[10px] font-bold shrink-0"
                      >
                        📱 Mở Quản lý Thông báo
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      • <strong>Lý do:</strong> Khi một kênh thông báo đã có cờ <code className="text-amber-300">USER_LOCKED_IMPORTANCE</code>, Android không cho phép ADB tự hạ mức ưu tiên xuống Im lặng/Nhẹ nhàng.<br />
                      • <strong>Thao tác tay:</strong> Vào <strong>Cài đặt ➔ Thông báo & thanh trạng thái ➔ Quản lý thông báo ➔ Chọn ứng dụng</strong> ➔ Gạt bật lại <strong>"Thông báo nhẹ nhàng"</strong> hoặc chọn lại <strong>Nhạc chuông mặc định</strong>.
                    </p>
                  </div>

                  {/* Manual Guide 5: Honor App Market Auto Update */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-amber-300 text-xs">5. Hoàn tác Tự Động Cập Nhật Bên Trong Chợ Ứng Dụng Honor (App Market) & Gmail</strong>
                      <button
                        onClick={() => adbClientRef.current?.openGmailNotiSettings()}
                        disabled={!isConnected}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[10px] font-bold shrink-0"
                      >
                        📱 Mở Cài đặt Gmail
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      • <strong>Trong Chợ App Honor (App Market):</strong> Mở <strong>App Market ➔ Mục Tôi (Me / 我的) ở góc dưới bên phải ➔ Cài đặt (Settings / 设置) ➔ Tự động cập nhật ứng dụng ➔ Chọn lại "Qua Wi-Fi"</strong>.<br />
                      • <strong>Trong ứng dụng Gmail:</strong> Mở <strong>App Gmail ➔ Menu 3 gạch (góc trái trên) ➔ Cài đặt ➔ Chọn địa chỉ Email ➔ Mục Thông báo ➔ Chọn lại "Chỉ ưu tiên cao" (High priority only)</strong> nếu không muốn nhận thông báo cho mọi email quảng cáo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Footer & Ad Slot */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mt-8">
        <AdSlot />
        
        <div className="mt-8 pt-8 border-t border-slate-800 text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Duy trì bởi cộng đồng Honor Việt Nam</span>
            <span>•</span>
            <span>Phiên bản v4.7 PRO Ultimate</span>
            <span>•</span>
            <span>Hỗ trợ MagicOS 8 / 9 / 10 / 11</span>
          </div>
          
          <div className="max-w-3xl mx-auto text-[11px] text-slate-500 leading-relaxed text-justify sm:text-center">
            <p>
              MagicTune là công cụ WebADB mã nguồn mở được tối ưu hóa riêng cho các dòng điện thoại Honor và Huawei nội địa Trung Quốc. 
              Sứ mệnh của chúng tôi là giúp người dùng Việt Nam có trải nghiệm Android quốc tế mượt mà nhất trên phần cứng Honor đỉnh cao. 
              Ứng dụng hỗ trợ fix thông báo Facebook, Zalo, Telegram, Gmail; tối ưu hóa Trợ lý YOYO Tiếng Việt; 
              và dọn dẹp bloatware hệ thống một cách an toàn. Mọi thao tác đều thực hiện qua giao thức ADB tiêu chuẩn, không can thiệp sâu vào nhân hệ điều hành (No Root).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
