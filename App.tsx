
import React, { useState, useEffect, useCallback } from 'react';
import { Puzzle, AppView, PlayerStats, PuzzleProgress } from './types';
import { ImageEditor } from './components/ImageEditor';
import { GameMap } from './components/GameMap';
import { IntroScreen } from './components/IntroScreen';
import { EncyclopediaModal } from './components/EncyclopediaModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { WeatherWidget } from './components/WeatherWidget';
// FIX: Use relative path
import { playSfx, setSfxEnabled } from './services/audioService';
import { User, Satellite, LifeBuoy, BookOpen, X, Mountain, Info, ClipboardList, ChevronRight, CloudFog, MapPin, CheckCircle, AlertTriangle, Book, Clock, RotateCcw, Settings, Lock, ExternalLink } from 'lucide-react';

// Updated Puzzles with Real Coordinates around Yongchun Pi Wetland Park (Taipei)
const SAMPLE_PUZZLES: Puzzle[] = [
  {
    id: '1',
    title: 'Mission 01: 四獸山連線',
    description: '透過方位與地形觀察理解永春陂是被四獸山包圍的山谷窪地。',
    targetPromptHint: 'Overlay digital measurement grid on mountain peaks, visualize hydrological flow into the valley',
    difficulty: 'Novice',
    xpReward: 300, // Big Mission Reward
    rankRequirement: 'Cadet',
    lat: 25.032647652556317,
    lng: 121.58009862209747,
    fragmentId: 0,
    type: 'main',
    quiz: {
      question: "請對照Mapy，填入四獸山的高度",
      answer: "138,141,151,183"
    },
    referenceImage: 'https://drive.google.com/uc?export=view&id=1-UVds4tg7gQxZo19uTgqyvfTwmEwI3c8',
    referenceCheckImages: [
        'https://drive.google.com/uc?export=view&id=11CSe57nK3J-0hju0mRR8eDQ9g4hqn5JF',
        'https://drive.google.com/uc?export=view&id=1_XGaO_K9uv4SaZsAc-LIiSPDCXBVbLtt'
    ]
  },
  {
    id: '2',
    title: 'Mission 02: 岩層解密',
    description: '請先回答地質問題，驗證所在地層後，再進行岩層採樣分析。',
    targetPromptHint: '描述岩石特徵 (例如：羽毛狀節理)',
    difficulty: 'Geologist',
    xpReward: 300, // Big Mission Reward
    rankRequirement: 'Scout',
    lat: 25.028155021059753,
    lng: 121.57924699325368,
    fragmentId: 1,
    quiz: {
      question: "請問我們現在在哪一層？",
      answer: "南港層"
    },
    uploadInstruction: "請拍攝所收集到的砂岩照片，需清晰呈現岩石紋理（如羽毛狀節理）。",
    type: 'main',
    referenceImage: 'https://drive.google.com/uc?export=view&id=1XEaYf4LuoadsCnneUUGQPFBObLRE9ikA',
    referenceCheckImages: [
        'https://drive.google.com/uc?export=view&id=1pyoxwe__OHmvF5RwO3KUwunbBF7OSX4E',
        'https://drive.google.com/uc?export=view&id=1hkYG5AeVQqsTkLFS9X7r84TA3k_f6BMC'
    ]
  },
  {
    id: '3',
    title: 'Mission 03: 等高線挑戰',
    description: '請打開Mapy並截圖，在截圖上畫出爬上永春崗平台的路線，同時觀察Mapy裡的等高線圖',
    targetPromptHint: 'Project holographic red contour lines onto the terrain, high density on steep slopes',
    difficulty: 'Expert',
    xpReward: 300, // Big Mission Reward
    rankRequirement: 'Ranger',
    lat: 25.029229726415355, 
    lng: 121.57698592023897,
    fragmentId: 2,
    quiz: {
      question: "爬完的感受？",
      answer: "等高線越密集，爬起來越累 或 稀疏→不累"
    },
    uploadInstruction: "上傳您的Mapy截圖，並繪製路線。",
    type: 'main',
    referenceImage: 'https://drive.google.com/uc?export=view&id=1h1z0gNtdVvAfhZr_DqhbYAZJk3dxj0zL'
  }
];

