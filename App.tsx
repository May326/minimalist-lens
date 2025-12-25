
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { AppStep, AdviceResult, MinimalistSession, Language } from './types';
import { generateMinimalistQuestions, generateAdvice } from './services/geminiService';

const STORAGE_KEY = 'minimalist_lens_history';
const LANG_KEY = 'minimalist_lens_lang';

const translations = {
  en: {
    upload_title: "Identify a distraction",
    upload_desc: "Upload a photo of an item or space you wish to simplify.",
    upload_btn: "Start Process",
    loading_clutter: "Analyzing clutter...",
    loading_refining: "Refining thoughts...",
    questions_title: "Questioning Value",
    questions_subtitle: "Honesty leads to freedom.",
    questions_placeholder: "Reflect here...",
    questions_btn: "Find Clarity",
    advice_title: "The Result",
    advice_archived: "Archived Insight",
    observation: "Observation",
    action: "Action",
    reflection: "Quiet Reflection",
    new_journey: "New Journey",
    back_archive: "Back to Archive",
    archive_title: "The Archive",
    clear_total: "Clear Total",
    empty_archive: "The archive is empty. A clean slate.",
    back_start: "Back to Start",
    clear_confirm: "Are you sure you want to clear all history? This aligns with total minimalism.",
    error_analyze: "Failed to analyze the image. Please try again.",
    error_advice: "Failed to generate advice. Please try again."
  },
  zh: {
    upload_title: "识别干扰",
    upload_desc: "上传一张你希望简化的物品或空间的图片。",
    upload_btn: "开始分析",
    loading_clutter: "正在分析杂物...",
    loading_refining: "正在提炼思考...",
    questions_title: "质疑价值",
    questions_subtitle: "诚实带来自由。",
    questions_placeholder: "在此记录你的想法...",
    questions_btn: "寻找清晰",
    advice_title: "分析结果",
    advice_archived: "已存档的洞察",
    observation: "观察",
    action: "建议行动",
    reflection: "静心沉思",
    new_journey: "开启新旅程",
    back_archive: "返回存档",
    archive_title: "存档记录",
    clear_total: "清空所有",
    empty_archive: "存档已空。一切归零。",
    back_start: "返回首页",
    clear_confirm: "确定要清空所有记录吗？这符合极简主义的原则。",
    error_analyze: "图片分析失败，请重试。",
    error_advice: "建议生成失败，请重试。"
  }
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [language, setLanguage] = useState<Language>('zh');
  const [image, setImage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [advice, setAdvice] = useState<AdviceResult | null>(null);
  const [history, setHistory] = useState<MinimalistSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<MinimalistSession | null>(null);

  const t = translations[language];

  // Load history and language on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    }
    const savedLang = localStorage.getItem(LANG_KEY) as Language;
    if (savedLang) setLanguage(savedLang);
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    localStorage.setItem(LANG_KEY, newLang);
  };

  const saveToHistory = (newSession: MinimalistSession) => {
    const updatedHistory = [newSession, ...history];
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = history.filter(s => s.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    if (updatedHistory.length === 0) setStep(AppStep.UPLOAD);
  };

  const clearAllHistory = () => {
    if (window.confirm(t.clear_confirm)) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
      setStep(AppStep.UPLOAD);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string) => {
    setLoading(true);
    setStep(AppStep.ANALYZING_IMAGE);
    setError(null);
    try {
      const result = await generateMinimalistQuestions(base64, language);
      setQuestions(result.questions);
      setStep(AppStep.QUESTIONS);
    } catch (err) {
      setError(t.error_analyze);
      setStep(AppStep.UPLOAD);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswers = async () => {
    if (answers.some(a => !a.trim())) return;
    
    setLoading(true);
    setStep(AppStep.GENERATING_ADVICE);
    try {
      if (image) {
        const result = await generateAdvice(image, questions, answers, language);
        setAdvice(result);
        
        const newSession: MinimalistSession = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          image,
          questions,
          answers,
          advice: result,
          language
        };
        saveToHistory(newSession);
        setStep(AppStep.ADVICE);
      }
    } catch (err) {
      setError(t.error_advice);
      setStep(AppStep.QUESTIONS);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setQuestions([]);
    setAnswers(['', '', '']);
    setAdvice(null);
    setSelectedSession(null);
    setStep(AppStep.UPLOAD);
    setError(null);
  };

  const viewSession = (session: MinimalistSession) => {
    setSelectedSession(session);
    setStep(AppStep.HISTORY);
  };

  return (
    <Layout 
      onGoHome={reset} 
      onGoHistory={() => { setSelectedSession(null); setStep(AppStep.HISTORY); }}
      hasHistory={history.length > 0}
      language={language}
      onToggleLanguage={toggleLanguage}
    >
      <div className="p-6 sm:p-10 fade-in">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 text-xs rounded-xl border border-red-100 fade-in">
            {error}
          </div>
        )}

        {step === AppStep.UPLOAD && (
          <div className="text-center py-12">
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200 group hover:border-gray-400 transition-colors">
                <svg className="w-10 h-10 text-gray-200 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-light text-gray-800 mb-2">{t.upload_title}</h2>
            <p className="text-xs text-gray-400 mb-10 max-w-[240px] mx-auto uppercase tracking-widest leading-loose">{t.upload_desc}</p>
            <label className="inline-block px-10 py-4 bg-gray-900 text-white text-[11px] font-medium rounded-full cursor-pointer hover:bg-black transition-all uppercase tracking-[0.2em]">
              {t.upload_btn}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        )}

        {(step === AppStep.ANALYZING_IMAGE || step === AppStep.GENERATING_ADVICE) && (
          <div className="text-center py-24">
            <div className="inline-block animate-pulse w-2 h-2 bg-gray-900 rounded-full mx-1"></div>
            <div className="inline-block animate-pulse w-2 h-2 bg-gray-900 rounded-full mx-1 delay-75"></div>
            <div className="inline-block animate-pulse w-2 h-2 bg-gray-900 rounded-full mx-1 delay-150"></div>
            <p className="text-[10px] text-gray-400 mt-8 uppercase tracking-[0.3em] font-light">
              {step === AppStep.ANALYZING_IMAGE ? t.loading_clutter : t.loading_refining}
            </p>
          </div>
        )}

        {step === AppStep.QUESTIONS && (
          <div>
            <div className="flex items-center space-x-6 mb-10 pb-6 border-b border-gray-50">
              {image && (
                <img src={image} alt="Target" className="w-24 h-24 object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-700" />
              )}
              <div>
                <h2 className="text-sm font-medium text-gray-800 uppercase tracking-widest">{t.questions_title}</h2>
                <p className="text-[11px] text-gray-400 mt-1">{t.questions_subtitle}</p>
              </div>
            </div>

            <div className="space-y-10">
              {questions.map((q, i) => (
                <div key={i} className="fade-in" style={{ animationDelay: `${i * 150}ms` }}>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">{q}</label>
                  <textarea
                    className="w-full p-5 text-sm bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-100 transition-all outline-none resize-none h-28 font-light leading-relaxed"
                    placeholder={t.questions_placeholder}
                    value={answers[i]}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[i] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-12">
              <button
                onClick={submitAnswers}
                disabled={answers.some(a => !a.trim())}
                className={`w-full py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] font-medium transition-all ${
                  answers.some(a => !a.trim()) 
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                  : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-100'
                }`}
              >
                {t.questions_btn}
              </button>
            </div>
          </div>
        )}

        {(step === AppStep.ADVICE || (step === AppStep.HISTORY && selectedSession)) && (
          <div className="fade-in">
            {step === AppStep.HISTORY && (
              <button onClick={() => setSelectedSession(null)} className="mb-6 flex items-center text-[10px] text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                {t.back_archive}
              </button>
            )}
            
            <div className="mb-12 text-center">
              <h2 className="text-xl font-light text-gray-800 tracking-widest uppercase">
                {step === AppStep.ADVICE ? t.advice_title : t.advice_archived}
              </h2>
              <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">
                {new Date(selectedSession?.timestamp || Date.now()).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="space-y-10">
              <div className="flex justify-center mb-8">
                <img 
                  src={selectedSession?.image || image || ''} 
                  className="w-full max-h-48 object-contain rounded-2xl grayscale hover:grayscale-0 transition-all duration-500" 
                  alt="Minimalist Insight"
                />
              </div>

              <section>
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">{t.observation}</h3>
                <p className="text-sm leading-relaxed text-gray-600 font-light italic">
                  "{ (selectedSession?.advice || advice)?.summary }"
                </p>
              </section>

              <section>
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">{t.action}</h3>
                <ul className="space-y-5">
                  {(selectedSession?.advice || advice)?.tips.map((tip, i) => (
                    <li key={i} className="flex items-start space-x-4 text-sm text-gray-600 font-light">
                      <span className="mt-2 w-1 h-1 rounded-full bg-gray-900 shrink-0"></span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="pt-8 border-t border-gray-50">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">{t.reflection}</h3>
                <p className="text-[13px] text-gray-500 font-light leading-relaxed">
                  { (selectedSession?.advice || advice)?.philosophicalReflection }
                </p>
              </section>
            </div>

            <div className="mt-12">
              <button
                onClick={reset}
                className="w-full py-5 border border-gray-100 text-gray-400 text-[10px] uppercase tracking-[0.3em] font-medium rounded-2xl hover:bg-gray-50 transition-all"
              >
                {t.new_journey}
              </button>
            </div>
          </div>
        )}

        {step === AppStep.HISTORY && !selectedSession && (
          <div className="fade-in">
            <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-50">
              <h2 className="text-sm font-medium text-gray-800 uppercase tracking-widest">{t.archive_title}</h2>
              <button 
                onClick={clearAllHistory}
                className="text-[10px] text-gray-300 hover:text-red-400 uppercase tracking-widest transition-colors"
              >
                {t.clear_total}
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-20 text-gray-300 italic text-sm">
                {t.empty_archive}
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((session) => (
                  <div 
                    key={session.id} 
                    onClick={() => viewSession(session)}
                    className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-gray-200"
                  >
                    <img src={session.image} className="w-12 h-12 object-cover rounded-xl grayscale mr-4" />
                    <div className="flex-1">
                      <p className="text-[11px] text-gray-800 font-medium truncate max-w-[200px]">{session.advice.summary}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">
                        {new Date(session.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-400 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button
                onClick={reset}
                className="w-full mt-8 py-4 bg-gray-900 text-white text-[10px] uppercase tracking-[0.3em] font-medium rounded-2xl hover:bg-black transition-all"
              >
                {t.back_start}
              </button>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fdfdfd;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #eee;
          border-radius: 10px;
        }
      `}</style>
    </Layout>
  );
};

export default App;
