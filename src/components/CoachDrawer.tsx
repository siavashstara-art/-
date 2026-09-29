import React, { useState } from 'react';
import { useAmbassador } from '../context/AmbassadorContext';
import { COACH_AVATAR_PATH } from '../data/ecosystemData';
import { X, Send, MessageSquareHeart, ShieldCheck } from 'lucide-react';

interface CoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CoachMessage {
  id: string;
  sender: 'COACH' | 'USER';
  textFa: string;
}

export const CoachDrawer: React.FC<CoachDrawerProps> = ({ isOpen, onClose }) => {
  const { profile } = useAmbassador();
  const [inputFa, setInputFa] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 'welcome_1',
      sender: 'COACH',
      textFa:
        'سلام همکار گرامی! من مربی همراه شما در آکادمی فروشیار هستم. هر زمان که پیش از جلسه با یک مشتری واقعی نیاز به تمرین پاسخ به اعتراض قیمت، مرور نقاط قوت ۷ محصول اکوسیستم آفرینش یا تحلیل بازگشت سرمایه داشتید، کنار شما هستم.',
    },
  ]);

  if (!isOpen) return null;

  const handleSendQuestion = async (presetQuestion?: string) => {
    const q = (presetQuestion ?? inputFa).trim();
    if (!q || isLoading) return;

    const userMsg: CoachMessage = {
      id: `u_${Date.now()}`,
      sender: 'USER',
      textFa: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!presetQuestion) setInputFa('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/coach/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionFa: q,
          ambassadorContext: {
            tier: profile.tier,
            academyStage: profile.academyStage,
            generalCertified: profile.generalCertified,
            reassessmentRequired: profile.reassessmentRequired,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `c_${Date.now()}`,
            sender: 'COACH',
            textFa: data.replyFa,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `c_${Date.now()}`,
            sender: 'COACH',
            textFa:
              'در مواجهه با این چالش، ابتدا با یک سوال کاوشگرانه هزینه وضعیت فعلی مشتری را روشن کنید، سپس با دموی زنده ۳۰ ثانیه‌ای سادگی محصول را نشان دهید و از پیشنهاد تخفیف زودهنگام پرهیز نمایید.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `c_${Date.now()}`,
          sender: 'COACH',
          textFa:
            'پیشنهاد مربی: همیشه پیش از اعلام قیمت، ارزش راهکار را با سود تنها ۱ یا ۲ فاکتور نجات‌یافته مشتری مقایسه کنید تا معادله بازگشت سرمایه شفاف شود.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-r border-slate-200 flex flex-col justify-between">
        {/* Coach Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            {!imgErr ? (
              <img
                src={COACH_AVATAR_PATH}
                alt="مربی فروشیار"
                referrerPolicy="no-referrer"
                onError={() => setImgErr(true)}
                className="w-11 h-11 rounded-full object-cover border border-sky-400"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-sky-700 flex items-center justify-center font-bold text-xs">
                مربی
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold">مربی هوشمند فروشیار (Sales Coach)</h2>
              <p className="text-xs text-sky-300">
                همراه تمرین مشاوره‌ای · محترمانه و حرفه‌ای
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="بستن پنل مربی"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Boundary Reminder Notice (Section 10) */}
        <div className="px-4 py-2.5 bg-sky-50 border-b border-sky-200 flex items-center gap-2 text-[11px] text-sky-900">
          <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
          <span>
            مربی همراه آموزشی شماست و جایگزین موتور قطعی صدور گواهینامه (Domain Core v4.0) نمی‌شود.
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                m.sender === 'COACH'
                  ? 'bg-slate-100 text-slate-900 ml-6'
                  : 'bg-sky-700 text-white mr-6'
              }`}
            >
              <span className="block text-[11px] font-bold mb-1 opacity-75">
                {m.sender === 'COACH' ? 'مربی فروشیار' : 'شما (سفیر فروش)'}
              </span>
              <p className="whitespace-pre-line">{m.textFa}</p>
            </div>
          ))}

          {/* Quick Coaching Prompts */}
          <div className="pt-2 space-y-1.5">
            <p className="text-xs font-semibold text-slate-500">
              پرسش‌های پرتکرار پیش از جلسه فروش:
            </p>
            {[
              'چطور در جلسه اول با مدیر شوروم سنگ، DecorMate و SlabMate را همزمان معرفی کنم؟',
              'وقتی مدیر سالن زیبایی می‌گوید «منشی من وقت کار با نرم‌افزار ندارد» چه پاسخی بدهم؟',
              'چگونه بدون دادن تخفیف، اعتراض «قیمت شما بالاست» را مدیریت کنم؟',
            ].map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuestion(promptText)}
                className="w-full text-right p-2.5 rounded-xl border border-slate-200 hover:border-sky-600 hover:bg-sky-50/50 text-xs text-slate-700 transition-colors"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputFa}
              onChange={(e) => setInputFa(e.target.value)}
              placeholder="سوال یا چالش مذاکره خود را از مربی بپرسید..."
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
            <button
              type="submit"
              disabled={isLoading || !inputFa.trim()}
              className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? '...' : 'ارسال'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