const SIDE_MISSIONS: Puzzle[] = [
  {
    id: 's1',
    title: '擋土牆獵人',
    description: '校園或步道周邊有許多保護邊坡的擋土牆。請尋找擋土牆，觀察其結構與排水狀況。良好的排水設施對於防止邊坡滑動至關重要。',
    targetPromptHint: 'Analyze retaining wall structure, highlight drainage holes in red, check for structural cracks',
    difficulty: 'Novice',
    xpReward: 50, // Per Photo Reward
    rankRequirement: 'Freelancer',
    lat: 0, // Location agnostic
    lng: 0,
    fragmentId: -1, // No fragment
    type: 'side',
    uploadInstruction: '請拍攝擋土牆正面照片，需清楚呈現排水設施或植生狀況。',
    referenceCheckImages: [
        'https://drive.google.com/uc?export=view&id=1luPB-i-a_YzHmPQiJVcxthPDBiPpv6Zl',
        'https://drive.google.com/uc?export=view&id=1p0Az9jvsbjadMIQojasL4rhlr63mrf5D'
    ]
  }
];

const INITIAL_STATS: PlayerStats = {
  level: 1,
  currentXp: 0,
  nextLevelXp: 500,
  rank: '小小地質學家',
  mana: 75,
  maxMana: 100,
  sosCount: 1
};

// Yongchun Pi Map - Unlocked after 3 fragments
const TREASURE_MAP_IMAGE = "https://drive.google.com/uc?export=view&id=1Gs8D2-eMawBA3iUWerCwiDhBlbmlOQ-e";

const TUTORIAL_STEPS = [
    {
        title: '行動提示',
        desc: '注意！前方環境開始不穩定。再過 1 分鐘，神祕的「探險迷霧」就會降臨，請加快腳步前進！',
        icon: <CloudFog className="w-10 h-10 text-teal-600" />
    },
    {
        title: '線索目標',
        desc: '在地圖上找找看「任務標記」！不同顏色代表不同的任務。點擊以開始',
        icon: <MapPin className="w-10 h-10 text-amber-600" />
    },
    {
        title: '探險工具',
        desc: '兩側的選單，可以開啟「支線任務」（額外獲得經驗值！）還能進入「尋寶手冊」，查看你已經收集到的線索碎片。',
        icon: <BookOpen className="w-10 h-10 text-indigo-600" />
    }
];

const STORAGE_KEY = 'yongchun_save_v1';

