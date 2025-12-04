
import React from 'react';
import { X, Settings, Volume2, VolumeX, Eye, EyeOff, RotateCcw, Lock, CloudFog } from 'lucide-react';

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
  return (
    <div className="absolute inset-0 z-[1400] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
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

        <div className="p-6 space-y-6">
            
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

        </div>

        {/* Footer / Danger Zone */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto">
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
