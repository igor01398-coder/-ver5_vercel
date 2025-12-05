
import React, { useState, useRef, useEffect } from 'react';
import { editImageWithGemini, fileToGenerativePart, validateImage } from '../services/geminiService';
// FIX: Use relative path
import { playSfx } from '../services/audioService';
import { Loader2, ArrowLeft, Upload, Camera, RefreshCw, Terminal, ChevronRight, CheckCircle, HelpCircle, AlertTriangle, ClipboardList, PartyPopper, Image as ImageIcon, ShieldCheck, Check, X, FolderOpen, ExternalLink, ScanSearch, Lightbulb, Map, Zap } from 'lucide-react';
import { Puzzle, PuzzleProgress } from '../types';

interface ImageEditorProps {
  activePuzzle: Puzzle | null;
  onBack: (progress: PuzzleProgress) => void;
  onComplete?: (data?: PuzzleProgress) => void;
  onSideMissionProgress?: () => void;
  onFieldSolved?: () => void;
  initialState?: PuzzleProgress;
  isCompleted?: boolean;
}

interface SideMissionEntry {
    image: string; // Base64
    note: string;
    timestamp: number;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ activePuzzle, onBack, onComplete, onSideMissionProgress, onFieldSolved, initialState, isCompleted }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null); // Base64
  const [resultImage, setResultImage] = useState<string | null>(null); // Base64
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; feedback: string } | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Quiz State
  const [quizInput, setQuizInput] = useState<string>('');
  const [quizSelect1, setQuizSelect1] = useState<string>('');
  const [quizSelect2, setQuizSelect2] = useState<string>('');
  
  // Mission 1 State (Four Beasts)
  const [m1Heights, setM1Heights] = useState({ tiger: '', leopard: '', lion: '', elephant: '' });
  const [m1Reason, setM1Reason] = useState<string>('');
  const [m1Part1Solved, setM1Part1Solved] = useState(false);
  const [m1Part2Solved, setM1Part2Solved] = useState(false);
  const [m1Part1Error, setM1Part1Error] = useState(false);
  const [m1Part2Error, setM1Part2Error] = useState(false);

  const [isQuizSolved, setIsQuizSolved] = useState<boolean>(false);
  const [showQuizError, setShowQuizError] = useState<boolean>(false);
  
  // Side Mission Counter & History State
  const [sideMissionCount, setSideMissionCount] = useState<number>(0);
  const [sideMissionHistory, setSideMissionHistory] = useState<SideMissionEntry[]>([]);
  const MAX_SIDE_UPLOADS = 5;
  
  // Reference Image State
  const [showReferenceImage, setShowReferenceImage] = useState<boolean>(false);
  
  // Check Image (Gallery) State
  const [showCheckGallery, setShowCheckGallery] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified flag for missions that are "Upload & Verify" only (Single column, no AI generation)
  // Mission 2 (Rock Analysis), Mission 3 (Contour Drawing) and Side Missions fall into this category.
  const isUploadOnly = activePuzzle?.id === '2' || activePuzzle?.id === '3' || activePuzzle?.type === 'side';

  // Set default prompt hint when puzzle loads
  useEffect(() => {
    if (activePuzzle) {
        // For Mission 3 and Side Missions, the input is for remarks, so don't pre-fill the AI prompt hint
        if (activePuzzle.id === '3' || activePuzzle.type === 'side') {
            setPrompt('');
        } else {
            setPrompt(activePuzzle.targetPromptHint);
        }
        
        // Load Initial State if Available
        if (initialState) {
            if (initialState.m1Heights) setM1Heights(initialState.m1Heights);
            if (initialState.m1Reason) setM1Reason(initialState.m1Reason);
            if (initialState.quizInput) setQuizInput(initialState.quizInput);
            if (initialState.quizSelect1) setQuizSelect1(initialState.quizSelect1);
            if (initialState.quizSelect2) setQuizSelect2(initialState.quizSelect2);
            // Restore prompt/description
            if (initialState.imageDescription) setPrompt(initialState.imageDescription);
            // Restore image
            if (initialState.uploadedImage) setOriginalImage(initialState.uploadedImage);
            
            // Restore Solved States
            if (initialState.m1Part1Solved) setM1Part1Solved(true);
            if (initialState.m1Part2Solved) setM1Part2Solved(true);
            if (initialState.isQuizSolved) setIsQuizSolved(true);
        }

        // If Completed, force solved states
        if (isCompleted) {
             setIsQuizSolved(true);
             setM1Part1Solved(true);
             setM1Part2Solved(true);
             return; 
        }

        // Reset Quiz state when puzzle changes if NOT completed and NO initial state
        if (!initialState && activePuzzle.quiz) {
            setIsQuizSolved(false);
            setQuizInput('');
            // Default values for dropdowns
            setQuizSelect1('');
            setQuizSelect2('');
            // Reset Mission 1
            setM1Heights({ tiger: '', leopard: '', lion: '', elephant: '' });
            setM1Reason('');
            setM1Part1Solved(false);
            setM1Part2Solved(false);
            setM1Part1Error(false);
            setM1Part2Error(false);

            setShowQuizError(false);
        } else if (!activePuzzle.quiz) {
            // No quiz for this puzzle, auto-solve
            setIsQuizSolved(true);
        }
    } else {
        setPrompt('');
    }
  }, [activePuzzle, initialState, isCompleted]);

  // Handle Back Navigation with State Saving
  const handleBack = () => {
    const progress: PuzzleProgress = {
        m1Heights,
        m1Reason,
        quizInput,
        quizSelect1,
        quizSelect2,
        imageDescription: prompt,
        uploadedImage: originalImage,
        // Save Solved Flags
        m1Part1Solved,
        m1Part2Solved,
        isQuizSolved
    };
    onBack(progress);
  };

  const verifyM1Part1 = () => {
    const checkRange = (val: string, min: number, max: number) => {
        const num = parseInt(val.replace(/[^0-9]/g, ''));
        return !isNaN(num) && num >= min && num <= max;
    };
    // Ranges: Tiger: 135-145 (Aligned with map display 138), Leopard: 139-143, Lion: 147-153, Elephant: 180-188
    if (checkRange(m1Heights.tiger, 135, 145) && 
        checkRange(m1Heights.leopard, 139, 143) && 
        checkRange(m1Heights.lion, 147, 153) && 
        checkRange(m1Heights.elephant, 180, 188)) {
        
        setM1Part1Solved(true);
        setM1Part1Error(false);
        playSfx('success');
        if (onFieldSolved) onFieldSolved();
        
        // Check if both parts are now solved
        if (m1Part2Solved) {
            setIsQuizSolved(true);
        }
    } else {
        playSfx('error');
        setM1Part1Error(true);
    }
  };

  const verifyM1Part2 = () => {
    const r = m1Reason.trim();
    const hasHighConcept = r.includes('高') || r.includes('山');
    const hasLowConcept = r.includes('低') || r.includes('窪') || r.includes('水') || r.includes('凹');

    if (hasHighConcept && hasLowConcept) {
        setM1Part2Solved(true);
        setM1Part2Error(false);
        playSfx('success');
        if (onFieldSolved) onFieldSolved();
        
        // Check if both parts are now solved
        if (m1Part1Solved) {
            setIsQuizSolved(true);
        }
    } else {
        playSfx('error');
        setM1Part2Error(true);
    }
  };

  const handleQuizVerify = () => {
    if (!activePuzzle?.quiz) return;
    
    let isCorrect = false;

    // Mission 3 Logic: Dropdowns
    if (activePuzzle.id === '3') {
         // Allow both logic: Dense=Tired OR Sparse=Not Tired
         if ((quizSelect1 === '密集' && quizSelect2 === '累') || 
             (quizSelect1 === '稀疏' && quizSelect2 === '不累')) {
             isCorrect = true;
         }
    } else {
        // Standard Text Logic for Mission 2
        const input = quizInput.trim();
        const target = activePuzzle.quiz.answer;
        
        isCorrect = input === target || input.includes(target);

        // Rule for Mission 2: Accept "南港" in the answer
        if (activePuzzle.id === '2' && input.includes('南港')) {
            isCorrect = true;
        }
    }
    
    if (isCorrect) {
        setIsQuizSolved(true);
        setShowQuizError(false);
        playSfx('success');
        if (onFieldSolved) onFieldSolved();
    } else {
        playSfx('error');
        setShowQuizError(true);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToGenerativePart(e.target.files[0]);
        setOriginalImage(base64);
        setResultImage(null);
        setValidationResult(null); // Reset validation
        setError(null);
      } catch (err) {
        setError("Failed to load image.");
      }
    }
  };

  const handleValidateAndGenerate = async () => {
    if (!originalImage || !activePuzzle) return;

    setValidationLoading(true);
    setLoading(true); // Start loading UI
    setError(null);
    setValidationResult(null);

    try {
        // 1. Validation Step (Pass reference images if available)
        const validation = await validateImage(
            originalImage, 
            activePuzzle.title, 
            activePuzzle.uploadInstruction || activePuzzle.description,
            activePuzzle.referenceCheckImages
        );
        
        setValidationResult(validation);
        setValidationLoading(false);

        if (!validation.isValid) {
            playSfx('error');
            setLoading(false); // Stop if invalid
            return;
        }

        playSfx('success');
        
        // Mission 2 & 3 & Side Logic: If valid, award XP immediately and STOP (no generation)
        if (isUploadOnly && validation.isValid) {
            if (activePuzzle.type !== 'side' && onFieldSolved) {
                // Main missions trigger field solved only once here
                onFieldSolved();
            }
            // For side missions, we wait for the "Submit" button to trigger XP
            return;
        }
        
        // 2. Generation/Editing Step (only if valid, and NOT UploadOnly)
        if (prompt && !isUploadOnly) {
             const resultBase64 = await editImageWithGemini(originalImage, prompt);
             setResultImage(resultBase64);
        }
        
    } catch (err: any) {
        console.error("Gemini API Error:", err);
        setError(err.message || "Protocol Failed. Re-calibrate sensors.");
        setValidationLoading(false);
    } finally {
        setLoading(false);
    }
  };

  const triggerFileInput = () => {
    if (isCompleted) return;
    fileInputRef.current?.click();
  };

  // Triggered when user clicks "Transmit Data" or manual pass
  const handlePreComplete = () => {
    playSfx('success');
    setShowSuccessModal(true);
  };

  // Side Mission Specific: Submit and Next
  const handleSideMissionSubmit = () => {
      // 0. Save current entry to history before clearing
      if (originalImage) {
          const newEntry: SideMissionEntry = {
              image: originalImage,
              note: prompt,
              timestamp: Date.now()
          };
          setSideMissionHistory(prev => [...prev, newEntry]);
      }

      // 1. Award XP immediately
      if (onSideMissionProgress) onSideMissionProgress();

      // 2. Increment Counter
      const newCount = sideMissionCount + 1;
      setSideMissionCount(newCount);
      playSfx('success');

      // 3. Check Limit
      if (newCount >= MAX_SIDE_UPLOADS) {
          // Finished all 5
          handlePreComplete();
      } else {
          // Reset for next upload
          setOriginalImage(null);
          setValidationResult(null);
          // NOTE: Do not clear prompt (setPrompt('')) so the user's answer/memo is preserved
          // setPrompt(''); 
      }
  };

  // Triggered when user clicks "Yay" in modal
  const handleFinalExit = () => {
    // If side mission, we have already awarded XP incrementally. 
    // The modal exit just closes the view.
    if (activePuzzle?.type === 'side' && onComplete) {
         // Pass empty progress to close logic
         onComplete(); 
         return;
    }
    
    if (onComplete) {
        const progressData: PuzzleProgress = {
            m1Heights: m1Heights,
            m1Reason: m1Reason,
            quizInput: quizInput,
            quizSelect1: quizSelect1,
            quizSelect2: quizSelect2,
            imageDescription: prompt,
            uploadedImage: originalImage,
            m1Part1Solved,
            m1Part2Solved,
            isQuizSolved
        };
        onComplete(progressData);
    }
  };

  // Helper to detect if URL is likely a Drive Folder
  const isDriveFolder = activePuzzle?.referenceImage?.includes('drive.google.com/drive/folders');

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto bg-slate-50 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-300 text-slate-600 hover:text-teal-600 transition-all">
            <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
            <div className={`text-[10px] font-mono uppercase tracking-widest ${activePuzzle?.type === 'side' ? 'text-indigo-600' : 'text-slate-500'}`}>
                {activePuzzle?.type === 'side' ? 'SIDE OPERATION ACTIVE' : 'ACTIVE PROTOCOL'}
            </div>
            <h2 className={`text-base font-bold font-mono truncate max-w-[200px] ${activePuzzle?.type === 'side' ? 'text-indigo-600' : 'text-teal-600'}`}>
            {activePuzzle ? activePuzzle.title : 'Free Explore Mode'}
            </h2>
        </div>
        <div className="flex gap-2">
            {/* Mission 1: Map Link */}
            {activePuzzle?.id === '1' ? (
                 <a 
                    href="https://mapy.com/en/zakladni?l=0&x=121.5825656&y=25.0303884&z=16"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-amber-50 rounded-lg border border-amber-200 text-amber-600 shadow-sm transition-colors"
                    title="開啟地圖"
                >
                    <Map className="w-5 h-5" />
                </a>
            ) : activePuzzle?.id === '2' ? (
                 <a 
                    href="https://drive.google.com/drive/folders/1dGZAsbD-9MiJw3zUmwKkAt7juWJeXzt0?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-amber-50 rounded-lg border border-amber-200 text-amber-600 shadow-sm transition-colors"
                    title="開啟提示"
                >
                    <Lightbulb className="w-5 h-5" />
                </a>
            ) : (
                <>
                    {/* Gallery Button for Check Images */}
                    {activePuzzle?.referenceCheckImages && activePuzzle.referenceCheckImages.length > 0 && (
                        <button 
                            onClick={() => setShowCheckGallery(true)}
                            className="p-2 hover:bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-600 shadow-sm transition-colors"
                            title="View Examples"
                        >
                            <Lightbulb className="w-5 h-5" />
                        </button>
                    )}
                    
                    {/* Reference Image Button (if available) - Mission 3 specific override */}
                    {activePuzzle?.id === '3' ? (
                        <a 
                            href="https://drive.google.com/file/d/1XjI4JsPsBlYo5uo_e4TePtDssbcQOYr6/view?usp=sharing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-amber-50 rounded-lg border border-amber-200 text-amber-600 shadow-sm transition-colors"
                            title="開啟提示"
                        >
                            <Lightbulb className="w-5 h-5" />
                        </a>
                    ) : activePuzzle?.referenceImage && (
                        <button 
                            onClick={() => setShowReferenceImage(true)}
                            className="p-2 hover:bg-amber-50 rounded-lg border border-amber-200 text-amber-600 shadow-sm transition-colors"
                            title="View Reference"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>
                    )}
                </>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-36 relative z-10">
        
        {/* Instructions */}
        {activePuzzle && !originalImage && (
          <div className={`border p-6 rounded-none relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ${activePuzzle.type === 'side' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-teal-200 shadow-sm'}`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${activePuzzle.type === 'side' ? 'bg-indigo-500' : 'bg-teal-500'}`}></div>
            <h3 className={`font-mono text-xs mb-2 flex items-center gap-2 ${activePuzzle.type === 'side' ? 'text-indigo-600' : 'text-teal-600'}`}>
                {activePuzzle.type === 'side' ? <ClipboardList className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                {activePuzzle.type === 'side' ? 'SIDE MISSION BRIEFING' : '任務目標'}
            </h3>
            <p className="text-slate-700 mb-4 font-mono text-sm leading-relaxed border-l border-slate-200 pl-4">
                {activePuzzle.description}
            </p>
            {!activePuzzle.quiz && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wide border ${activePuzzle.type === 'side' ? 'bg-indigo-100/50 border-indigo-200 text-indigo-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
                <Camera className="w-4 h-4" />
                <span>Objective: Acquire Visual Data</span>
                </div>
            )}
            
            {/* Inline Hint to use Reference */}
            {activePuzzle.referenceCheckImages && activePuzzle.referenceCheckImages.length > 0 && activePuzzle.id !== '2' && (
                 <div className="mt-4 flex items-center gap-2 text-emerald-700 text-xs font-mono">
                    <Lightbulb className="w-4 h-4" />
                    <span>TIP: VIEW EXAMPLE PHOTOS (TOP RIGHT)</span>
                </div>
            )}
          </div>
        )}

        {/* Quiz Section (If applicable) */}
        {activePuzzle?.quiz && (
            <div className={`p-6 rounded-lg border transition-all duration-500 ${isQuizSolved ? 'bg-teal-50 border-teal-200' : 'bg-white border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]'}`}>
                <div className="flex items-center gap-3 mb-4">
                    {isQuizSolved ? (
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                             <CheckCircle className="w-5 h-5" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 animate-pulse">
                             <HelpCircle className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                            {isQuizSolved ? 'SECURITY CLEARANCE GRANTED' : 'SECURITY CHALLENGE REQUIRED'}
                        </div>
                        <h3 className={`font-bold font-sans text-lg ${isQuizSolved ? 'text-teal-700' : 'text-slate-800'}`}>
                            {activePuzzle.quiz.question}
                        </h3>
                    </div>
                </div>

                {/* Show inputs if not solved, or if it's Mission 1/2/3 to see answers */}
                <div className="space-y-6">
                        {activePuzzle.id === '1' ? (
                            <div className="space-y-6">
                                {/* Question 1 Section */}
                                <div className={`space-y-3 p-4 border rounded-lg ${m1Part1Solved ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <h4 className={`font-bold text-sm flex items-center gap-2 ${m1Part1Solved ? 'text-teal-700' : 'text-slate-700'}`}>
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${m1Part1Solved ? 'bg-teal-200 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>1</span>
                                            四獸山高度
                                        </h4>
                                        {m1Part1Solved && <CheckCircle className="w-5 h-5 text-teal-500" />}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        {['tiger', 'leopard', 'lion', 'elephant'].map((mount) => (
                                            <div key={mount} className="space-y-1">
                                                <label className="text-xs font-mono text-slate-500 capitalize">
                                                    {mount === 'tiger' ? '虎山' : mount === 'leopard' ? '豹山' : mount === 'lion' ? '獅山' : '象山'}
                                                </label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        value={(m1Heights as any)[mount]}
                                                        onChange={(e) => setM1Heights({...m1Heights, [mount]: e.target.value})}
                                                        className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded font-mono text-sm focus:border-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-200 disabled:shadow-none disabled:font-bold"
                                                        placeholder="請輸入數字"
                                                        disabled={m1Part1Solved || isCompleted}
                                                    />
                                                    <span className="absolute right-3 top-2 text-xs text-slate-400">m</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {!m1Part1Solved && !isCompleted && (
                                        <>
                                            {m1Part1Error && (
                                                <div className="text-rose-600 text-xs font-mono flex items-center gap-1 animate-pulse">
                                                    <AlertTriangle className="w-3 h-3" /> 數值不正確，請再檢查。
                                                </div>
                                            )}
                                            <button 
                                                onClick={verifyM1Part1}
                                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold font-mono py-2 rounded text-xs uppercase tracking-wider transition-all"
                                            >
                                                確認高度
                                            </button>
                                        </>
                                    )}
                                </div>
                                
                                {/* Question 2 Section */}
                                <div className={`space-y-3 p-4 border rounded-lg ${m1Part2Solved ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <h4 className={`font-bold text-sm flex items-center gap-2 ${m1Part2Solved ? 'text-teal-700' : 'text-slate-700'}`}>
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${m1Part2Solved ? 'bg-teal-200 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>2</span>
                                            地形觀察
                                        </h4>
                                        {m1Part2Solved && <CheckCircle className="w-5 h-5 text-teal-500" />}
                                    </div>

                                    <div className="">
                                        <label className="text-xs font-mono text-slate-500 mb-2 block">開啟3D地圖，觀察周遭地形，為何永春陂會是濕地？</label>
                                        <textarea 
                                            value={m1Reason}
                                            onChange={(e) => setM1Reason(e.target.value)}
                                            className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded font-mono text-sm focus:border-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-200 disabled:resize-none disabled:font-bold"
                                            placeholder="請輸入你的觀察..."
                                            rows={2}
                                            disabled={m1Part2Solved || isCompleted}
                                        />
                                    </div>

                                    {!m1Part2Solved && !isCompleted && (
                                        <>
                                            {m1Part2Error && (
                                                <div className="text-rose-600 text-xs font-mono flex items-center gap-1 animate-pulse">
                                                    <AlertTriangle className="w-3 h-3" /> 觀察方向有誤，請思考「高低」關係。
                                                </div>
                                            )}
                                            <button 
                                                onClick={verifyM1Part2}
                                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold font-mono py-2 rounded text-xs uppercase tracking-wider transition-all"
                                            >
                                                確認觀察
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : activePuzzle.id === '3' ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 flex-wrap text-slate-700 font-mono text-sm sm:text-base p-2 border border-slate-200 rounded bg-slate-50">
                                    <span>等高線越</span>
                                    <select 
                                        value={quizSelect1}
                                        onChange={(e) => setQuizSelect1(e.target.value)}
                                        className="bg-white border border-slate-300 text-teal-700 px-2 py-1 rounded focus:outline-none focus:border-amber-500 transition-colors disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-300 disabled:font-bold"
                                        disabled={isCompleted || isQuizSolved}
                                    >
                                        <option value="" disabled>請選擇</option>
                                        <option value="稀疏">稀疏</option>
                                        <option value="密集">密集</option>
                                    </select>
                                    <span>，爬起來越</span>
                                    <select 
                                        value={quizSelect2}
                                        onChange={(e) => setQuizSelect2(e.target.value)}
                                        className="bg-white border border-slate-300 text-teal-700 px-2 py-1 rounded focus:outline-none focus:border-amber-500 transition-colors disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-300 disabled:font-bold"
                                        disabled={isCompleted || isQuizSolved}
                                    >
                                        <option value="" disabled>請選擇</option>
                                        <option value="累">累</option>
                                        <option value="不累">不累</option>
                                    </select>
                                </div>
                                
                                {showQuizError && (
                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-mono animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>INCORRECT ANSWER. ACCESS DENIED.</span>
                                    </div>
                                )}
                                {!isQuizSolved && !isCompleted && (
                                    <button 
                                        onClick={handleQuizVerify}
                                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold font-mono py-2.5 rounded uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20"
                                    >
                                        VERIFY ANSWER
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <input 
                                    type="text" 
                                    value={quizInput}
                                    onChange={(e) => setQuizInput(e.target.value)}
                                    placeholder="輸入你的答案..."
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded font-mono text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-200 disabled:font-bold"
                                    disabled={isCompleted || isQuizSolved}
                                />
                                {showQuizError && (
                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-mono animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>INCORRECT ANSWER. ACCESS DENIED.</span>
                                    </div>
                                )}
                                {!isQuizSolved && !isCompleted && (
                                    <button 
                                        onClick={handleQuizVerify}
                                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold font-mono py-2.5 rounded uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20"
                                    >
                                        VERIFY ANSWER
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
            </div>
        )}

        {/* Mission Completion Button for Mission 1 (Since no image upload) */}
        {activePuzzle?.id === '1' && isQuizSolved && !isCompleted && (
            <button
                onClick={handlePreComplete}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white py-4 rounded-lg font-mono font-bold text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
                <PartyPopper className="w-6 h-6" />
                TRANSMIT MISSION DATA
            </button>
        )}

        {/* Side Mission History Display */}
        {activePuzzle?.type === 'side' && sideMissionHistory.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center text-xs font-mono text-slate-500 border-b border-slate-200 pb-1">
                    <span className="font-bold text-indigo-600">已上傳紀錄 (SUBMITTED ENTRIES)</span>
                    <span>{sideMissionHistory.length} / {MAX_SIDE_UPLOADS}</span>
                </div>
                <div className="grid gap-3">
                    {sideMissionHistory.map((entry, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex gap-3">
                            <div className="w-20 h-20 shrink-0 bg-slate-100 rounded overflow-hidden border border-slate-100">
                                <img src={`data:image/jpeg;base64,${entry.image}`} alt={`Entry ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="text-[10px] text-slate-400 font-mono mb-1">ENTRY #{idx + 1}</div>
                                <div className="text-sm text-slate-700 font-sans line-clamp-3">
                                    {entry.note || <span className="text-slate-400 italic">No remarks</span>}
                                </div>
                            </div>
                            <div className="flex items-center justify-center text-emerald-500">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* SIDE MISSION Progress Bar */}
        {activePuzzle?.type === 'side' && (
            <div className="flex items-center justify-center gap-2 mb-2">
                 <div className="text-xs font-mono font-bold text-indigo-600">Collection Progress:</div>
                 <div className="flex gap-1">
                     {[...Array(MAX_SIDE_UPLOADS)].map((_, i) => (
                         <div key={i} className={`w-3 h-3 rounded-full border transition-all ${
                             i < sideMissionCount 
                             ? 'bg-indigo-500 border-indigo-600' 
                             : 'bg-white border-indigo-200'
                         }`}></div>
                     ))}
                 </div>
            </div>
        )}

        {/* Upload & Edit Area (Mission 2, 3 and Side Missions) */}
        {(isUploadOnly && activePuzzle && (!activePuzzle.quiz || isQuizSolved) && !isCompleted && sideMissionCount < MAX_SIDE_UPLOADS) && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />

                {!originalImage ? (
                     <button 
                        onClick={triggerFileInput}
                        className="w-full h-64 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-3 group relative"
                    >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                            <Camera className="w-8 h-8 text-slate-400 group-hover:text-teal-500" />
                        </div>
                        <div className="text-sm font-mono text-slate-500">TAP TO CAPTURE</div>
                        <div className="absolute inset-0 border-2 border-dashed border-slate-200 m-4 rounded-lg pointer-events-none group-hover:border-teal-200"></div>
                    </button>
                ) : (
                    <div className="p-4 space-y-4">
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                            <img src={`data:image/jpeg;base64,${originalImage}`} alt="Preview" className="w-full h-full object-contain" />
                            <button 
                                onClick={() => setOriginalImage(null)}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Validation Feedback */}
                        {validationResult && (
                             <div className={`p-3 rounded text-sm flex items-start gap-2 ${validationResult.isValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                {validationResult.isValid ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                                <div>
                                    <div className="font-bold font-mono text-xs mb-1">{validationResult.isValid ? 'VALIDATION PASSED' : 'VALIDATION FAILED'}</div>
                                    <div className="leading-snug">{validationResult.feedback}</div>
                                </div>
                             </div>
                        )}
                        
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                             <label className="text-xs font-mono font-bold text-slate-500 uppercase">
                                {activePuzzle.type === 'side' ? 'FIELD NOTES (MEMO)' : 'FIELD NOTES (MEMO)'}
                             </label>
                             <input 
                                type="text" 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Add observations here..."
                                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-teal-500 transition-all"
                             />
                        </div>

                        {!validationResult ? (
                            <button
                                onClick={handleValidateAndGenerate}
                                disabled={validationLoading}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-mono font-bold transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:text-slate-500"
                            >
                                {validationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
                                <span>ANALYZE SAMPLE</span>
                            </button>
                        ) : validationResult.isValid ? (
                            <button
                                onClick={activePuzzle.type === 'side' ? handleSideMissionSubmit : handlePreComplete}
                                className={`w-full py-3 rounded-lg font-mono font-bold transition-all flex items-center justify-center gap-2 text-white shadow-lg ${activePuzzle.type === 'side' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-teal-600 hover:bg-teal-500'}`}
                            >
                                {activePuzzle.type === 'side' 
                                    ? (sideMissionCount === MAX_SIDE_UPLOADS - 1 ? 'COMPLETE COLLECTION' : 'SUBMIT ENTRY & CONTINUE') 
                                    : 'TRANSMIT DATA'
                                }
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setOriginalImage(null)}
                                className="w-full bg-rose-100 hover:bg-rose-200 text-rose-700 py-3 rounded-lg font-mono font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>RETAKE PHOTO</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* Regular Mission Generation UI (Mission 1 - though M1 has no image upload here usually, or other types) */}
        {(!isUploadOnly && activePuzzle && (!activePuzzle.quiz || isQuizSolved) && !isCompleted) && (
           <div className="flex flex-col md:flex-row gap-6 pb-32">
            {/* Input Column */}
            <div className="flex-1 space-y-4">
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Dropzone */}
                <div 
                    onClick={triggerFileInput}
                    className={`relative w-full aspect-square md:aspect-[4/3] bg-slate-100 border-2 border-dashed ${originalImage ? 'border-teal-500' : 'border-slate-300 hover:border-teal-400'} rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden`}
                >
                    {originalImage ? (
                        <img src={`data:image/jpeg;base64,${originalImage}`} className="w-full h-full object-cover" alt="Original" />
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                <Camera className="w-8 h-8 text-slate-400 group-hover:text-teal-500" />
                            </div>
                            <span className="text-sm font-mono text-slate-500">TAP TO CAPTURE SOURCE</span>
                        </>
                    )}
                    
                    {originalImage && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                             <span className="text-white font-mono font-bold flex items-center gap-2">
                                <RefreshCw className="w-5 h-5" /> RETAKE
                             </span>
                        </div>
                    )}
                </div>

                {/* Validation Feedback */}
                {validationResult && (
                    <div className={`p-3 rounded text-sm flex items-start gap-2 ${validationResult.isValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {validationResult.isValid ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                        <div>
                            <div className="font-bold font-mono text-xs mb-1">{validationResult.isValid ? 'VALIDATION PASSED' : 'VALIDATION FAILED'}</div>
                            <div className="leading-snug">{validationResult.feedback}</div>
                        </div>
                    </div>
                )}
                
                {/* Error Box */}
                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-sm font-mono">
                        ERROR: {error}
                    </div>
                )}

                {/* Prompt Input */}
                <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-slate-500 uppercase flex justify-between">
                        <span>Augmentation Prompt</span>
                        <span className="text-teal-600">AI-ENABLED</span>
                    </label>
                    <div className="relative">
                        <Terminal className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={activePuzzle?.targetPromptHint || "Enter parameters..."}
                            className="w-full bg-white border border-slate-300 text-slate-900 pl-10 pr-4 py-2 rounded-lg font-mono text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200 min-h-[80px] resize-none"
                        />
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleValidateAndGenerate}
                    disabled={!originalImage || loading}
                    className="w-full bg-slate-900 hover:bg-teal-600 disabled:bg-slate-300 text-white py-4 rounded-xl font-mono font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-teal-500/20 active:scale-95"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>PROCESSING...</span>
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5 fill-current" />
                            <span>EXECUTE PROTOCOL</span>
                        </>
                    )}
                </button>
            </div>

            {/* Result Column (Desktop mainly) */}
            {resultImage && (
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xl h-full flex flex-col">
                        <div className="flex items-center justify-between px-2 py-2 border-b border-slate-100 mb-2">
                            <span className="text-xs font-mono font-bold text-teal-600 uppercase flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Simulation Complete
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">GEN-ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                        </div>
                        <div className="relative flex-1 bg-slate-100 rounded-lg overflow-hidden min-h-[300px]">
                            <img src={`data:image/jpeg;base64,${resultImage}`} className="w-full h-full object-contain" alt="Result" />
                        </div>
                        <div className="mt-4">
                             <button
                                onClick={handlePreComplete}
                                className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-lg font-mono font-bold transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                <span>CONFIRM & UPLOAD</span>
                                <Upload className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
           </div>
        )}

      </div>

      {/* Success Modal Overlay */}
      {showSuccessModal && (
        <div className="absolute inset-0 z-[2000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
            <div className="bg-white w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-400"></div>
                
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <PartyPopper className="w-10 h-10 text-emerald-600" />
                </div>
                
                <h3 className="text-2xl font-bold font-mono text-slate-800 mb-2">MISSION ACCOMPLISHED</h3>
                <p className="text-slate-600 mb-8 font-sans">
                    Data successfully transmitted to headquarters. Geological analysis updated.
                </p>
                
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-200">
                        <span className="text-xs font-mono text-slate-500 uppercase">XP REWARD</span>
                        <span className="font-bold text-amber-500 font-mono">+{activePuzzle?.xpReward} XP</span>
                    </div>
                    {activePuzzle?.fragmentId !== -1 && (
                         <div className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-200">
                            <span className="text-xs font-mono text-slate-500 uppercase">ITEM ACQUIRED</span>
                            <span className="font-bold text-indigo-500 font-mono text-xs">DATA FRAGMENT #{activePuzzle?.fragmentId ? activePuzzle.fragmentId + 1 : 1}</span>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleFinalExit}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold font-mono mt-8 transition-all shadow-lg hover:shadow-slate-500/20"
                >
                    RETURN TO MAP
                </button>
            </div>
        </div>
      )}

      {/* Reference Image Modal (Custom) */}
      {showReferenceImage && activePuzzle?.referenceImage && (
          <div className="absolute inset-0 z-[1500] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <button 
                onClick={() => setShowReferenceImage(false)}
                className="absolute top-4 right-4 text-white hover:text-slate-300 p-2"
              >
                  <X className="w-8 h-8" />
              </button>
              <img 
                src={activePuzzle.referenceImage} 
                className="max-w-full max-h-full object-contain rounded shadow-2xl" 
                alt="Reference" 
              />
          </div>
      )}

      {/* Check Gallery Modal */}
      {showCheckGallery && activePuzzle?.referenceCheckImages && (
          <div className="absolute inset-0 z-[1500] bg-black/95 flex flex-col animate-in fade-in duration-200">
              <div className="flex justify-between items-center p-4 text-white">
                  <h3 className="font-mono font-bold flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-400" /> EXAMPLE SAMPLES
                  </h3>
                  <button onClick={() => setShowCheckGallery(false)}>
                      <X className="w-6 h-6" />
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-8">
                  {activePuzzle.referenceCheckImages.map((imgUrl, idx) => (
                      <div key={idx} className="space-y-2">
                          <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                              <img src={imgUrl} alt={`Example ${idx+1}`} className="w-full h-auto" />
                              <div className="absolute bottom-0 left-0 bg-black/60 backdrop-blur px-3 py-1 text-xs font-mono text-white">
                                  SAMPLE #{idx + 1}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

    </div>
  );
};