const App: React.FC = () => {
  // 1. Load Initial Data from Local Storage
  const [initialSaveData] = useState<any>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Rehydrate dates
            if (parsed.startTime) parsed.startTime = new Date(parsed.startTime);
            if (parsed.endTime) parsed.endTime = new Date(parsed.endTime);
            return parsed;
        }
    } catch (e) {
        console.error("Failed to load save:", e);
    }
    return null;
  });

  // 2. Initialize States (use saved data if available)
  // Default to INTRO view now, to allow "Continue" or "New Game" choice
  const [view, setView] = useState<AppView>(AppView.INTRO);
  
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(initialSaveData?.playerStats || INITIAL_STATS);
  const [teamName, setTeamName] = useState<string>(initialSaveData?.teamName || 'UNIT-734');
  
  // Settings States
  const [isSfxEnabledState, setIsSfxEnabledState] = useState<boolean>(initialSaveData?.isSfxEnabled ?? true);
  const [isFogEnabled, setIsFogEnabled] = useState<boolean>(true);

  // Initialize Fog Status based on elapsed time from saved startTime
  const [isFogTimeReached, setIsFogTimeReached] = useState<boolean>(() => {
      if (initialSaveData?.startTime) {
          const diff = (new Date().getTime() - initialSaveData.startTime.getTime()) / 1000;
          return diff >= 60;
      }
      return false;
  });

  const [fogOpacity, setFogOpacity] = useState<number>(() => {
      if (initialSaveData?.startTime) {
          const diff = (new Date().getTime() - initialSaveData.startTime.getTime()) / 1000;
          if (diff >= 60) {
              return Math.min(Math.max((diff - 60) / 20, 0), 1) * 0.9;
          }
      }
      return 0;
  });
  
  // UI States - Initialized from save data if available
  const [showManual, setShowManual] = useState<boolean>(initialSaveData?.uiState?.showManual || false); 
  const [showSettings, setShowSettings] = useState<boolean>(initialSaveData?.uiState?.showSettings || false);
  const [showTreasureMap, setShowTreasureMap] = useState<boolean>(initialSaveData?.uiState?.showTreasureMap || false); 
  const [showSideMissions, setShowSideMissions] = useState<boolean>(initialSaveData?.uiState?.showSideMissions || false); 
  const [showEncyclopedia, setShowEncyclopedia] = useState<boolean>(initialSaveData?.uiState?.showEncyclopedia || false); 
  const [showProfile, setShowProfile] = useState<boolean>(initialSaveData?.uiState?.showProfile || false); 
  
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'locked' | 'error'>('searching');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsRetryTrigger, setGpsRetryTrigger] = useState<number>(0);
  
  // Tutorial States
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);

  // Game State
  const [collectedFragments, setCollectedFragments] = useState<number[]>(initialSaveData?.collectedFragments || []);
  const [completedPuzzleIds, setCompletedPuzzleIds] = useState<string[]>(initialSaveData?.completedPuzzleIds || []);
  
  // Timer State
  const [startTime, setStartTime] = useState<Date | null>(initialSaveData?.startTime || null);
  const [endTime, setEndTime] = useState<Date | null>(initialSaveData?.endTime || null);
  
  // Initialize Duration String
  const [missionDuration, setMissionDuration] = useState<string>(() => {
      if (initialSaveData?.startTime) {
           const end = initialSaveData.endTime || new Date();
           const start = initialSaveData.startTime;
           const diffInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
           if (diffInSeconds < 0) return "00:00:00";
           const hours = Math.floor(diffInSeconds / 3600);
           const minutes = Math.floor((diffInSeconds % 3600) / 60);
           const seconds = diffInSeconds % 60;
           return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return "00:00:00";
  });
  
  // Stored Answers
  const [puzzleProgress, setPuzzleProgress] = useState<Record<string, PuzzleProgress>>(initialSaveData?.puzzleProgress || {});

  // Time State (Real World Clock)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update Global Audio Service when state changes
  useEffect(() => {
    setSfxEnabled(isSfxEnabledState);
  }, [isSfxEnabledState]);

  // Global Click SFX Listener
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if clicking a button or link (or their children)
      if (target.closest('button') || target.closest('a')) {
        playSfx('click');
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Persistence Effect: Save game state when it changes
  useEffect(() => {
    if (!startTime) return; // Don't save if game hasn't started
    
    const dataToSave = {
        playerStats,
        teamName,
        collectedFragments,
        completedPuzzleIds,
        startTime: startTime.toISOString(),
        endTime: endTime ? endTime.toISOString() : null,
        puzzleProgress,
        isSfxEnabled: isSfxEnabledState,
        uiState: {
            showManual,
            showSettings,
            showTreasureMap,
            showSideMissions,
            showEncyclopedia,
            showProfile
        }
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
        console.warn("Save failed (likely quota). Attempting lite save...");
        // Lite save: Remove images from puzzleProgress to save space
        const liteProgress = { ...puzzleProgress };
        // Create a copy of the progress object without the large base64 strings
        const cleanedProgress: Record<string, PuzzleProgress> = {};
        
        Object.keys(liteProgress).forEach(key => {
            const entry = { ...liteProgress[key] };
            if (entry.uploadedImage) entry.uploadedImage = null; // Remove heavy image data
            cleanedProgress[key] = entry;
        });

        const liteData = { ...dataToSave, puzzleProgress: cleanedProgress };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(liteData));
        } catch (e2) {
             console.error("Lite save also failed.", e2);
        }
    }
  }, [
      playerStats, teamName, collectedFragments, completedPuzzleIds, startTime, endTime, puzzleProgress, isSfxEnabledState,
      showManual, showSettings, showTreasureMap, showSideMissions, showEncyclopedia, showProfile
  ]);

  // Mission Timer & Fog Logic
  useEffect(() => {
    if (!startTime) return;
    
    // If mission is already completed (endTime set), don't update timer
    if (endTime) return;

    const interval = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        // FOG LOGIC: Activate fog after 1 minute (60 seconds)
        if (diffInSeconds >= 60) {
            if (!isFogTimeReached) setIsFogTimeReached(true);
            
            // Fade in over 20 seconds
            const fadeDuration = 20;
            const maxOpacity = 0.9;
            const progress = Math.min(Math.max((diffInSeconds - 60) / fadeDuration, 0), 1);
            setFogOpacity(progress * maxOpacity);
        } else {
            setFogOpacity(0);
        }
        
        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;
        
        const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setMissionDuration(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime, isFogTimeReached]);

  // Check for tutorial on first load of HOME view
  useEffect(() => {
    if (view === AppView.HOME) {
        // Only show tutorial if we don't have saved progress (fresh start)
        // OR if the user specifically requested to see help (Manual)
        // Actually, let's stick to the localStorage flag
        const hasSeen = localStorage.getItem('hasSeenTutorial');
        if (!hasSeen && !initialSaveData) {
            setShowTutorial(true);
        }
    }
  }, [view, initialSaveData]);

  const getRankTitle = (level: number) => {
      if (level <= 1) return "小小地質學家";
      if (level === 2) return "地形線索搜查員";
      if (level === 3) return "地質現象調查員";
      return "永春大地守護者";
  };

  const closeTutorial = () => {
      localStorage.setItem('hasSeenTutorial', 'true');
      setShowTutorial(false);
  };

  const nextTutorialStep = () => {
      if (tutorialStep < TUTORIAL_STEPS.length - 1) {
          setTutorialStep(prev => prev + 1);
      } else {
          closeTutorial();
      }
  };

  const handlePuzzleSelect = async (puzzle: Puzzle) => {
    // Request Camera Permission
    // Explicitly check/request permission here to ensure the browser prompts the user 
    // before entering the mission view where camera input is used.
    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
             const stream = await navigator.mediaDevices.getUserMedia({ video: true });
             // Stop the stream immediately, we only needed the permission prompt
             stream.getTracks().forEach(track => track.stop());
        }
    } catch (e) {
        console.warn("Camera permission check failed:", e);
        // We continue regardless, as file upload might still work or utilize gallery
    }

    setActivePuzzle(puzzle);
    setView(AppView.EDITOR);
    setShowSideMissions(false);
  };

  const handleFieldSolved = () => {
      if ((activePuzzle?.type as string) === 'side') return;
      if (activePuzzle && completedPuzzleIds.includes(activePuzzle.id)) return;
      playSfx('success');
      setPlayerStats(prev => {
          const newXp = prev.currentXp + 100;
          const newLevel = Math.floor(newXp / 500) + 1; 
          return {
              ...prev,
              currentXp: newXp,
              level: newLevel,
              rank: getRankTitle(newLevel)
          };
      });
  };

  const handleImageComplete = (progressData?: PuzzleProgress) => {
    if (activePuzzle) {
        if (progressData) {
            setPuzzleProgress(prev => ({
                ...prev,
                [activePuzzle.id]: progressData
            }));
        }

        if (activePuzzle.type === 'side') {
             playSfx('success');
             setPuzzleProgress(prev => {
                 const newProg = { ...prev };
                 delete newProg[activePuzzle.id]; 
                 return newProg;
             });
             setView(AppView.HOME);
             setActivePuzzle(null);
             return;
        }

        if (!completedPuzzleIds.includes(activePuzzle.id)) {
            playSfx('success');
            const newCompletedIds = [...new Set([...completedPuzzleIds, activePuzzle.id])];
            setCompletedPuzzleIds(newCompletedIds);

            setPlayerStats(prev => {
                const newXp = prev.currentXp + activePuzzle.xpReward;
                const newLevel = Math.floor(newXp / 500) + 1; 
                return {
                    ...prev,
                    currentXp: newXp,
                    level: newLevel,
                    rank: getRankTitle(newLevel),
                    mana: Math.max(0, prev.mana - 15)
                };
            });
            
            let newFragments = collectedFragments;
            if (activePuzzle.fragmentId !== -1 && !collectedFragments.includes(activePuzzle.fragmentId)) {
                newFragments = [...collectedFragments, activePuzzle.fragmentId];
                setCollectedFragments(newFragments);
            }

            if (newFragments.length === 3 && !endTime) {
                setEndTime(new Date());
            }
        }

        setView(AppView.HOME);
        setActivePuzzle(null);
    }
  };

  const handleEditorBack = (progress?: PuzzleProgress) => {
    if (progress && activePuzzle) {
        setPuzzleProgress(prev => ({
            ...prev,
            [activePuzzle.id]: progress
        }));
    }
    setActivePuzzle(null);
    setView(AppView.HOME);
  };
  
  const handleSideMissionProgress = () => {
      if (activePuzzle && activePuzzle.type === 'side') {
           playSfx('success');
           setPlayerStats(prev => {
            const newXp = prev.currentXp + activePuzzle.xpReward;
            const newLevel = Math.floor(newXp / 500) + 1; 
            return {
                ...prev,
                currentXp: newXp,
                level: newLevel,
                rank: getRankTitle(newLevel),
                mana: Math.max(0, prev.mana - 15) 
            };
        });
      }
  };

  // --- Start / Continue / Reset Logic ---

  // Start NEW GAME
  const handleIntroStart = (name: string) => {
    // 1. Wipe State
    setPlayerStats(INITIAL_STATS);
    setCollectedFragments([]);
    setCompletedPuzzleIds([]);
    setPuzzleProgress({});
    setEndTime(null);
    setIsFogTimeReached(false);
    setFogOpacity(0);
    
    // Reset UI State for fresh game
    setShowManual(false);
    setShowSettings(false);
    setShowTreasureMap(false);
    setShowSideMissions(false);
    setShowEncyclopedia(false);
    setShowProfile(false);
    
    // 2. Set New State
    setTeamName(name);
    setStartTime(new Date()); 
    localStorage.removeItem(STORAGE_KEY); // Clear old save
    
    // 3. Play sound & switch view
    playSfx('start');
    setView(AppView.HOME);
    setShowTutorial(true); // Show tutorial for new game
  };

  // Continue EXISTING GAME
  const handleContinue = () => {
    // State is already loaded from initialSaveData
    playSfx('start');
    setView(AppView.HOME);
    // Don't show tutorial for continued game usually
  };

  const handleResetGame = () => {
      if (confirm("WARNING: This will delete all geological data and mission progress. Are you sure?")) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem('hasSeenTutorial'); 
          window.location.reload();
      }
  };

  // --- End Logic ---
  
  const handleGpsStatusChange = useCallback((status: 'searching' | 'locked' | 'error', accuracy?: number) => {
      setGpsStatus(status);
      if (accuracy !== undefined) {
          setGpsAccuracy(accuracy);
      }
  }, []);

  const handleRetryGps = () => {
      setGpsRetryTrigger(prev => prev + 1);
  };

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden flex flex-col font-sans">
      
      {/* View Router */}
      {view === AppView.INTRO && (
        <IntroScreen 
            onStart={handleIntroStart} 
            onContinue={handleContinue}
            hasSaveData={!!initialSaveData && !!initialSaveData.startTime}
        />
      )}

      {view === AppView.HOME && (
        <>
            {/* Header / HUD */}
            <div className="absolute top-0 left-0 right-0 z-[500] p-4 pointer-events-none">
                <div className="flex justify-between items-start">
                    
                    {/* Player Info Card (Interactive) */}
                    <button 
                        onClick={() => setShowProfile(true)}
                        className="bg-white/90 backdrop-blur border border-slate-200 p-3 rounded-lg pointer-events-auto shadow-lg text-left hover:scale-105 active:scale-95 transition-transform group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-teal-50 group-hover:bg-teal-100 rounded-full flex items-center justify-center border border-teal-200 transition-colors">
                                <User className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 font-mono">{getRankTitle(playerStats.level)}</div>
                                <div className="font-bold font-mono text-teal-700 uppercase flex items-center gap-2">
                                    {teamName}
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {/* XP Display: Modulo 500 for current level progress */}
                            <div className="flex justify-between text-[10px] font-mono text-slate-500">
                                <span>LVL {playerStats.level}</span>
                                <span>{playerStats.currentXp % 500} / 500 XP</span>
                            </div>
                            <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-teal-500" 
                                    style={{ width: `${(playerStats.currentXp % 500) / 500 * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </button>

                    {/* System Status / Time */}
                    <div className="flex flex-col items-end gap-2 pointer-events-auto">
                        
                        {/* Status Bar */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleRetryGps}
                                className={`backdrop-blur border px-3 py-1 rounded-full flex items-center gap-2 shadow-sm transition-all hover:bg-opacity-100 cursor-pointer active:scale-95 ${
                                gpsStatus === 'locked' ? 'bg-teal-50/90 border-teal-200' : 
                                gpsStatus === 'error' ? 'bg-rose-50/90 border-rose-200 hover:bg-rose-100' : 'bg-amber-50/90 border-amber-200'
                            }`}>
                                {gpsStatus === 'error' ? (
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                ) : (
                                    <Satellite className={`w-3 h-3 ${gpsStatus === 'locked' ? 'text-teal-600' : 'text-amber-600 animate-pulse'}`} />
                                )}
                                
                                <span className={`text-xs font-mono font-bold ${
                                    gpsStatus === 'locked' ? 'text-teal-700' : 
                                    gpsStatus === 'error' ? 'text-rose-700' : 'text-amber-700'
                                }`}>
                                    {gpsStatus === 'locked' ? `GPS LOCKED ${gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : ''}` : gpsStatus === 'error' ? 'GPS OFFLINE' : 'SEARCHING...'}
                                </span>
                            </button>

                            {/* Weather Widget */}
                            <WeatherWidget />
                            
                            {/* Real Clock */}
                            <div className="backdrop-blur bg-white/90 border border-slate-200 px-3 py-1 rounded-full shadow-sm flex items-center gap-2">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span className="text-xs font-mono text-slate-600">
                                    {currentTime.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit', hour12: false})}
                                </span>
                            </div>
                        </div>

                        {/* Map Controls & Settings */}
                        <div className="flex gap-2 mt-1">
                             <button 
                                onClick={() => setShowSettings(true)}
                                className="p-2 bg-white border border-slate-300 text-slate-500 rounded-full hover:text-slate-800 hover:border-slate-400 transition-colors shadow-sm"
                                title="Settings"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setShowManual(true)}
                                className="p-2 bg-white border border-slate-300 text-slate-500 rounded-full hover:text-teal-600 hover:border-teal-300 transition-colors shadow-sm"
                                title="Field Manual"
                            >
                                <Info className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Layer */}
            <GameMap 
                puzzles={SAMPLE_PUZZLES} 
                onPuzzleSelect={handlePuzzleSelect}
                fogEnabled={isFogEnabled && isFogTimeReached} 
                fogOpacity={fogOpacity} 
                onGpsStatusChange={handleGpsStatusChange}
                completedPuzzleIds={completedPuzzleIds}
                gpsRetryTrigger={gpsRetryTrigger}
            />

            {/* Bottom HUD */}
            <div className="absolute bottom-6 left-6 z-[500] flex flex-col gap-3">
                 {/* Encyclopedia Button */}
                 <button 
                    onClick={() => setShowEncyclopedia(true)}
                    className="group relative bg-white/90 backdrop-blur border border-teal-200 p-3 rounded-lg hover:bg-teal-50 transition-all hover:scale-105 active:scale-95 shadow-lg"
                 >
                    <Book className="w-6 h-6 text-teal-600 group-hover:text-teal-700" />
                    <span className="sr-only">Encyclopedia</span>
                 </button>

                 {/* Side Missions Button */}
                 <button 
                    onClick={() => setShowSideMissions(true)}
                    className="group relative bg-white/90 backdrop-blur border border-indigo-200 p-3 rounded-lg hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95 shadow-lg"
                 >
                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {SIDE_MISSIONS.length}
                    </div>
                    <ClipboardList className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" />
                    <span className="sr-only">Side Missions</span>
                 </button>

                 {/* Fragments Button */}
                 <button 
                    onClick={() => setShowTreasureMap(true)}
                    className="group relative bg-white/90 backdrop-blur border border-amber-200 p-3 rounded-lg hover:bg-amber-50 transition-all hover:scale-105 active:scale-95 shadow-lg"
                 >
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                        {collectedFragments.length}/3
                    </div>
                    <BookOpen className="w-6 h-6 text-amber-500 group-hover:text-amber-600" />
                    <span className="sr-only">Open Field Manual</span>
                 </button>
            </div>

            {/* One-Time Tutorial Overlay */}
            {showTutorial && (
                <div className="absolute inset-0 z-[2000] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col items-center text-center">
                        <button 
                            onClick={closeTutorial} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100">
                            {TUTORIAL_STEPS[tutorialStep].icon}
                        </div>
                        
                        <h3 className="text-xl font-bold font-mono text-slate-800 mb-2">
                            {TUTORIAL_STEPS[tutorialStep].title}
                        </h3>
                        
                        <p className="text-sm text-slate-600 mb-8 px-2 min-h-[60px]">
                            {TUTORIAL_STEPS[tutorialStep].desc}
                        </p>
                        
                        <div className="flex items-center justify-between w-full mt-auto">
                            <div className="flex gap-1">
                                {TUTORIAL_STEPS.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-2 h-2 rounded-full transition-colors ${idx === tutorialStep ? 'bg-teal-600' : 'bg-slate-200'}`}
                                    />
                                ))}
                            </div>
                            
                            <button 
                                onClick={nextTutorialStep}
                                className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                            >
                                {tutorialStep === TUTORIAL_STEPS.length - 1 ? (
                                    <>START <CheckCircle className="w-4 h-4" /></>
                                ) : (
                                    <>NEXT <ChevronRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Encyclopedia Modal */}
            {showEncyclopedia && (
              <EncyclopediaModal 
                onClose={() => setShowEncyclopedia(false)} 
                completedPuzzleIds={completedPuzzleIds}
              />
            )}
            
            {/* Player Profile Modal */}
            {showProfile && (
              <PlayerProfileModal 
                onClose={() => setShowProfile(false)}
                playerStats={playerStats}
                teamName={teamName}
                missionDuration={missionDuration}
                startTime={startTime}
                endTime={endTime}
                collectedFragments={collectedFragments}
                completedPuzzleCount={completedPuzzleIds.length}
              />
            )}

            {/* Settings Modal */}
            {showSettings && (
                <SettingsModal
                    onClose={() => setShowSettings(false)}
                    isSfxEnabled={isSfxEnabledState}
                    onToggleSfx={setIsSfxEnabledState}
                    isFogEnabled={isFogEnabled}
                    onToggleFog={() => setIsFogEnabled(!isFogEnabled)}
                    isFogTimeReached={isFogTimeReached}
                    onResetGame={handleResetGame}
                />
            )}

            {/* Manual Modal */}
            {showManual && (
                <div className="absolute inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
                         <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold font-mono text-teal-700 flex items-center gap-2">
                                <LifeBuoy className="w-5 h-5" /> 操作手冊 (FIELD GUIDE)
                            </h2>
                            <button 
                                onClick={() => setShowManual(false)}
                                className="text-slate-400 hover:text-slate-900"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Section 1: Markers */}
                            <div>
                                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> 任務標記 (Mission Markers)
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded border border-emerald-100">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                                        <span className="text-xs font-bold text-emerald-800">任務 01 </span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-100">
                                        <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>
                                        <span className="text-xs font-bold text-amber-800">任務 02 </span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-rose-50 rounded border border-rose-100">
                                        <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
                                        <span className="text-xs font-bold text-rose-800">任務 03 </span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded border border-indigo-100">
                                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                                        <span className="text-xs font-bold text-indigo-800">支線任務 </span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 font-mono">
                                    * 顏色僅供區分不同任務，點擊標記可查看詳細內容。
                                </p>
                            </div>

                            {/* Section 2: Interface Tools */}
                            <div>
                                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4" /> 介面與工具 (Interface & Tools)
                                </h3>
                                <ul className="space-y-3 text-sm text-slate-600">
                                    <li className="flex items-center gap-3">
                                        <div className="p-1.5 bg-slate-100 rounded-full">
                                            <Satellite className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-800">GPS 定位狀態</span>
                                            <p className="text-xs text-slate-500">點擊可重新鎖定目前位置 (Re-center)。</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="p-1.5 bg-slate-100 rounded-full">
                                            <Settings className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-800">系統設定</span>
                                            <p className="text-xs text-slate-500">可在此切換音效、迷霧模式與重置遊戲進度。</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                             {/* Section 3: Goal */}
                             <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                                <h3 className="text-xs font-mono font-bold text-teal-700 uppercase mb-1 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> 任務目標 (Objective)
                                </h3>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    尋找並完成 3 個主要任務，收集所有「地圖碎片」，以解鎖永春陂的失落記憶。
                                </p>
                             </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Side Missions Modal */}
            {showSideMissions && (
                <div className="absolute inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-indigo-100 w-full max-w-md rounded-xl shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
                         <div className="p-4 border-b border-indigo-100 bg-indigo-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold font-mono text-indigo-700 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5" /> 支線任務
                            </h2>
                            <button onClick={() => setShowSideMissions(false)} className="text-slate-400 hover:text-indigo-700">
                                <X className="w-5 h-5" />
                            </button>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {SIDE_MISSIONS.map(mission => (
                                <div key={mission.id} className="bg-white border border-slate-200 p-4 rounded-lg hover:border-indigo-400 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800 font-mono">{mission.title}</h3>
                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-mono">
                                            {mission.xpReward} XP
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">{mission.description}</p>
                                    <button 
                                        onClick={() => handlePuzzleSelect(mission)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-sm font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                                    >
                                        START MISSION <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            )}

            {/* Treasure Map / Fragments Modal (Refactored) */}
            {showTreasureMap && (
                <div className="absolute inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
                    <div className="w-full max-w-lg bg-white border border-amber-200 rounded-xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl">
                         {/* Header */}
                         <div className="p-4 border-b border-amber-100 flex justify-between items-start bg-amber-50">
                            <div>
                                <h2 className="text-lg font-bold font-mono text-amber-700 flex items-center gap-2">
                                    <Mountain className="w-5 h-5" /> 尋寶手冊 (DATA ARCHIVE)
                                </h2>
                                <p className="text-xs text-amber-600/80 font-mono mt-1 ml-7">已收集的碎片紀錄</p>
                            </div>
                            <button onClick={() => setShowTreasureMap(false)} className="text-slate-400 hover:text-amber-800">
                                <X className="w-5 h-5" />
                            </button>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-6 bg-white">
                            <div className="space-y-6">
                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm font-mono text-slate-500">
                                        <span>COLLECTION PROGRESS</span>
                                        <span className="text-amber-600 font-bold">{collectedFragments.length} / 3</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-amber-500 transition-all duration-500" 
                                            style={{ width: `${(collectedFragments.length / 3) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Text / Lore */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                        <h3 className="text-teal-700 font-mono text-sm">碎片紀錄</h3>
                                        {endTime && (
                                            <div className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                                                TOTAL TIME: {missionDuration}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {collectedFragments.length === 0 ? (
                                        <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                            <p className="text-slate-400 text-sm font-mono italic">尚未收集到資料。請開始實地調查。</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-3">
                                            {collectedFragments.includes(0) && (
                                                <li className="bg-teal-50 p-4 rounded-lg border border-teal-100 animate-in slide-in-from-right duration-300 shadow-sm">
                                                    <div className="text-xs text-teal-700 font-bold mb-1 font-mono uppercase">碎片 #01: 地形</div>
                                                    <p className="text-sm text-slate-700 leading-relaxed">相傳清初鄭成功治臺一路從台南率軍北上，到達錫口(松山舊名)埤塘一帶，遠望臺北盆地東南方南港山主稜側面的四個分稜，兩壑四壁，形狀各異，猶如神話故事中的天神執轡駕馭之虎、豹、獅、象四頭神獸，因而得名四獸山，傳說是風水極佳之處，山峰靈秀為民眾怡情養性之地。</p>
                                                </li>
                                            )}
                                            {collectedFragments.includes(1) && (
                                                <li className="bg-amber-50 p-4 rounded-lg border border-amber-100 animate-in slide-in-from-right duration-500 shadow-sm">
                                                    <div className="text-xs text-amber-700 font-bold mb-1 font-mono uppercase">碎片 #02: 地質</div>
                                                    <p className="text-sm text-slate-700 leading-relaxed">南港層標準地在南港地區，主要由青灰色厚層至薄層細粒石灰質砂岩和深灰色頁岩構成，本層中有顯著的厚層塊狀砂岩，厚達五十餘公尺，常形成嶺線及峭壁懸崖。</p>
                                                </li>
                                            )}
                                            {collectedFragments.includes(2) && (
                                                <li className="bg-purple-50 p-4 rounded-lg border border-purple-100 animate-in slide-in-from-right duration-700 shadow-sm">
                                                    <div className="text-xs text-purple-700 font-bold mb-1 font-mono uppercase">碎片 #03: 等高線</div>
                                                    <p className="text-sm text-slate-700 leading-relaxed">等高線的線條形狀也能判斷地形特徵，例如V字形尖端朝高處代表河谷，尖端朝低處代表山脊。</p>
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                    
                                    {collectedFragments.length === 3 && (
                                        <div className="mt-8 space-y-3 pt-4 border-t border-slate-100">
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm font-mono shadow-sm flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-amber-600" />
                                                <span>COMPLETE DATASET ACQUIRED</span>
                                            </div>
                                            <a 
                                                href="https://drive.google.com/file/d/1Gs8D2-eMawBA3iUWerCwiDhBlbmlOQ-e/view?usp=sharing"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:shadow-amber-500/30 group animate-in fade-in slide-in-from-bottom-2"
                                            >
                                                <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                <span>開啟高解析原圖 (OPEN FULL MAP)</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </>
      )}

      {view === AppView.EDITOR && activePuzzle && (
        <ImageEditor 
            activePuzzle={activePuzzle} 
            onBack={handleEditorBack} 
            onComplete={handleImageComplete}
            onSideMissionProgress={handleSideMissionProgress}
            onFieldSolved={handleFieldSolved}
            initialState={puzzleProgress[activePuzzle.id]}
            isCompleted={completedPuzzleIds.includes(activePuzzle.id)}
        />
      )}

    </div>
  );
};

export default App;
