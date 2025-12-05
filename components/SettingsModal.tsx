
import React, { useState } from 'react';
import { X, Settings, Volume2, VolumeX, Eye, EyeOff, RotateCcw, Lock, CloudFog, FileDown, ClipboardCopy, Check, FileJson } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  isSfxEnabled: boolean;
  onToggleSfx: (enabled: boolean) => void;
  isFogEnabled: boolean;
  onToggleFog: () => void;
  isFogTimeReached: boolean;
  onResetGame: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  isSfxEnabled,
  onToggleSfx,
  isFogEnabled,
  onToggleFog,
  isFogTimeReached,
  onResetGame
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Helper to generate a readable text report
  const generateTextReport = () => {
    try {
        const saved = localStorage.getItem('yongchun_save_v1');
        if (!saved) return "尚無遊戲紀錄 (No Data Found)";

        const data = JSON.parse(saved);
        const { playerStats, teamName, puzzleProgress, startTime, endTime } = data;
        
        // Calculate duration if endTime exists, else generic
        let durationStr = "進行中";
        if (startTime && endTime) {
             const start = new Date(startTime);
             const end = new Date(endTime);
             const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
             const h = Math.floor(diff / 3600);
             const m = Math.floor((diff % 3600) / 60);
             const s = diff % 60;
             durationStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }

        let report = `【永春陂地質調查 - 結案報告】\n`;
        report += `--------------------------------\n`;
        report += `隊伍代號: ${teamName}\n`;
        report += `目前階級: ${playerStats.rank} (LV.${playerStats.level})\n`;
        report += `累積經驗: ${playerStats.currentXp} XP\n`;
        report += `任務時長: ${durationStr}\n`;
        report += `--------------------------------\n\n`;

        // Mission 1 Stats
        const m1 = puzzleProgress?.['1'];
        report += `[任務 01: 四獸山連線]\n`;
        if (m1) {
            report += `狀態: ${m1.isQuizSolved ? '已完成' : '進行中'}\n`;
            if (m1.m1Heights) {
                report += `測量高度: 虎${m1.m1Heights.tiger}m / 豹${m1.m1Heights.leopard}m / 獅${m1.m1Heights.lion}m / 象${m1.m1Heights.elephant}m\n`;
            }
            if (m1.m1Reason) report += `地形觀察: ${m1.m1Reason}\n`;
        } else {
            report += `狀態: 未開始\n`;
        }
        report += `\n`;

        // Mission 2 Stats
        const m2 = puzzleProgress?.['2'];
        report += `[任務 02: 岩層解密]\n`;
        if (m2) {
             report += `狀態: ${m2.uploadedImage ? '已採樣' : '進行中'}\n`;
             if (m2.quizInput) report += `地層判斷: ${m2.quizInput}\n`;
             if (m2.imageDescription) report += `岩層筆記: ${m2.imageDescription}\n`;
        } else {
            report += `狀態: 未開始\n`;
        }
        report += `\n`;

        // Mission 3 Stats
        const m3 = puzzleProgress?.['3'];
        report += `[任務 03: 等高線挑戰]\n`;
        if (m3) {
            report += `狀態: ${m3.uploadedImage ? '已完成' : '進行中'}\n`;
            if (m3.quizSelect1 && m3.quizSelect2) {
                report += `等高線觀察: 等高線越[${m3.quizSelect1}]，爬起來越[${m3.quizSelect2}]\n`;
            }
            if (m3.imageDescription) report += `路線筆記: ${m3.imageDescription}\n`;
        } else {
            report += `狀態: 未開始\n`;
        }

        return report;
    } catch (e) {
        console.error("Report generation failed", e);
        return "資料讀取錯誤 (Error generating report)";
    }
  };

  const handleCopyReport = async () => {
      const text = generateTextReport();
      try {
          await navigator.clipboard.writeText(text);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
          alert("複製失敗，請手動截圖。");
      }
  };

  const handleDownloadJSON = () => {
      const saved = localStorage.getItem('yongchun_save_v1');
      if (!saved) {
          alert("尚無存檔資料");
          return;
      }
      const blob = new Blob([saved], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yongchun_save_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute inset-0 z-[1400] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <h2 className="text-lg font-bold font-mono text-slate-700 flex items-center gap-2">
                <Settings className="w-5 h-5" /> 系統設定 (SYSTEM CONFIG)
            </h2>
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-900"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* Audio Section */}
            <div>
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase mb-3">Audio Protocol</h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isSfxEnabled ? 'bg-teal-100 text-teal-600' : 'bg-slate-200 text-slate-400'}`}>
                            {isSfxEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="font-bold text-slate-700 text-sm">音效系統 (SFX)</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                {isSfxEnabled ? 'SYSTEM ONLINE' : 'MUTED'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button 
                        onClick={() => onToggleSfx(!isSfxEnabled)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isSfxEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isSfxEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
            </div>

            {/* Visual Section */}
            <div>
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase mb-3">Visual Obfuscation</h3>
                <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    !isFogTimeReached ? 'bg-slate-100 border-slate-200 opacity-75' : 'bg-slate-50 border-slate-200'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${!isFogTimeReached ? 'bg-slate-200 text-slate-400' : isFogEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                            {!isFogTimeReached ? <Lock className="w-5 h-5" /> : (isFogEnabled ? <CloudFog className="w-5 h-5" /> : <Eye className="w-5 h-5" />)}
                        </div>
                        <div>
                            <div className="font-bold text-slate-700 text-sm">迷霧模式 (Fog of War)</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                {!isFogTimeReached ? 'LOCKED (WAIT T+01:00)' : isFogEnabled ? 'ACTIVE' : 'DISABLED'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button 
                        onClick={onToggleFog}
                        disabled={!isFogTimeReached}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                            !isFogTimeReached ? 'bg-slate-200 cursor-not-allowed' :
                            isFogEnabled ? 'bg-indigo-500' : 'bg-slate-300'
                        }`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                            isFogEnabled && isFogTimeReached ? 'translate-x-6' : 'translate-x-0'
                        }`}></div>
                    </button>
                </div>
                {!isFogTimeReached && (
                    <p className="text-[10px] text-amber-600 mt-2 font-mono flex items-center gap-1">
                        <Lock className="w-3 h-3" /> 功能鎖定中：請於任務開始 1 分鐘後再嘗試。
                    </p>
                )}
            </div>

            {/* Data Export Section */}
            <div>
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase mb-3">Data Export</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleCopyReport}
                        className="bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 py-3 rounded-lg font-mono font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {copySuccess ? <Check className="w-5 h-5 text-emerald-500" /> : <ClipboardCopy className="w-5 h-5" />}
                        <span>{copySuccess ? '已複製！' : '複製成績報告'}</span>
                    </button>

                    <button 
                        onClick={handleDownloadJSON}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-3 rounded-lg font-mono font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <FileJson className="w-5 h-5" />
                        <span>下載完整存檔</span>
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    * 複製成績報告可直接貼上至 Line 或 Google Classroom 繳交。
                </p>
            </div>

        </div>

        {/* Footer / Danger Zone */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto shrink-0">
            <h3 className="text-[10px] font-mono font-bold text-rose-400 uppercase mb-2">Danger Zone</h3>
            <button 
                onClick={onResetGame}
                className="w-full bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 py-3 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
                <RotateCcw className="w-4 h-4" />
                SYSTEM RESET (DELETE SAVE)
            </button>
        </div>

      </div>
    </div>
  );
};
