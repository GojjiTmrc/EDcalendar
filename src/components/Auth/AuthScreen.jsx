import React, { useState } from 'react';
import { 
  Calendar, 
  Mail, 
  Lock, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Shield,
  HardDrive,
  Settings,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  isSupabaseConfigured, 
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  resetPasswordForEmail 
} from '../../services/supabaseClient';

export default function AuthScreen({ onDemoMode }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Settings modal / collapsible state
  const [showSettings, setShowSettings] = useState(false);
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const currentConfig = getSupabaseConfig();
  const [customUrl, setCustomUrl] = useState(currentConfig.url || '');
  const [customKey, setCustomKey] = useState(currentConfig.key || '');
  const [settingsMsg, setSettingsMsg] = useState('');
  const callbackUrl = (currentConfig.url ? `${currentConfig.url}/auth/v1/callback` : 'https://jrkuxliltxxdtkusdjmw.supabase.co/auth/v1/callback');

  const isConfigured = isSupabaseConfigured();

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      setSettingsMsg('กรุณากรอกทั้ง Project URL และ Anon Key');
      return;
    }
    if (!customUrl.startsWith('https://')) {
      setSettingsMsg('Project URL ต้องขึ้นต้นด้วย https://');
      return;
    }
    saveCustomSupabaseConfig(customUrl, customKey);
  };

  const handleClearSettings = () => {
    clearCustomSupabaseConfig();
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg('');
      setLoading(true);
      await signInWithGoogle();
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_NAME_NOT_RESOLVED')) {
        setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Supabase ได้ (โปรเจกต์อาจถูกระงับ หรือ URL ไม่ถูกต้อง)');
      } else {
        setErrorMsg(msg || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google');
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('กรุณากรอกอีเมล');
      return;
    }

    if (mode === 'forgot') {
      try {
        setLoading(true);
        await resetPasswordForEmail(email);
        setSuccessMsg('ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว');
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_NAME_NOT_RESOLVED')) {
          setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Supabase ได้ (โปรเจกต์อาจถูกระงับ หรือ URL ไม่ถูกต้อง)');
        } else {
          setErrorMsg(msg || 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('กรุณากรอกรหัสผ่าน');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('รหัสผ่านยืนยันไม่ตรงกัน');
        return;
      }

      try {
        setLoading(true);
        const data = await signUpWithEmail(email, password);
        if (data?.user && !data?.session) {
          setSuccessMsg('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี');
        } else {
          setSuccessMsg('สมัครสมาชิกสำเร็จและเข้าสู่ระบบเรียบร้อยแล้ว');
        }
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_NAME_NOT_RESOLVED')) {
          setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Supabase ได้ (โปรเจกต์อาจถูกระงับ หรือ URL ไม่ถูกต้อง)');
        } else {
          setErrorMsg(msg || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login mode
    try {
      setLoading(true);
      await signInWithEmail(email, password);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setErrorMsg('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_NAME_NOT_RESOLVED')) {
        setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Supabase ได้ (โปรเจกต์อาจถูกระงับ หรือ URL ไม่ถูกต้อง)');
      } else {
        setErrorMsg(msg || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  const isNetworkFailure = errorMsg.includes('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์') || errorMsg.includes('Failed to fetch');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 transition-all relative">
        
        {/* Settings button in top right corner */}
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          title="ตั้งค่าเชื่อมต่อ Cloud (Supabase)"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
            EDcalendar
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium">
              {isConfigured ? 'Cloud' : 'Offline Ready'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            จัดการตารางสอนและปฏิทินการสอน สำหรับคุณครู
          </p>
        </div>

        {/* Custom Supabase Settings Accordion / Panel */}
        {showSettings && (
          <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                ตั้งค่าเชื่อมต่อ Supabase ด้วยตนเอง
              </span>
              <button 
                type="button" 
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-3 text-[11px] leading-relaxed">
              ใส่ Project URL และ Anon Key จากแดชบอร์ด Supabase ของคุณเพื่อเปิดใช้งาน Cloud Sync บนอุปกรณ์นี้
            </p>
            <form onSubmit={handleSaveSettings} className="space-y-2.5">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xxxx.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Anon Public Key
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOi..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>
              {settingsMsg && (
                <div className="text-rose-500 text-[11px] font-medium">{settingsMsg}</div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  บันทึกและเชื่อมต่อ
                </button>
                {currentConfig.isCustom && (
                  <button
                    type="button"
                    onClick={handleClearSettings}
                    className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                  >
                    ล้างค่า
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Warning if Supabase is not configured yet */}
        {!isConfigured && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>ยังไม่ได้เชื่อมต่อระบบคลาวด์ Supabase</span>
            </div>
            คุณครูสามารถใช้งานระบบได้ทันทีในโหมดออฟไลน์ หรือกดไอคอนรูปฟันเฟือง ⚙️ ด้านบนเพื่อใส่ Supabase Key
            {onDemoMode && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={onDemoMode}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg font-medium transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>เข้าใช้งานระบบทันที (ข้อมูลในเครื่อง)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
            {errorMsg.includes('Google') && (
              <div className="mt-2.5 pt-2 border-t border-rose-200/60 dark:border-rose-800/60 flex items-center justify-between">
                <span className="text-[11px] text-rose-600/80 dark:text-rose-400">วิธีตั้งค่าให้ใช้ Google ได้:</span>
                <button
                  type="button"
                  onClick={() => setShowGoogleGuide(true)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-[11px] transition-colors shadow-sm"
                >
                  ดูวิธีตั้งค่า 3 ขั้นตอน →
                </button>
              </div>
            )}
            {isNetworkFailure && onDemoMode && (
              <div className="mt-2.5 pt-2 border-t border-rose-200/60 dark:border-rose-800/60 flex items-center justify-between">
                <span className="text-[11px] text-rose-600/80 dark:text-rose-400">เข้าใช้งานตารางสอนต่อโดยไม่ต้องรอคลาวด์:</span>
                <button
                  type="button"
                  onClick={onDemoMode}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-medium text-[11px] transition-colors"
                >
                  เข้าสู่โหมดออฟไลน์ →
                </button>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        {mode !== 'forgot' && isConfigured && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>เข้าสู่ระบบด้วย Google</span>
            </button>

            <div className="relative flex items-center justify-center mb-4">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
              <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400">
                หรือใช้อีเมล
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            </div>
          </>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              อีเมล
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.ac.th"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 transition-all"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  รหัสผ่าน
                </label>
                {mode === 'login' && isConfigured && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 transition-all"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-medium text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบออนไลน์</span>
              </>
            ) : mode === 'signup' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>สร้างบัญชีใหม่</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
              </>
            )}
          </button>
        </form>

        {/* Footer switch mode */}
        {isConfigured && (
          <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' ? (
              <p>
                ยังไม่มีบัญชีใช้งาน?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  สมัครสมาชิกใหม่
                </button>
              </p>
            ) : mode === 'signup' ? (
              <p>
                มีบัญชีอยู่แล้ว?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            ) : (
              <p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  ← กลับสู่หน้าเข้าสู่ระบบ
                </button>
              </p>
            )}
          </div>
        )}

        {/* Permanent First-Class Offline Button */}
        {onDemoMode && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={onDemoMode}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-2 border border-slate-200/80 dark:border-slate-700/80"
            >
              <HardDrive className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>เข้าใช้งานแบบออฟไลน์ (บันทึกข้อมูลในเครื่องนี้)</span>
            </button>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              เปิดใช้งานได้ทันทีโดยไม่ต้องเข้าสู่ระบบ ข้อมูลจัดเก็บในเบราว์เซอร์
            </p>
          </div>
        )}

        {/* Security badge */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>ข้อมูลปลอดภัย แยกพื้นที่จัดเก็บรายบุคคล (RLS)</span>
        </div>
      </div>

      {/* Google Setup Guide Modal */}
      {showGoogleGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <ExternalLink className="w-4 h-4" />
                </span>
                วิธีเปิดใช้งานเข้าสู่ระบบด้วย Google บน Supabase
              </h3>
              <button
                type="button"
                onClick={() => setShowGoogleGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              การล็อกอินด้วย Google จำเป็นต้องผูกกับ OAuth Client ของ Google Cloud เพื่อความปลอดภัย ทำตาม 3 ขั้นตอนนี้ (ใช้เวลา ~2 นาที):
            </p>

            <div className="space-y-3 text-xs">
              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  1. คัดลอก Callback URL ของ Supabase
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="text"
                    readOnly
                    value={callbackUrl}
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono text-slate-700 dark:text-slate-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(callbackUrl);
                      setCopiedCallback(true);
                      setTimeout(() => setCopiedCallback(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    {copiedCallback ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  2. สร้าง OAuth Client ID ใน Google Cloud Console
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed mb-2">
                  เข้าสู่ <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">Google Cloud Console</a> &gt; กด <b>Create Credentials</b> &gt; เลือก <b>OAuth client ID</b> &gt; ประเภท <b>Web application</b> &gt; นำ Callback URL จากข้อ 1 ไปวางในช่อง <b>Authorized redirect URIs</b>
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  3. เปิดสวิตช์และบันทึกใน Supabase Dashboard
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  ไปที่ <a href="https://supabase.com/dashboard/project/jrkuxliltxxdtkusdjmw/auth/providers" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">Supabase &gt; Authentication &gt; Providers &gt; Google</a> &gt; เปิดสวิตช์ <b>Enable Google provider</b> &gt; วาง Client ID และ Client Secret แล้วกด <b>Save</b>
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowGoogleGuide(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-colors"
              >
                เข้าใจแล้ว / ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
