import { ProductId, SaleType } from '../domain/core';

export interface ProductTrainingModule {
  id: string;
  titleFa: string;
  principleFa: string;
  wrongApproachFa: string;
  rightApproachFa: string;
  trustImpactDelta: number;
  consequenceAnimationLabel: string;
}

export interface ExamQuestion {
  id: string;
  questionFa: string;
  contextFa: string;
  options: {
    id: string;
    textFa: string;
    isCorrect: boolean;
    coachFeedbackFa: string;
  }[];
}

export interface ProductCatalogItem {
  id: ProductId;
  nameFa: string;
  nameEn: string;
  taglineFa: string;
  categoryFa: string;
  targetPersonaFa: string;
  painPointFa: string;
  valuePropositionFa: string;
  typicalDealIrr: number;
  recommendedSaleType: SaleType;
  heroImageUrl?: string;
  trainingModules: ProductTrainingModule[];
  examQuestions: ExamQuestion[];
  fieldEvaluationChecklist: {
    id: string;
    criterionFa: string;
    verificationMethodFa: string;
  }[];
}

export interface SimulationDialogueStep {
  stepNumber: number;
  stageLabelFa: string; // Observe / Listen / Choose / Speak
  clientQuoteFa: string;
  clientSubtextFa: string; // What the client is actually thinking (Observe phase)
  clientToneFa: string;
  initialTrust: number;
  initialResistance: number;
  options: {
    id: string;
    labelFa: string;
    spokenScriptFa: string;
    tacticType: 'CONSULTATIVE_MASTER' | 'PREMATURE_PITCH' | 'DISCOUNT_TRAP' | 'DEFENSIVE_ARGUE';
    isOptimal: boolean;
    trustDelta: number;
    resistanceDelta: number;
    clientReactionFa: string;
    consequenceVisualFa: string;
    coachFeedbackFa: string;
  }[];
  speechEvaluationRubric: {
    requiredKeywordsFa: string[];
    forbiddenTrapWordsFa: string[];
    idealHintFa: string;
  };
}

export interface SalesScenario {
  id: string;
  productId: ProductId | 'GENERAL';
  titleFa: string;
  clientNameFa: string;
  clientRoleFa: string;
  locationFa: string;
  difficultyFa: 'پایه' | 'متوسط' | 'پیشرفته';
  imageUrl: string;
  missionBriefFa: string;
  passingTrustThreshold: number;
  steps: SimulationDialogueStep[];
}

export const HERO_IMAGE_PATH = '/src/assets/images/hero_sales_academy_1790706266072.jpg';
export const COACH_AVATAR_PATH = '/src/assets/images/coach_avatar_portrait_1790706278845.jpg';
export const SHOWROOM_SCENARIO_PATH = '/src/assets/images/scenario_showroom_deal_1790706291470.jpg';
export const SALON_SCENARIO_PATH = '/src/assets/images/scenario_salon_gold_deal_1790706302914.jpg';

export const SALE_TYPE_LABELS: Record<
  SaleType,
  { titleFa: string; code: SaleType; defaultBasePercent: number; descriptionFa: string }
> = {
  initial_license: {
    titleFa: 'فروش لایسنس اولیه (Initial License)',
    code: 'initial_license',
    defaultBasePercent: 25,
    descriptionFa: 'راه‌اندازی و فعال‌سازی لایسنس پایه نرم‌افزار برای مشتری جدید',
  },
  website_plus_license: {
    titleFa: 'وب‌سایت اختصاصی + لایسنس (Website + License)',
    code: 'website_plus_license',
    defaultBasePercent: 30,
    descriptionFa: 'ارائه پکیج کامل ویترین دیجیتال و وب‌سایت اختصاصی به همراه لایسنس سامانه',
  },
  annual_renewal: {
    titleFa: 'تمدید سالانه و پشتیبانی (Annual Renewal)',
    code: 'annual_renewal',
    defaultBasePercent: 15,
    descriptionFa: 'تمدید قرارداد سالانه و ارتقای سرویس مشتری فعلی',
  },
  cross_module: {
    titleFa: 'فروش مکمل چندماژولی (Cross-Module)',
    code: 'cross_module',
    defaultBasePercent: 35,
    descriptionFa: 'فروش هم‌افزای ماژول مکمل (مثلاً اتصال SlabMate و DecorMate در یک شوروم)',
  },
};

export const ECOSYSTEM_PRODUCTS: Record<ProductId, ProductCatalogItem> = {
  DECORMATE: {
    id: 'DECORMATE',
    nameFa: 'دکورمیت',
    nameEn: 'DecorMate',
    taglineFa: 'تجسم آنی متریال، کاشی، سرامیک و پارکت در فضای واقعی مشتری',
    categoryFa: 'معماری و دکوراسیون داخلی',
    targetPersonaFa: 'مدیران شوروم‌های کاشی و سرامیک، کلینیک‌های ساختمانی و دفاتر طراحی داخلی',
    painPointFa: 'مشتری نهایی در شوروم بین ده‌ها نمونه سردرگم می‌شود و به دلیل تردید در نتیجه نهایی، خرید را به تعویق می‌اندازد.',
    valuePropositionFa: 'کاهش ۶۰ درصدی زمان تصمیم‌گیری خریدار نهایی و افزایش نرخ تبدیل بازدیدکننده حضوری به خریدار قطعی در شوروم.',
    typicalDealIrr: 180_000_000,
    recommendedSaleType: 'website_plus_license',
    heroImageUrl: SHOWROOM_SCENARIO_PATH,
    trainingModules: [
      {
        id: 'dm_mod_1',
        titleFa: 'کشف گلوگاه «تردید بصری خریدار» در شوروم',
        principleFa: 'به جای معرفی فنی موتور رندر، ابتدا هزینه از دست رفتن مشتری‌های مردد در شوروم را با مدیر محاسبه کنید.',
        wrongApproachFa: '«دکورمیت با هوش مصنوعی عکس اتاق را می‌گیرد و سرامیک را با دقت پیکسل بالا جایگزین می‌کند.»',
        rightApproachFa: '«از هر ۱۰ نفری که وارد شوروم شما می‌شوند و نمونه می‌بینند، چند نفرشان به خاطر اینکه نمی‌توانند طرح را در خانه خودشان تصور کنند، می‌گویند "فکرهایمان را می‌کنیم و برمی‌گردیم"؟»',
        trustImpactDelta: 25,
        consequenceAnimationLabel: 'تغییر تمرکز مشتری از «هزینه نرم‌افزار» به «سود معاملات ازدست‌رفته»',
      },
      {
        id: 'dm_mod_2',
        titleFa: 'نمایش زنده ۳۰ ثانیه‌ای روی موبایل خود مشتری',
        principleFa: 'در فروش DecorMate، دیدن مساوی با باور کردن است؛ تبلت یا گوشی را به دست خود مدیر شوروم بدهید.',
        wrongApproachFa: 'نشان دادن اسلایدهای پاورپوینت و کاتالوگ PDF به مدت ۲۰ دقیقه.',
        rightApproachFa: 'عکسبرداری در لحظه از کف همان شوروم و تغییر متریال با یک لمس توسط خود مدیر فروشگاه.',
        trustImpactDelta: 30,
        consequenceAnimationLabel: 'تجربه مستقیم سادگی کاربری (رفع مقاومت تیم فروش سنتی شوروم)',
      },
    ],
    examQuestions: [
      {
        id: 'dm_q1',
        contextFa: 'مدیر شوروم سرامیک می‌گوید: «فروشنده‌های من باتجربه هستند و خودشان به مشتری مشاوره می‌دهند، نیازی به نرم‌افزار نداریم.»',
        questionFa: 'حرفه‌ای‌ترین واکنش سفیر فروشیار در این لحظه چیست؟',
        options: [
          {
            id: 'a',
            textFa: 'تایید مهارت فروشندگان ایشان و طرح سوال درباره تعداد زوج‌هایی که به دلیل اختلاف نظر در تصور رنگ و طرح، خرید را نیمه‌کاره رها می‌کنند.',
            isCorrect: true,
            coachFeedbackFa: 'دقیقاً درست است! شما گارد دفاعی فروشندگان را خنثی کردید و DecorMate را به عنوان ابزار قدرت‌بخش به تیم فروش معرفی نمودید.',
          },
          {
            id: 'b',
            textFa: 'رد کردن حرف مدیر و گفتن اینکه روش سنتی دیگر منسوخ شده و رقبا با هوش مصنوعی بازار را می‌گیرند.',
            isCorrect: false,
            coachFeedbackFa: 'زیر سوال بردن تجربه تیم مشتری باعث ایجاد گارد دفاعی فوری می‌شود.',
          },
          {
            id: 'c',
            textFa: 'پیشنهاد تخفیف ۲۰ درصدی فوری برای اینکه نرم‌افزار را امتحان کنند.',
            isCorrect: false,
            coachFeedbackFa: 'تخفیف قبل از خلق ارزش، نشانه ضعف محصول تلقی می‌شود.',
          },
        ],
      },
      {
        id: 'dm_q2',
        contextFa: 'مشتری می‌پرسد: «وارد کردن طرح‌های سرامیک ما داخل DecorMate چقدر زمان و نیروی فنی می‌خواهد؟»',
        questionFa: 'کدام پاسخ بر اساس ارزش واقعی محصول صحیح است؟',
        options: [
          {
            id: 'a',
            textFa: 'توضیح فرآیند استاندارد بارگذاری سریع کاتالوگ دیجیتال و امکان شروع با ۲۰ طرح پرفروش شوروم در کمتر از ۴۸ ساعت.',
            isCorrect: true,
            coachFeedbackFa: 'عالی! شکستن کار بزرگ به یک شروع سریع و ملموس (۲۰ طرح پرفروش) اضطراب اجرایی مشتری را از بین می‌برد.',
          },
          {
            id: 'b',
            textFa: 'گفتن اینکه خودتان باید یک گرافیست سهبعدی استخدام کنید تا تمام طرح‌ها را مدل‌سازی کند.',
            isCorrect: false,
            coachFeedbackFa: 'این پاسخ نادرست است و مانع ذهنی بزرگی برای خرید ایجاد می‌کند.',
          },
        ],
      },
      {
        id: 'dm_q3',
        contextFa: 'در انتهای جلسه دمو، مدیر شوروم از قابلیت‌ها استقبال می‌کند اما می‌گوید با شریکش هم باید مشورت کند.',
        questionFa: 'بهترین گام بعدی برای قفل کردن پیشرفت معامله چیست؟',
        options: [
          {
            id: 'a',
            textFa: 'آماده‌سازی یک لینک اختصاصی با ۳ متریال واقعی همان شوروم تا مدیر بتواند در جلسه با شریکش، فضای دفتر خودشان را به صورت زنده تغییر دهد و تعیین زمان دقیق تماس بعدی.',
            isCorrect: true,
            coachFeedbackFa: 'فوق‌العاده! به جای رها کردن مشتری با یک کاتالوگ، شما یک ابزار تجربه زنده برای تصمیم‌گیرنده دوم فرستادید.',
          },
          {
            id: 'b',
            textFa: 'اصرار بر امضای قرارداد در همان لحظه و گفتن اینکه قیمت فردا ۳۰ درصد گران‌تر می‌شود.',
            isCorrect: false,
            coachFeedbackFa: 'فشار مصنوعی در فروش B2B اعتبار سفیر را از بین می‌برد.',
          },
        ],
      },
      {
        id: 'dm_q4',
        contextFa: 'مدیر شوروم علاوه بر فروش حضوری، می‌خواهد مشتریان اینستاگرام هم قبل از مراجعه، سرامیک‌ها را در خانه خودشان تست کنند.',
        questionFa: 'کدام مدل فروش برای این نیاز بالاترین ارزش و کمیسیون مجاز را ایجاد می‌کند؟',
        options: [
          {
            id: 'a',
            textFa: 'پیشنهاد پکیج وب‌سایت اختصاصی به همراه لایسنس (website_plus_license) تا ویترین آنلاین شوروم مستقیماً به موتور تجسم DecorMate متصل شود.',
            isCorrect: true,
            coachFeedbackFa: 'کاملاً صحیح! این پیشنهاد دقیقاً نیاز جذب لید آنلاین مشتری را حل می‌کند.',
          },
          {
            id: 'b',
            textFa: 'منصرف کردن مشتری از وب‌سایت برای اینکه سریع‌تر لایسنس ساده را بخرد.',
            isCorrect: false,
            coachFeedbackFa: 'نادیده گرفتن نیاز صریح مشتری هم ارزش راهکار و هم درآمد سفیر را کاهش می‌دهد.',
          },
        ],
      },
    ],
    fieldEvaluationChecklist: [
      {
        id: 'dm_fe_1',
        criterionFa: 'اجرای دموی زنده تعویض متریال در محیط واقعی شوروم زیر ۶۰ ثانیه',
        verificationMethodFa: 'ارزیابی عملی در حضور سرپرست فروش میدانی',
      },
      {
        id: 'dm_fe_2',
        criterionFa: 'محاسبه دقیق نرخ بازگشت سرمایه (ROI) بر اساس میانگین فاکتور شوروم',
        verificationMethodFa: 'ثبت کاربرگ تحلیل مالی مشتری واقعی',
      },
    ],
  },

  SLABMATE: {
    id: 'SLABMATE',
    nameFa: 'اسلب‌میت',
    nameEn: 'SlabMate',
    taglineFa: 'مدیریت دیجیتال موجودی، بوک‌مچینگ و نمایش اسلب‌های سنگ و سرامیک ابعاد بزرگ',
    categoryFa: 'صنعت سنگ و اسلب‌های ساختمانی',
    targetPersonaFa: 'کارخانجات سنگبری، گالری‌های سنگ اسلب و صادرکنندگان سنگ‌های ساختمانی',
    painPointFa: 'جابجایی فیزیکی اسلب‌های سنگین برای نشان دادن رگه‌ها و چیدمان Book-Match/Four-Match پرخطر، زمان‌بر و پرهزینه است.',
    valuePropositionFa: 'نمایش دقیق چیدمان بوک‌مچ و موجودی لحظه‌ای کوپ و اسلب به معماران بدون جابجایی فیزیکی بار در انبار.',
    typicalDealIrr: 240_000_000,
    recommendedSaleType: 'cross_module',
    heroImageUrl: SHOWROOM_SCENARIO_PATH,
    trainingModules: [
      {
        id: 'sm_mod_1',
        titleFa: 'زبان تخصصی گالری‌داران سنگ اسلب (کوپ، دسته، بوک‌مچ)',
        principleFa: 'سفیر SlabMate باید تفاوت اسلب طبیعی، رگه‌دار و چیدمان بوک‌مچ را بداند تا اعتماد صاحب سنگبری را در دقیقه اول جلب کند.',
        wrongApproachFa: 'استفاده از ادبیات عمومی نرم‌افزار انبارداری برای فروش به گالری سنگ.',
        rightApproachFa: 'صحبت درباره چالش نمایش همزمان ۴ اسلب بوک‌مچ به معمار پروژه لوکس بدون نیاز به جرثقیل سقفی.',
        trustImpactDelta: 28,
        consequenceAnimationLabel: 'ایجاد اعتبار صنفی فوری نزد مدیر گالری سنگ',
      },
      {
        id: 'sm_mod_2',
        titleFa: 'فروش هم‌افزا (Cross-Module) با DecorMate',
        principleFa: 'ترکیب SlabMate (مدیریت و بوک‌مچ اسلب) با DecorMate (نصب مجازی اسلب در لابی یا قاب تلویزیون) ارزش پیشنهاد را دوچندان می‌کند.',
        wrongApproachFa: 'فروش تک‌بعدی بدون اشاره به قابلیت تجسم در فضای پروژه معمار.',
        rightApproachFa: 'نشان دادن زنجیره کامل: انتخاب دسته اسلب در SlabMate و مشاهده فوری بوک‌مچ آن روی دیوار لابی در DecorMate.',
        trustImpactDelta: 32,
        consequenceAnimationLabel: 'ارتقای معامله به سطح Cross-Module با بیشترین ارزش افزوده',
      },
    ],
    examQuestions: [
      {
        id: 'sm_q1',
        contextFa: 'مدیر گالری سنگ می‌گوید: «معمارها دوست دارند سنگ طبیعی را از نزدیک لمس کنند، نرم‌افزار به درد سنگ نمی‌خورد.»',
        questionFa: 'بهترین پاسخ مشاوره‌ای چیست؟',
        options: [
          {
            id: 'a',
            textFa: 'تایید اهمیت لمس اسلب اول در گالری و توضیح اینکه SlabMate جایگزین لمس سنگ نیست، بلکه اجازه می‌دهد معمار همان سنگ لمس‌شده را در چیدمان بوک‌مچ ۴تایی و ابعاد واقعی دیوار پروژه ببیند بدون اینکه جرثقیل ۴ اسلب ۳۰۰ کیلویی را جابجا کند.',
            isCorrect: true,
            coachFeedbackFa: 'عالی! شما حس لمس فیزیکی را تایید کردید و SlabMate را حل‌کننده چالش فیزیکی چیدمان بوک‌مچ قرار دادید.',
          },
          {
            id: 'b',
            textFa: 'گفتن اینکه امروزه دیگر کسی به گالری سنگ نمی‌آید و همه اینترنتی سنگ می‌خرند.',
            isCorrect: false,
            coachFeedbackFa: 'این ادعا با واقعیت بازار سنگ‌های لوکس در تضاد است و اعتبار شما را زیر سوال می‌برد.',
          },
        ],
      },
      {
        id: 'sm_q2',
        contextFa: 'صاحب سنگبری نگران است که اسلبی که به معمار معرفی می‌شود، قبلاً توسط فروشنده دیگری فروخته شده باشد.',
        questionFa: 'کدام قابلیت SlabMate مستقیماً این دغدغه را برطرف می‌کند؟',
        options: [
          {
            id: 'a',
            textFa: 'مدیریت موجودی زنده دسته‌ها و باندل‌های اسلب با وضعیت رزرو آنی برای هر پروژه معماری.',
            isCorrect: true,
            coachFeedbackFa: 'کاملاً درست. جلوگیری از دوباره‌فروشی یک باندل خاص سنگ، یکی از قوی‌ترین نقاط ارزش SlabMate است.',
          },
          {
            id: 'b',
            textFa: 'ارسال پیامک تبریک تولد به معماران.',
            isCorrect: false,
            coachFeedbackFa: 'این پاسخ هیچ ارتباطی با مشکل موجودی باندل سنگ ندارد.',
          },
        ],
      },
      {
        id: 'sm_q3',
        contextFa: 'مشتری می‌پرسد آیا می‌تواند لینک موجودی یک دسته سنگ خاص را برای معمار در دفترش بفرستد؟',
        questionFa: 'پاسخ صحیح چیست؟',
        options: [
          {
            id: 'a',
            textFa: 'بله، امکان اشتراک‌گذاری شناسنامه دیجیتال هر باندل اسلب با واتساپ یا لینک اختصاصی همراه با ابعاد دقیق و پیش‌نمایش بوک‌مچ وجود دارد.',
            isCorrect: true,
            coachFeedbackFa: 'دقیقاً درست! این ویژگی سرعت تایید سنگ در جلسات کارفرما و معمار را چند برابر می‌کند.',
          },
          {
            id: 'b',
            textFa: 'خیر، نرم‌افزار فقط روی یک کامپیوتر آفلاین در انبار کار می‌کند.',
            isCorrect: false,
            coachFeedbackFa: 'اطلاعات نادرست درباره معماری ابری و اشتراک‌گذاری محصول.',
          },
        ],
      },
      {
        id: 'sm_q4',
        contextFa: 'گالری سنگ هم شوروم اسلب دارد و هم بخش کاشی و سرامیک لوکس.',
        questionFa: 'بهترین استراتژی پیشنهاد محصول چیست؟',
        options: [
          {
            id: 'a',
            textFa: 'ارائه راهکار یکپارچه SlabMate + DecorMate (فروش Cross-Module) برای پوشش همزمان بوک‌مچ اسلب و تجسم کاشی و سرامیک.',
            isCorrect: true,
            coachFeedbackFa: 'احسنت! تشخیص بهنگام فرصت Cross-Module نشانه بلوغ بالای سفیر فروش است.',
          },
          {
            id: 'b',
            textFa: 'نادیده گرفتن بخش کاشی و اصرار بر فروش فقط یک ماژول.',
            isCorrect: false,
            coachFeedbackFa: 'فرصت یکپارچه‌سازی شوروم مشتری را از دست داده‌اید.',
          },
        ],
      },
    ],
    fieldEvaluationChecklist: [
      {
        id: 'sm_fe_1',
        criterionFa: 'نمایش عملی شبیه‌سازی Book-Match و Four-Match به مدیر گالری سنگ',
        verificationMethodFa: 'ارزیابی میدانی در گالری سنگ',
      },
      {
        id: 'sm_fe_2',
        criterionFa: 'ثبت صحیح شناسنامه یک باندل اسلب نمونه و ارسال لینک اشتراک به معمار',
        verificationMethodFa: 'تایید سرپرست فنی فروش',
      },
    ],
  },

  SALONMATE: {
    id: 'SALONMATE',
    nameFa: 'سالن‌میت',
    nameEn: 'SalonMate',
    taglineFa: 'مدیریت هوشمند نوبت‌دهی، وفادارسازی مشتریان و تسویه حساب لاین‌های زیبایی',
    categoryFa: 'مدیریت سالن‌های زیبایی و کلینیک‌ها',
    targetPersonaFa: 'مدیران سالن‌های زیبایی پرمراجعه، کلینیک‌های پوست و مو و مراکز اسپا',
    painPointFa: 'کنسلی‌های دقیقه نودی نوبت‌ها، بی‌نظمی در محاسبه پورسانت پرسنل هر لاین و فراموشی مراجعات دوره‌ای مشتریان.',
    valuePropositionFa: 'کاهش ۷۰ درصدی نوبت‌های سوخته با یادآوری هوشمند و شفافیت ۱۰۰ درصدی مالی بین مدیریت سالن و متخصصان هر لاین.',
    typicalDealIrr: 95_000_000,
    recommendedSaleType: 'initial_license',
    heroImageUrl: SALON_SCENARIO_PATH,
    trainingModules: [
      {
        id: 'sal_mod_1',
        titleFa: 'محاسبه زیان «صندلی خالی و کنسلی بدون اطلاع»',
        principleFa: 'مدیر سالن زیبایی هر روز درگیر تلفن‌های تکراری و نوبت‌های سوخته است؛ با عدد ریالی صندلی خالی شروع کنید.',
        wrongApproachFa: 'شروع جلسه با توضیح دیتابیس و جداول حسابداری نرم‌افزار.',
        rightApproachFa: '«اگر در هفته فقط ۵ نوبت رنگ یا خدمات ویژه به خاطر فراموشی مشتری خالی بماند، ماهانه چقدر درآمد خالص سالن از دست می‌رود؟»',
        trustImpactDelta: 25,
        consequenceAnimationLabel: 'ملموس شدن بازگشت هزینه اشتراک سالانه در همان ماه اول',
      },
      {
        id: 'sal_mod_2',
        titleFa: 'حذف اصطکاک محاسبه سهم لاین‌ها و پرسنل',
        principleFa: 'یکی از بزرگ‌ترین خستگی‌های ذهنی مدیر سالن، حساب‌وکتاب آخر ماه با پرسنل درصدی است.',
        wrongApproachFa: 'نگفتن قابلیت تفکیک خودکار سهم سالن، مواد مصرفی و سهم متخصص.',
        rightApproachFa: 'نمایش گزارش یک‌کلیکی تسویه لاین‌ها با کسر خودکار هزینه مواد مصرفی.',
        trustImpactDelta: 28,
        consequenceAnimationLabel: 'ایجاد آرامش ذهنی برای مدیر سالن و افزایش اشتیاق خرید',
      },
    ],
    examQuestions: [
      {
        id: 'sal_q1',
        contextFa: 'مدیر سالن زیبایی می‌گوید: «منشی من همه نوبت‌ها را در سررسید کاغذی می‌نویسد و عادت داریم.»',
        questionFa: 'بهترین سوال کاوشگرانه برای نشان دادن ضعف سررسید کاغذی بدون توهین به منشی چیست؟',
        options: [
          {
            id: 'a',
            textFa: '«سررسید برای ثبت لحظه‌ای خوب است؛ اما وقتی بخواهید به ۱5۰ مشتری که ۴۵ روز پیش خدمات کراتین یا ترمیم داشته‌اند امروز خودکار پیام یادآوری بفرستید، سررسید کاغذی چطور به منشی شما کمک می‌کند؟»',
            isCorrect: true,
            coachFeedbackFa: 'فوق‌العاده! شما با یک سوال هوشمندانه، تفاوت «ثبت ایستا» و «بازگشت خودکار مشتری» را آشکار کردید.',
          },
          {
            id: 'b',
            textFa: '«سررسید کاغذی کار آدم‌های قدیمی است و منشی شما اشتباه می‌کند.»',
            isCorrect: false,
            coachFeedbackFa: 'توهین به روش فعلی مشتری یا پرسنل او، سریع‌ترین راه شکست جلسه است.',
          },
        ],
      },
      {
        id: 'sal_q2',
        contextFa: 'مدیر سالن نگران است که پرسنل از سیستم جدید استقبال نکنند.',
        questionFa: 'چگونه این نگرانی را مدیریت می‌کنید؟',
        options: [
          {
            id: 'a',
            textFa: 'نمایش پنل شفاف کارکرد روزانه هر متخصص روی موبایل خودش که باعث می‌شود پرسنل بدون ابهام پورسانت خود را لحظه‌ای ببینند.',
            isCorrect: true,
            coachFeedbackFa: 'عالی! شفافیت مالی انگیزه پرسنل را برای ثبت دقیق خدمات بالا می‌برد.',
          },
          {
            id: 'b',
            textFa: 'پیشنهاد جریمه کردن پرسنلی که با سیستم کار نمی‌کنند.',
            isCorrect: false,
            coachFeedbackFa: 'رویکرد تنبیهی تنش سازمانی ایجاد می‌کند.',
          },
        ],
      },
      {
        id: 'sal_q3',
        contextFa: 'مشتری درباره امنیت شماره تماس مشتریان VIP سالن سوال می‌پرسد.',
        questionFa: 'پاسخ حرفه‌ای سفیر چیست؟',
        options: [
          {
            id: 'a',
            textFa: 'توضیح ایزولاسیون کامل داده‌های هر سالن (Tenant Isolation) و قابلیت محدودسازی سطح دسترسی منشی به شماره‌های کامل مشتریان.',
            isCorrect: true,
            coachFeedbackFa: 'دقیقاً درست! حفظ محرمانگی لیست مشتریان در برابر کپی‌برداری یکی از دغدغه‌های کلیدی مدیران سالن است.',
          },
          {
            id: 'b',
            textFa: 'گفتن اینکه شماره‌ها برای همه قابل مشاهده است.',
            isCorrect: false,
            coachFeedbackFa: 'پاسخ کاملاً غیراصولی و خلاف معماری امنیتی.',
          },
        ],
      },
      {
        id: 'sal_q4',
        contextFa: 'مدیر سالن می‌خواهد پیج اینستاگرامش هم به سیستم رزرو آنلاین وصل شود.',
        questionFa: 'کدام پیشنهاد مناسب‌ترین است؟',
        options: [
          {
            id: 'a',
            textFa: 'ارائه وب‌سایت اختصاصی رزرو آنلاین متصل به SalonMate (پکیج website_plus_license) برای دریافت نوبت ۲۴ ساعته از بیوی اینستاگرام.',
            isCorrect: true,
            coachFeedbackFa: 'کاملاً صحیح! اتصال ترافیک اینستاگرام به رزرو خودکار، نرخ تبدیل پیج را متحول می‌کند.',
          },
          {
            id: 'b',
            textFa: 'گفتن اینکه نوبت‌دهی آنلاین امکان‌پذیر نیست.',
            isCorrect: false,
            coachFeedbackFa: 'عدم تسلط بر قابلیت‌های محصول.',
          },
        ],
      },
    ],
    fieldEvaluationChecklist: [
      {
        id: 'sal_fe_1',
        criterionFa: 'تعریف کامل ۳ لاین خدماتی، فرمول پورسانت ترکیبی و سناریوی یادآوری خودکار',
        verificationMethodFa: 'ارزیابی عملی در محیط دموی زنده',
      },
    ],
  },

  AUTOBARTER: {
    id: 'AUTOBARTER',
    nameFa: 'اتوبارتر',
    nameEn: 'AutoBarter',
    taglineFa: 'پلتفرم هوشمند تهاتر و معاوضه چندجانبه خودرو و دارایی‌های سرمایه‌ای',
    categoryFa: 'معاملات خودرو و تهاتر هوشمند',
    targetPersonaFa: 'نمایشگاه‌داران بزرگ خودرو، سرمایه‌گذاران ملکی-خودرویی و مراکز معاوضه',
    painPointFa: 'قفل شدن معاملات به دلیل نبود نقدینگی کامل یا عدم تطابق مستقیم دو طرف معامله در معاوضه یک‌به‌یک.',
    valuePropositionFa: 'کشف خودکار زنجیره‌های تهاتر ۲ و ۳ جانبه بین خودروها و ملک با محاسبه دقیق مابه‌التفاوت (سرانه).',
    typicalDealIrr: 210_000_000,
    recommendedSaleType: 'initial_license',
    heroImageUrl: SHOWROOM_SCENARIO_PATH,
    trainingModules: [
      {
        id: 'ab_mod_1',
        titleFa: 'حل معضل «قفل نقدینگی» با موتور تطبیق چندجانبه',
        principleFa: 'در بازار رکودی، معاوضه (Barter) تنها راه گردش کار نمایشگاه است؛ AutoBarter معاملات قفل‌شده را باز می‌کند.',
        wrongApproachFa: 'معرفی AutoBarter به عنوان یک سایت آگهی ساده خودرو.',
        rightApproachFa: 'نمایش چگونگی بسته شدن یک معامله ۳ ضلعی وقتی خریدار الف خودروی ب را می‌خواهد اما خودروی خودش مورد نیاز نفر ج است.',
        trustImpactDelta: 30,
        consequenceAnimationLabel: 'درک تمایز بنیادی AutoBarter با پلتفرم‌های آگهی معمولی',
      },
    ],
    examQuestions: [
      {
        id: 'ab_q1',
        contextFa: 'مدیر اتوگالری می‌گوید: «ما خودمان در گروه‌های واتساپی همکاران، خودروها را برای معاوضه می‌گذاریم.»',
        questionFa: 'پاسخ حرفه‌ای سفیر چیست؟',
        options: [
          {
            id: 'a',
            textFa: '«گروه‌های همکاران عالی است؛ اما وقتی ۲۰۰ فایل در روز ارسال می‌شود، چند زنجیره معاوضه ۳ جانبه با سرانه مشخص از چشم انسان دور می‌ماند که الگوریتم AutoBarter در یک ثانیه آن‌ها را به هم وصل می‌کند؟»',
            isCorrect: true,
            coachFeedbackFa: 'عالی! ارزش الگوریتم تطبیق چندجانبه را در برابر محدودیت حافظه انسانی به تصویر کشیدید.',
          },
          {
            id: 'b',
            textFa: '«گروه‌های واتساپی هیچ فایده‌ای ندارند.»',
            isCorrect: false,
            coachFeedbackFa: 'رد کردن ابزار فعلی مشتری بدون منطق، مقاومت ایجاد می‌کند.',
          },
        ],
      },
      {
        id: 'ab_q2',
        contextFa: 'مشتری می‌پرسد مابه‌التفاوت نقدی (سرانه) در تهاتر چطور مدیریت می‌شود؟',
        questionFa: 'پاسخ دقیق کدام است؟',
        options: [
          {
            id: 'a',
            textFa: 'تعیین سقف پرداخت نقدی و بازه ارزش مجاز برای هر طرف و فیلتر خودکار پیشنهادهایی که با توان نقدینگی طرفین همخوانی دارند.',
            isCorrect: true,
            coachFeedbackFa: 'کاملاً صحیح! واقع‌بینی در توان پرداخت سرانه، کلید عملیاتی شدن تهاتر است.',
          },
          {
            id: 'b',
            textFa: 'سیستم فقط خودروهای هم‌قیمت را معاوضه می‌کند.',
            isCorrect: false,
            coachFeedbackFa: 'پاسخ نادرست و محدودکننده.',
          },
        ],
      },
      {
        id: 'ab_q3',
        contextFa: 'مدیر نمایشگاه نگران افشای اطلاعات مالک اصلی خودرو برای سایر نمایشگاه‌هاست.',
        questionFa: 'چگونه اطمینان خاطر می‌دهید؟',
        options: [
          {
            id: 'a',
            textFa: 'اطلاعات تماس مالک نهایی کاملاً در کارتابل خصوصی اتوگالری شما محفوظ می‌ماند و در شبکه تهاتر فقط مشخصات فنی خودرو و کد کارگزاری شما نمایش داده می‌شود.',
            isCorrect: true,
            coachFeedbackFa: 'دقیقاً درست! حفظ کمیسیون و ارتباط اختصاصی کارگزار خط قرمز این صنف است.',
          },
          {
            id: 'b',
            textFa: 'شماره مالک به همه نمایش داده می‌شود.',
            isCorrect: false,
            coachFeedbackFa: 'این کار باعث حذف نقش نمایشگاه‌دار و شکست کامل فروش می‌شود.',
          },
        ],
      },
      {
        id: 'ab_q4',
        contextFa: 'یک هلدینگ خودرویی علاوه بر AutoBarter می‌خواهد نمایشگاه‌های آنلاین اختصاصی هم داشته باشد.',
        questionFa: 'کدام مدل فروش مناسب است؟',
        options: [
          {
            id: 'a',
            textFa: 'پکیج وب‌سایت اختصاصی + لایسنس (website_plus_license) برای دریافت مستقیم درخواست‌های معاوضه مشتریان.',
            isCorrect: true,
            coachFeedbackFa: 'صحیح! جذب مستقیم لید معاوضه از وب‌سایت، سوخت موتور تهاتر را تامین می‌کند.',
          },
          {
            id: 'b',
            textFa: 'فروش تکی بدون وب‌سایت.',
            isCorrect: false,
            coachFeedbackFa: 'نیاز مشتری به ویترین آنلاین را نادیده گرفته‌اید.',
          },
        ],
      },
    ],
    fieldEvaluationChecklist: [
      {
        id: 'ab_fe_1',
        criterionFa: 'شبیه‌سازی ثبت ۵ فایل خودرو با شرایط سرانه متفاوت و استخراج گراف تهاتر ۳ جانبه',
        verificationMethodFa: 'ارزیابی عملی در حضور مدیر محصول AutoBarter',
      },
    ],
  },

  TANARA: {
    id: 'TANARA',
    nameFa: 'تانارا',
    nameEn: 'Tanara',
    taglineFa: 'پلتفرم جامع پایش سلامت، توانبخشی، سبک زندگی و خدمات توانمندسازی (توانا / بندستوانا)',
    categoryFa: 'سلامت دیجیتال و توانمندسازی',
    targetPersonaFa: 'مراکز توانبخشی، کلینیک‌های تندرستی، مجموعه‌های ورزشی-پزشکی و سازمان‌های همکار اکوسیستم توانا',
    painPointFa: 'قطع ارتباط درمانی و تمرینی مراجعه‌کننده بین جلسات حضوری و نبود پایش مستمر پیشرفت توانبخشی در خانه.',
    valuePropositionFa: 'پیگیری روزانه برنامه تمرینی و سلامت مراجعان با بازخورد هوشمند و افزایش ۸۰ درصدی تعهد به تکمیل دوره درمان.',
    typicalDealIrr: 130_000_000,
    recommendedSaleType: 'initial_license',
    heroImageUrl: SALON_SCENARIO_PATH,
    trainingModules: [
      {
        id: 'tn_mod_1',
        titleFa: 'فروش مبتنی بر همدلی و تداوم درمان در اکوسیستم توانا',
        principleFa: 'در فروش Tanara، محور گفتگو «تداوم نتیجه سلامت مراجع» و کاهش رها کردن نیمه‌کاره دوره‌های توانبخشی است.',
        wrongApproachFa: 'صحبت با ادبیات خشک تجاری بدون درک رسالت سلامت و توانمندسازی مرکز.',
        rightApproachFa: 'تمرکز بر اینکه چگونه همراهی دیجیتال بین دو جلسه حضوری، نتیجه درمانی کلینیک را تضمین و رضایت خانواده مراجع را دوچندان می‌کند.',
        trustImpactDelta: 30,
        consequenceAnimationLabel: 'همسویی کامل با ارزش‌های انسانی و حرفه‌ای مدیر کلینیک',
      },
    ],
    examQuestions: [
      {
        id: 'tn_q1',
        contextFa: 'مدیر مرکز توانبخشی می‌گوید: «مراجعان ما حوصله کار با اپلیکیشن‌های پیچیده را ندارند.»',
        questionFa: 'بهترین پاسخ مبتنی بر فلسفه Accessibility-First چیست؟',
        options: [
          {
            id: 'a',
            textFa: 'نمایش رابط کاربری فوق‌ساده، صوتی و تصویری Tanara که بر اساس اصول دسترس‌پذیری (Accessibility-First) شهر نوآوران AbleCity طراحی شده است.',
            isCorrect: true,
            coachFeedbackFa: 'عالی! طراحی دسترس‌پذیر یکی از مزیت‌های رقابتی اصلی اکوسیستم AbleCity و توانا است.',
          },
          {
            id: 'b',
            textFa: 'گفتن اینکه خانواده‌هایشان مجبورند یاد بگیرند.',
            isCorrect: false,
            coachFeedbackFa: 'پاسخ فاقد همدلی و خلاف اصول دسترس‌پذیری است.',
          },
        ],
      },
      {
        id: 'tn_q2',
        contextFa: 'کلینیک می‌پرسد Tanara چه تاثیری روی درآمد مرکز دارد؟',
        questionFa: 'پاسخ دقیق اقتصادی-درمانی چیست؟',
        options: [
          {
            id: 'a',
            textFa: 'افزایش نرخ تکمیل پکیج‌های درمانی ۱۰ جلسه‌ای و امکان ارائه بسته‌های پایش از راه دور (Tele-Care) برای مراجعان غیربومی.',
            isCorrect: true,
            coachFeedbackFa: 'کاملاً صحیح! هم کیفیت درمان حفظ می‌شود و هم جریان درآمدی پایدار شکل می‌گیرد.',
          },
          {
            id: 'b',
            textFa: 'هیچ تاثیر مالی ندارد و صرفاً هزینه‌بر است.',
            isCorrect: false,
            coachFeedbackFa: 'سفیر باید بتواند پایداری اقتصادی راهکار را برای مرکز تشریح کند.',
          },
        ],
      },
      {
        id: 'tn_q3',
        contextFa: 'پزشک مرکز نگران زمان‌بر بودن بررسی گزارش‌های روزانه بیماران است.',
        questionFa: 'کدام ویژگی Tanara این دغدغه را رفع می‌کند؟',
        options: [
          {
            id: 'a',
            textFa: 'داشبورد خلاصه‌ساز هوشمند که فقط موارد نیازمند توجه ویژه یا انحراف از برنامه تمرینی را برجسته می‌کند.',
            isCorrect: true,
            coachFeedbackFa: 'دقیقاً درست! احترام به زمان پزشک و درمانگر کلید پذیرش سیستم است.',
          },
          {
            id: 'b',
            textFa: 'پزشک باید روزانه ۲ ساعت پیام متنی بخواند.',
            isCorrect: false,
            coachFeedbackFa: 'پاسخ نادرست که مانع خرید می‌شود.',
          },
        ],
      },
      {
        id: 'tn_q4',
        contextFa: 'یک مرکز جامع هم خدمات تندرستی و هم رویدادهای آموزشی سلامت برگزار می‌کند.',
        questionFa: 'کدام پیشنهاد هم‌افزا مناسب است؟',
        options: [
          {
            id: 'a',
            textFa: 'ارائه بسته ترکیبی Tanara به همراه EventMate در قالب فروش Cross-Module.',
            isCorrect: true,
            coachFeedbackFa: 'درست است! هم‌افزایی بین محصولات اکوسیستم آفرینش ارزش راهکار را کامل می‌کند.',
          },
          {
            id: 'b',
            textFa: 'رد کردن نیاز بخش رویدادها.',
            isCorrect: false,
            coachFeedbackFa: 'چشم‌پوشی از فرصت Cross-Module.',
          },
        ],
      },
    ],
    fieldEvaluationChecklist: [
      {
        id: 'tn_fe_1',
        criterionFa: 'ارائه دموی دسترس‌پذیری (Accessibility) و سناریوی پایش درمان به مدیر کلینیک',
        verificationMethodFa: 'تایید ارزیاب میدانی اکوسیستم توانا',
      },
    ],
  },

  TALAYAR: {
    id: 'TALAYAR',
    nameFa: 'طلایار',
    nameEn: 'TalaYar',
    taglineFa: 'محاسبه آنی مظنه، اجرت، ویترین دیجیتال و مدیریت هوشمند گالری‌های طلا و جواهر',
    categoryFa: 'طلا، جواهر و مسکوکات',
    targetPersonaFa: 'گالری‌های طلا و جواهر، بنکداران طلا و فروشگاه‌های دارای ویترین حضوری و آنلاین',
    painPointFa: 'نوسان لحظه‌ای قیمت طلا، خطای انسانی فروشندگان در محاسبه اجرت و مالیات، و دشواری قیمت‌گذاری لحظه‌ای کالکشن‌ها در اینستاگرام و وب‌سایت.',
    valuePropositionFa: 'به‌روزرسانی خودکار قیمت تک‌تک مصنوعات بر اساس مظنه لحظه‌ای و صدور پیش‌فاکتور شفاف و بدون خطا در ۳ ثانیه.',
    typicalDealIrr: 195_000_000,
    recommendedSaleType: 'website_plus_license',
    heroImageUrl: SALON_SCENARIO_PATH,
    trainingModules: [
      {
        id: 'ty_mod_1',
        titleFa: 'حذف ریسک «فروش با قیمت جا مانده از مظنه» و خطای محاسبه فروشنده',
        principleFa: 'در بازار طلا، حتی ۱ درصد خطای محاسباتی در اجرت یا مظنه روی یک سرویس ۵۰ گرمی مساوی با زیان سنگین است.',
        wrongApproachFa: 'صحبت کلی درباره زیبایی فونت‌های نرم‌افزار.',
        rightApproachFa: 'محاسبه زیان یک اشتباه کوچک محاسباتی در روزهای پرنوسان بازار و نمایش قفل ایمنی مظنه در TalaYar.',
        trustImpactDelta: 30,
        consequenceAnimationLabel: 'ایجاد حس امنیت مالی فوری برای صاحب گالری طلا',
      },
    ],
    examQuestions: [
      {
        id: 'ty_q1',
        contextFa: 'طلافروش می‌گوید: «ما با ماشین‌حساب روی میز در ۱۰ ثانیه قیمت طلا را حساب می‌کنیم.»',
        questionFa: 'بهترین پاسخ مشاوره‌ای چیست؟',
        options: [
          {
            id: 'a',
            textFa: '«حساب کردن شما با ماشین‌حساب بسیار سریع است؛ اما وقتی در اینستاگرام یا ویترین دیجیتال ۲۰۰ مدل کار دارید و مظنه در روز ۵ بار تغییر می‌کند، چطور به ۵۰ مشتری که همزمان دایرکت می‌دهند "قیمت روز این انگشتر چند است؟" بدون تاخیر و خطا پاسخ می‌دهید؟»',
            isCorrect: true,
            coachFeedbackFa: 'درخشان! شما مهارت فردی طلافروش را تایید کردید و گلوگاه مقیاس‌پذیری پاسخگویی در نوسان قیمت را هدف گرفتید.',
          },
          {
            id: 'b',
            textFa: '«شما با ماشین‌حساب همیشه اشتباه حساب می‌کنید.»',
            isCorrect: false,
            coachFeedbackFa: 'زیر سوال بردن مهارت طلافروش باعث قطع فوری مکالمه می‌شود.',
          },
        ],
      },
      {
        id: 'ty_q2',
        contextFa: 'گالری طلا می‌پرسد در زمان نوسان شدید شبانه، سایت فروشگاهی چطور محافظت می‌شود؟',
        questionFa: 'کدام ویژگی TalaYar پاسخگوی این دغدغه است؟',
        options: [
          {
            id: 'a',
            textFa: 'مکانیزم توقف خودکار در نوسانات غیرعادی (Circuit Breaker) و حاشیه امنیت مظنه شبانه قابل تنظیم توسط مدیر گالری.',
            isCorrect: true,
            coachFeedbackFa: 'دقیقاً درست! این ویژگی مهم‌ترین نگرانی طلافروشان برای فروش آنلاین شبانه را برطرف می‌کند.',
          },
          {
            id: 'b',
            textFa: 'مشتری باید هر شب سایت را دستی خاموش کند.',
            isCorrect: false,
            coachFeedbackFa: 'پاسخ غیرحرفه‌ای و نادرست.',
          },
        ],
      },
      {
        id: 'ty_q3',
        contextFa: 'مشتری نهایی در گالری طلا می‌خواهد بداند چرا مبلغ نهایی اینقدر شده است.',
        questionFa: 'TalaYar چگونه اعتماد خریدار نهایی را جلب می‌کند؟',
        options: [
          {
            id: 'a',
            textFa: 'نمایش شفاف ریز فرمول قانونی (وزن × مظنه + اجرت ساخت + سود فروشنده + مالیات بر ارزش افزوده روی اجرت و سود) روی نمایشگر مشتری.',
            isCorrect: true,
            coachFeedbackFa: 'عالی! شفافیت کامل در فرمول طلا، تردید خریدار نهایی را به اعتماد تبدیل می‌کند.',
          },
          {
            id: 'b',
            textFa: 'نشان دادن فقط یک عدد کلی بدون جزئیات.',
            isCorrect: false,
            coachFeedbackFa: 'ابهام در فاکتور طلا اعتماد خریدار را کاهش می‌دهد.',
          },
        ],
      },
      {
        id: 'ty_q4',
        contextFa: 'گالری طلا می‌خواهد کاتالوگ آنلاین متصل به مظنه لحظه‌ای داشته باشد.',
        questionFa: 'بهترین نوع قرارداد چیست؟',
        options: [
          {
            id: 'a',
            textFa: 'پکیج وب‌سایت اختصاصی + لایسنس TalaYar (website_plus_license).',
            isCorrect: true,
            coachFeedbackFa: 'کاملاً صحیح! ویترین آنلاین متصل به مظنه، پرفروش‌ترین راهکار TalaYar است.',
          },
          {
            id: 'b',
            textFa: 'تمدید سالانه بدون لایسنس اولیه.',
            isCorrect: false,
            coachFeedbackFa: 'انتخاب نادرست نوع فروش.',
          },
        ],
      },
    ],
    fieldEvaluationChecklist: [
      {
        id: 'ty_fe_1',
        criterionFa: 'اجرای محاسبه زنده سرویس طلا با اجرت درصدی و ریالی و شبیه‌سازی تغییر مظنه آنی',
        verificationMethodFa: 'ارزیابی میدانی در گالری طلا و جواهر',
      },
    ],
  },

  EVENTMATE: {
    id: 'EVENTMATE',
    nameFa: 'ایونت‌میت',
    nameEn: 'EventMate',
    taglineFa: 'مدیریت هوشمند غرفه‌های نمایشگاهی، ثبت آنی سرنخ‌های تجاری (Lead Capture) و پیگیری پس از رویداد',
    categoryFa: 'مدیریت رویداد و نمایشگاه‌های B2B',
    targetPersonaFa: 'شرکت‌های حاضر در نمایشگاه‌های بین‌المللی، برگزارکنندگان همایش‌ها و تیم‌های بازاریابی صنعتی',
    painPointFa: 'گم شدن کارت‌های ویزیت کاغذی جمع‌شده در نمایشگاه و فراموشی پیگیری سرنخ‌های داغ بعد از پایان ۴ روز شلوغ نمایشگاه.',
    valuePropositionFa: 'ثبت دیجیتال بازدیدکننده در ۱۰ ثانیه با دسته‌بندی اولویت خرید و ارسال خودکار کاتالوگ اختصاصی در همان لحظه حضور در غرفه.',
    typicalDealIrr: 150_000_000,
    recommendedSaleType: 'initial_license',
    heroImageUrl: HERO_IMAGE_PATH,
    trainingModules: [
      {
        id: 'em_mod_1',
        titleFa: 'محاسبه هزینه «کارت ویزیت‌های فراموش‌شده در کشوی میز»',
        principleFa: 'شرکت‌ها میلیاردها ریال هزینه غرفه‌سازی می‌دهند اما ۸۰٪ سرنخ‌های نمایشگاه را به دلیل تاخیر در پیگیری از دست می‌دهند.',
        wrongApproachFa: 'معرفی EventMate به عنوان یک فرم‌ساز ساده.',
        rightApproachFa: 'محاسبه هزینه تمام‌شده هر بازدیدکننده غرفه (هزینه غرفه تقسیم بر تعداد بازدیدکننده) و نقش پیگیری در لحظه برای بازگشت هزینه نمایشگاه.',
        trustImpactDelta: 28,
        consequenceAnimationLabel: 'تغییر نگاه مدیر بازاریابی به EventMate به عنوان بیمه سرمایه نمایشگاهی',
      },
      {
        id: 'em_mod_2',
        titleFa: 'تبدیل مشتریِ «فعلاً نیاز ندارم» به شریک معرف ۱۵٪ با کد اختصاصی (TVN-PARTNER)',
        principleFa:
          'وقتی صاحب تالار یا واحد صنفی قاطعانه می‌گوید فعلاً نیاز ندارد، اصرار روی فروش باعث بسته شدن گارد او می‌شود؛ اما پیشنهاد درآمدزایی ۱۵٪ بدون یک ریال هزینه از طریق معرفی همکاران (تالارداران، سالن‌های زیبایی، گالری‌های مبل جهیزیه و طلافروشان)، او را به یک شریک فعال تبدیل می‌کند.',
        wrongApproachFa:
          'اصرار بی‌مورد روی فروش یا ترک مغازه با دست خالی و ناامیدی.',
        rightApproachFa:
          '«جناب حاج‌آقا، کاملاً به تصمیم شما احترام می‌گذارم که فعلاً خودتان نیاز ندارید؛ اما چون شما در صنف تالارداران و مجالس فرد شناخته‌شده‌ای هستید و تالارداران دیگر، سالن‌های زیبایی، گالری‌های مبل جهیزیه و طلافروشان با شما در ارتباطند، یک پیشنهاد درآمدزایی بدون یک ریال هزینه برایتان روی میز دارم: همین الان نام و آدرس تالار شما را در سیستم ثبت می‌کنم و یک کد معرف اختصاصی (TVN-PARTNER) به گوشی شما پیامک می‌کنم. هر تالار یا واحد صنفی دیگری که از طرف شما معرفی شود و قرارداد ببندد، ۱۵٪ از کل مبلغ قرارداد (حدود ۴ میلیون و ۳۵۰ هزار تومان در هر معرفی!) نقداً به شبای شما واریز می‌شود!»',
        trustImpactDelta: 35,
        consequenceAnimationLabel:
          'گارد مشتری ۱۰۰٪ باز می‌شود، با لبخند مشخصات و آدرسش را می‌دهد تا کد معرف بگیرد، و پس از دریافت اولین پورسانت، خودش هم ترغیب به خرید لایسنس می‌شود!',
      },
    ],
    examQuestions: [
      {
        id: 'em_q1',
        contextFa: 'مدیر بازاریابی یک کارخانه می‌گوید: «ما در غرفه دفترچه داریم و بچه‌ها شماره بازدیدکننده‌ها را می‌نویسند.»',
        questionFa: 'بهترین سوال برای روشن کردن چالش دفترچه کاغذی چیست؟',
        options: [
          {
            id: 'a',
            textFa: '«در روز سوم نمایشگاه که غرفه شلوغ است، چند درصد شماره‌ها ناخوانا نوشته می‌شود و چقدر طول می‌کشد تا بعد از نمایشگاه این دفترچه‌ها تایپ و به تیم فروش ارجاع شود؟»',
            isCorrect: true,
            coachFeedbackFa: 'عالی! تاخیر ۲ هفته‌ای در تایپ دفترچه‌ها یعنی سرد شدن کامل سرنخ نمایشگاهی.',
          },
          {
            id: 'b',
            textFa: '«دفترچه کاغذی زشت است.»',
            isCorrect: false,
            coachFeedbackFa: 'استدلال سطحی که دغدغه تجاری مدیر را هدف نمی‌گیرد.',
          },
        ],
      },
      {
        id: 'em_q2',
        contextFa: 'مشتری می‌پرسد اگر اینترنت سالن نمایشگاه قطع یا ضعیف باشد چه اتفاقی می‌افتد؟',
        questionFa: 'پاسخ دقیق فنی-کاربردی چیست؟',
        options: [
          {
            id: 'a',
            textFa: 'قابلیت ثبت آفلاین سرنخ‌ها در لحظه و همگام‌سازی خودکار به محض برقراری ارتباط پایدار.',
            isCorrect: true,
            coachFeedbackFa: 'کاملاً درست! قطع اینترنت در سالن‌های نمایشگاهی یک چالش واقعی است که EventMate برای آن آماده است.',
          },
          {
            id: 'b',
            textFa: 'در صورت قطع اینترنت هیچ اطلاعاتی ثبت نمی‌شود.',
            isCorrect: false,
            coachFeedbackFa: 'پاسخ نادرست.',
          },
        ],
      },
      {
        id: 'em_q3',
        contextFa: 'چگونه EventMate نرخ تبدیل بازدیدکننده غرفه را در همان لحظه بالا می‌برد؟',
        questionFa: 'کدام مکانیزم صحیح است؟',
        options: [
          {
            id: 'a',
            textFa: 'ارسال آنی کاتالوگ دقیق محصولی که بازدیدکننده در غرفه به آن علاقه نشان داده به همراه نام کارشناس مذاکره‌کننده، قبل از اینکه بازدیدکننده از غرفه خارج شود.',
            isCorrect: true,
            coachFeedbackFa: 'فوق‌العاده! این تجربه حرفه‌ای نام برند شرکت را در ذهن بازدیدکننده متمایز می‌کند.',
          },
          {
            id: 'b',
            textFa: 'ارسال پیامک تبلیغاتی یک ماه بعد از نمایشگاه.',
            isCorrect: false,
            coachFeedbackFa: 'یک ماه بعد، مشتری حتی نام غرفه را به یاد نمی‌آورد.',
          },
        ],
      },
      {
        id: 'em_q4',
        contextFa: 'یک شرکت سنگ و سرامیک در نمایشگاه بین‌المللی صنعت ساختمان شرکت می‌کند.',
        questionFa: 'بهترین ترکیب محصول برای این شرکت چیست؟',
        options: [
          {
            id: 'a',
            textFa: 'ترکیب EventMate (برای ثبت سرنخ غرفه) به همراه DecorMate/SlabMate (برای نمایش دیجیتال محصولات در غرفه) در قالب Cross-Module.',
            isCorrect: true,
            coachFeedbackFa: 'بی‌نظیر! این دقیقاً قدرت اکوسیستم یکپارچه آفرینش / AbleCity است.',
          },
          {
            id: 'b',
            textFa: 'فروش فقط یک محصول بدون توجه به موضوع نمایشگاه.',
            isCorrect: false,
            coachFeedbackFa: 'عدم استفاده از هم‌افزایی محصولات اکوسیستم.',
          },
        ],
      },
    ],
    fieldEvaluationChecklist: [
      {
        id: 'em_fe_1',
        criterionFa: 'ثبت کامل یک بازدیدکننده نمایشگاهی، تگ‌گذاری محصول مورد علاقه و ارسال آنی کاتالوگ در کمتر از ۱۵ ثانیه',
        verificationMethodFa: 'تست سرعت عملیاتی در سناریوی شلوغی غرفه',
      },
    ],
  },

  FURNIMATE: {
    id: 'FURNIMATE',
    nameFa: 'مبلیار (FurniMate VIP)',
    nameEn: 'FurniMate',
    taglineFa:
      'پکیج‌ساز هوشمند جهیزیه عروس (مبل + ناهارخوری + سرویس خواب)، محاسبه متراژ پارچه ترک/نانو، چک صیادی بنفش + سایت دائمی گالری مبل',
    categoryFa: 'گالری‌های مبلمان، سرویس خواب، میز ناهارخوری و پکیج جهیزیه عروس',
    targetPersonaFa:
      'مالکان نمایشگاه‌ها و گالری‌های مبل (یافت‌آباد، دلاوران، ملایر، قم، تبریز، مشهد، رشت و سراسر کشور) و تولیدکنندگان سرویس چوب و جهیزیه',
    painPointFa:
      '۹۰٪ عروس و دامادها و خریداران مبل پس از پرسیدن قیمت، به دلیل ابهام در مابه‌التفاوت متراژ پارچه (نانو/شانل ترک)، نوع کلاف چوب راش گرجستان، اقساط چک صیادی و نوشتن اعداد روی یک کاغذ بی‌هویت، می‌گویند «یک دور دیگر در بازار مبل بزنیم برمی‌گردیم» و در شلوغی بازار هرگز برنمی‌گردند!',
    valuePropositionFa:
      'ارزش هر پکیج جهیزیه عروس (مبل ۸ نفره + ناهارخوری + سرویس خواب و کنسول) بین ۱۲۰ تا ۳۵۰ میلیون تومان است؛ مبلیار با صدور فوری پیش‌فاکتور طلاکوب، گواهی ۵ سال ضمانت فوم سرد و کلاف راش، قفل ضدتورم و تبدیل شدن به سایت دائمی گالری مبل، تنها با حفظ ۱ عروس و داماد در سال بیش از ۱۰ برابر هزینه‌اش را برمی‌گرداند.',
    typicalDealIrr: 290_000_000,
    recommendedSaleType: 'website_plus_license',
    heroImageUrl: SHOWROOM_SCENARIO_PATH,
    trainingModules: [
      {
        id: 'furn_mod_1',
        titleFa: 'حل بحران «یک دور در بازار مبل بزنیم برمی‌گردیم» با پیش‌فاکتور طلاکوب جهیزیه',
        principleFa:
          'عروس و داماد بعد از دیدن ۱۰ گالری مبل، تمام قیمت‌های شفاهی را فراموش می‌کنند و فقط به گالری‌ای برمی‌گردند که پیش‌فاکتور رسمی طلاکوب با عکس، جزئیات چوب راش و جدول چک صیادی در گوشی‌شان فرستاده باشد.',
        wrongApproachFa:
          '«این برنامه قیمت مبل و ناهارخوری را با هم جمع می‌زند.»',
        rightApproachFa:
          '«حاج‌آقا/جناب مهندس، چند درصد از عروس و دامادها قیمت می‌گیرند و می‌گویند یک دور در بازار بزنیم برمی‌گردیم و دیگر پیدایشان نمی‌شود؟ با این سامانه در ۱۰ ثانیه پکیج کامل جهیزیه (مبل ۸ نفره + ناهارخوری + سرویس خواب)، متراژ دقیق پارچه نانو/ترک، ۵ سال ضمانت کلاف راش و فوم سرد و جدول چک صیادی بنفش را با نام گالری خودتان به واتساپ و پیامک عروس و داماد شلیک می‌کنید تا از مغازه چهارم مستقیم پیش خودتان برگردند!»',
        trustImpactDelta: 34,
        consequenceAnimationLabel:
          'صاحب گالری مبل دقیقاً بزرگ‌ترین درد روزمره بازار مبل را لمس کرده و مشتاق دیدن تبلت می‌شود.',
      },
      {
        id: 'furn_mod_2',
        titleFa: 'محاسبه شفاف مابه‌التفاوت متراژ پارچه (نانو / مازراتی / شانل ترک)',
        principleFa:
          'در فروش مبلمان، تغییر گرید پارچه روی ۳۲ متر پارچه مصرفی، قیمت نهایی را ۱۰ تا ۴۰ میلیون تومان جابه‌جا می‌کند که محاسبه دستی آن زمان‌بر و محل چانه‌زنی است.',
        wrongApproachFa:
          '«هر پارچه‌ای مشتری خواست خودتان دستی حساب کنید.»',
        rightApproachFa:
          '«فقط اسلایدر متراژ پارچه و مابه‌التفاوت پارچه ترک/نانو را روی تبلت تکان دهید تا جلوی چشم عروس و داماد و خانواده‌ها، هزینه دقیق ارتقای پارچه و تخفیف پکیج جهیزیه در ۱ ثانیه بدون هیچ ابهامی در پیش‌فاکتور طلاکوب درج شود.»',
        trustImpactDelta: 28,
        consequenceAnimationLabel:
          'حذف کامل چانه‌زنی و بی‌اعتمادی خریدار بر سر اختلاف قیمت پارچه و رنگ چوب.',
      },
      {
        id: 'furn_mod_3',
        titleFa: 'تبدیل گالری‌دارِ «فعلاً نیاز ندارم» به معرف ۱۵٪ با کد اختصاصی (TVN-PARTNER)',
        principleFa:
          'هر نمایشگاه‌دار مبل در یافت‌آباد، دلاوران، ملایر یا قم حداقل با ۲۰ گالری مبل دیگر، کابینت‌سازان، تالارداران و سالن‌های زیبایی عروس در ارتباط مستقیم است.',
        wrongApproachFa:
          'خروج دست خالی از گالری مبل پس از شنیدن جمله «فعلاً خودمان نیاز نداریم».',
        rightApproachFa:
          '«جناب حاج‌آقا، کاملاً به تصمیم شما احترام می‌گذارم که فعلاً خودتان نیاز ندارید؛ اما چون شما در بازار مبل و جهیزیه فرد خوش‌نامی هستید و همکاران گالری مبل، کابینت‌سازان و تالارداران با شما در ارتباطند، همین الان نام و آدرس گالری شما را در سیستم ثبت می‌کنم و کد معرف اختصاصی (TVN-PARTNER) به گوشی شما پیامک می‌کنم تا بابت هر معرفی موفق، ۱۵٪ از کل مبلغ قرارداد (حدود ۴ میلیون و ۳۵۰ هزار تومان در هر معرفی!) نقداً به شبای شما واریز شود!»',
        trustImpactDelta: 35,
        consequenceAnimationLabel:
          'گارد صاحب گالری مبل ۱۰۰٪ باز شده، مشخصاتش را ثبت می‌کند و به سفیر پورسانت‌بگیر شما در بازار مبل تبدیل می‌شود!',
      },
    ],
    examQuestions: [
      {
        id: 'furn_q_1',
        contextFa:
          'صاحب گالری مبل می‌گوید: «مشتری‌های بازار مبل تا ۱۰ تا مغازه را نبینند خرید نمی‌کنند؛ این برنامه چطور باعث می‌شود به مغازه من برگردند؟»',
        questionFa: 'حرفه‌ای‌ترین پاسخ سفیر فروشیار چیست؟',
        options: [
          {
            id: 'a',
            textFa:
              '«وقتی ۹ گالری دیگر قیمت را روی کاغذ پاره می‌نویسند، اما شما در ۱۰ ثانیه پیش‌فاکتور طلاکوب با نام گالری خودتان، جزئیات کلاف راش گرجستان، متراژ پارچه ترک، گواهی ۵ سال ضمانت فوم سرد و جدول چک صیادی را به گوشی عروس و داماد می‌فرستید، بعد از گشتن بازار فقط به گالری معتبر شما برمی‌گردند!»',
            isCorrect: true,
            coachFeedbackFa:
              'فوق‌العاده! تمایز پیش‌فاکتور طلاکوب با ضمانت ۵ ساله کلاف راش و چک صیادی، دقیقاً کلید بازگشت عروس و داماد در بازار شلوغ مبل است.',
          },
          {
            id: 'b',
            textFa: '«در مغازه را قفل کنید تا بیرون نروند.»',
            isCorrect: false,
            coachFeedbackFa: 'پاسخ غیرحرفه‌ای و غیرعملی.',
          },
        ],
      },
      {
        id: 'furn_q_2',
        contextFa:
          'عروس و داماد در گالری مبل بین پارچه ایرانی و پارچه نانو/شانل ترک (روی ۳۲ متر پارچه مصرفی) مردد هستند و از اختلاف قیمت می‌ترسند.',
        questionFa: 'کدام قابلیت مبلیار (FurniMate VIP) این تردید را در ۱۰ ثانیه حل می‌کند؟',
        options: [
          {
            id: 'a',
            textFa:
              'اسلایدر محاسبه آنی متراژ و مابه‌التفاوت گرید پارچه که در ۱ ثانیه اختلاف قیمت را روی اقساط چک صیادی بنفش سرشکن می‌کند و در پیش‌فاکتور طلاکوب نمایش می‌دهد.',
            isCorrect: true,
            coachFeedbackFa:
              'احسنت! وقتی مابه‌التفاوت ۳۰ میلیون تومانی پارچه ترک روی ۶ فقره چک صیادی سرشکن شود (ماهی ۵ میلیون)، عروس و داماد با خیال راحت بهترین پارچه را انتخاب می‌کنند.',
          },
          {
            id: 'b',
            textFa: 'فرستادن مشتری به بازار پارچه برای خرید شخصی.',
            isCorrect: false,
            coachFeedbackFa: 'فرستادن مشتری به بیرون گالری مساوی با از دست رفتن کل معامله است.',
          },
        ],
      },
      {
        id: 'furn_q_3',
        contextFa:
          'اگر صاحب گالری مبل بگوید «فعلاً خودم نرم‌افزار نمی‌خواهم»، بهترین تکنیک برای اینکه دست خالی از مغازه بیرون نروید چیست؟',
        questionFa: 'کدام اقدام طبق تکنیک TVN-PARTNER صحیح است؟',
        options: [
          {
            id: 'a',
            textFa:
              'ثبت رایگان نام و آدرس گالری او در سیستم، ارسال پیامک کد معرف اختصاصی (TVN-PARTNER) و پیشنهاد واریز نقدی ۱۵٪ پورسانت (حدود ۴ میلیون و ۳۵۰ هزار تومان) به شبای او بابت هر گالری مبل، کابینت‌ساز یا تالارداری که معرفی کند.',
            isCorrect: true,
            coachFeedbackFa:
              'بی‌نظیر! با تکنیک TVN-PARTNER، حتی یک «نه» در بازار به یک کانال درآمدزایی و معرفی زنجیره‌ای تبدیل می‌شود.',
          },
          {
            id: 'b',
            textFa: 'قطع مکالمه و خروج فوری از گالری مبل.',
            isCorrect: false,
            coachFeedbackFa: 'خروج بدون فعال‌سازی کد معرف TVN-PARTNER یعنی از دست دادن شبکه ارتباطی ارزشمند صاحب گالری.',
          },
        ],
      },
    ],
    fieldEvaluationChecklist: [
      {
        id: 'furn_fe_1',
        criterionFa:
          'تنظیم ۱۰ ثانیه‌ای نام گالری مبل بیرون مغازه، اجرای اسلایدر ۳۲ متر پارچه ترک/نانو و صدور پیش‌فاکتور طلاکوب پکیج جهیزیه با گواهی ۵ سال ضمانت کلاف راش و چک صیادی',
        verificationMethodFa: 'ارزیابی عملی در نمایشگاه مبل و سرویس خواب',
      },
    ],
  },
};

export const GENERAL_ACADEMY_EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 'gen_q1',
    contextFa: 'شما وارد یک شوروم لوکس می‌شوید. مدیر فروشگاه سرش شلوغ است و می‌گوید: «فقط ۲ دقیقه وقت دارم، سریع بگو چی می‌فروشی و قیمتش چنده؟»',
    questionFa: 'بر اساس متدولوژی فروش مشاوره‌ای فروشیار، کدام واکنش بیشترین احتمال جلب توجه و باز کردن زمان جلسه را دارد؟',
    options: [
      {
        id: 'a',
        textFa: 'احترام به کمبود وقت ایشان، بیان یک جمله کوتاه درباره گلوگاه اصلی صنف ایشان (مثلاً مشتریان مرددی که بدون خرید از شوروم خارج می‌شوند) و پیشنهاد یک دموی ۳۰ ثانیه‌ای یا تنظیم وقت ۱۵ دقیقه‌ای در ساعت خلوت.',
        isCorrect: true,
        coachFeedbackFa: 'آفرین! هرگز در ۲ دقیقه اول تحت فشار مشتری وارد بحث قیمت خام نشوید؛ با احترام به زمان او، کنجکاوی مبتنی بر درد اصلی صنف را فعال کنید.',
      },
      {
        id: 'b',
        textFa: 'اعلام فوری لیست قیمت همه پکیج‌ها و پیشنهاد ۱۰ درصد تخفیف نقدی.',
        isCorrect: false,
        coachFeedbackFa: 'اعلام قیمت قبل از ایجاد ارزش، باعث می‌شود مشتری در ۵ ثانیه بگوید «گران است، ممنون» و مکالمه تمام شود.',
      },
      {
        id: 'c',
        textFa: 'اصرار بر اینکه باید حتماً الان ۲۰ دقیقه به حرف‌های من گوش بدهید.',
        isCorrect: false,
        coachFeedbackFa: 'نادیده گرفتن شرایط زمانی مشتری باعث ایجاد گارد منفی می‌شود.',
      },
    ],
  },
  {
    id: 'gen_q2',
    contextFa: 'در میانه جلسه، مشتری می‌گوید: «یک شرکت دیگر نرم‌افزاری شبیه همین را نصف قیمت شما به من پیشنهاد داده است.»',
    questionFa: 'حرفه‌ای‌ترین برخورد با این اعتراض قیمتی و مقایسه‌ای چیست؟',
    options: [
      {
        id: 'a',
        textFa: 'حفظ آرامش، پرهیز کامل از بدگویی درباره رقیب، و پرسیدن این سوال که: «بسیار عالی که گزینه‌ها را بررسی کرده‌اید؛ برای شما در کنار قیمت اولیه، کدام شاخص در ۶ ماه آینده تعیین‌کننده‌تر است: پایداری، دقت خروجی یا بازگشت سرمایه واقعی در فروش؟»',
        isCorrect: true,
        coachFeedbackFa: 'دقیقاً درست! سفیر حرفه‌ای هرگز رقیب را تخریب نمی‌کند، بلکه معیار تصمیم‌گیری را از «هزینه اولیه» به «هزینه کل و بازگشت سرمایه» تغییر می‌دهد.',
      },
      {
        id: 'b',
        textFa: 'بدگویی شدید از شرکت رقیب و گفتن اینکه آن‌ها کلاهبردار هستند.',
        isCorrect: false,
        coachFeedbackFa: 'بدگویی از رقبا اعتبار اخلاقی و حرفه‌ای سفیر را در ذهن مشتری کاهش می‌دهد.',
      },
      {
        id: 'c',
        textFa: 'نصف کردن فوری قیمت برای برنده شدن در معامله.',
        isCorrect: false,
        coachFeedbackFa: 'شکستن ناگهانی قیمت یعنی قیمت قبلی شما غیرواقعی بوده است و اعتماد را نابود می‌کند.',
      },
    ],
  },
  {
    id: 'gen_q3',
    contextFa: 'طبق قوانین قفل‌شده Domain Core v4.0 در آکادمی فروشیار، چه زمانی یک سفیر مجاز به فروش میدانی یک محصول خاص (مثلاً DecorMate) است؟',
    questionFa: 'کدام گزینه شرط کامل مجوز فروش میدانی (authorizeFieldSales) را بیان می‌کند؟',
    options: [
      {
        id: 'a',
        textFa: 'دارا بودن گواهینامه عمومی معتبر با سطح A / A+ / A++، عدم قرارگیری در وضعیت بازآموزی (REASSESSMENT)، و داشتن گواهینامه مستقل CERTIFIED برای همان محصول (شامل تکمیل آموزش، نمره آزمون >= ۷۵، قبولی شبیه‌سازی و قبولی ارزیابی میدانی).',
        isCorrect: true,
        coachFeedbackFa: 'کاملاً منطبق بر Domain Core v4.0! هیچ گامی قابل دور زدن نیست و هر محصول چرخه مستقل دارد.',
      },
      {
        id: 'b',
        textFa: 'داشتن ۵۰۰۰ امتیاز XP و مدال طلایی در پروفایل کاربری کافی است.',
        isCorrect: false,
        coachFeedbackFa: 'در Domain Core v4.0، امتیاز XP یا Badge هرگز جایگزین گواهینامه واقعی نمی‌شود.',
      },
      {
        id: 'c',
        textFa: 'قبولی در آزمون عمومی به تنهایی اجازه فروش تمام ۷ محصول را می‌دهد.',
        isCorrect: false,
        coachFeedbackFa: 'گواهینامه عمومی به تنهایی مجوز فروش هیچ محصولی را نمی‌دهد؛ هر محصول نیازمند گواهینامه تخصصی مستقل است.',
      },
    ],
  },
  {
    id: 'gen_q4',
    contextFa: 'در حلقه یادگیری فروشیار (Observe → Listen → Choose → Speak)، چرا مرحله Observe و Listen پیش از صحبت کردن قرار گرفته است؟',
    questionFa: 'هدف اصلی این ترتیب در مذاکره واقعی چیست؟',
    options: [
      {
        id: 'a',
        textFa: 'زیرا تشخیص فضای کسب‌وکار، لحن مشتری و دغدغه پنهان او (Subtext) قبل از ارائه، تنها راه جلوگیری از نسخهپیچی کورکورانه است.',
        isCorrect: true,
        coachFeedbackFa: 'احسنت! فروشنده آماتور بلافاصله شروع به صحبت می‌کند؛ سفیر فروشیار ابتدا مشاهده و شنیدن فعال را انجام می‌دهد.',
      },
      {
        id: 'b',
        textFa: 'صرفاً برای طولانی‌تر شدن زمان جلسه.',
        isCorrect: false,
        coachFeedbackFa: 'هدف کیفیت درک نیاز مشتری است، نه اتلاف وقت.',
      },
    ],
  },
  {
    id: 'gen_q5',
    contextFa: 'اگر سفیری در آزمون جامع عمومی نمره ۶۵ کسب کند، وضعیت او در سیستم چگونه تعیین می‌شود؟',
    questionFa: 'طبق قوانین Domain Core v4.0 کدام مورد رخ می‌دهد؟',
    options: [
      {
        id: 'a',
        textFa: 'در سطح B قرار می‌گیرد، مجاز به فروش میدانی نیست و وارد چرخه بازآموزی و ارزیابی مجدد (REASSESSMENT) می‌شود.',
        isCorrect: true,
        coachFeedbackFa: 'دقیقاً صحیح. سطوح B (۵۰ تا ۶۹) و C (زیر ۵۰) مجاز به فروش میدانی نیستند و باید مهارت خود را در چرخه بازآموزی ارتقا دهند.',
      },
      {
        id: 'b',
        textFa: 'مجاز به فروش میدانی با کمیسیون کمتر می‌شود.',
        isCorrect: false,
        coachFeedbackFa: 'کیفیت نمایندگی برند آفرینش خط قرمز است؛ سطح B تا زمان ارتقا به حداقل سطح A اجازه فروش میدانی ندارد.',
      },
    ],
  },
  {
    id: 'gen_q6',
    contextFa:
      'شما وارد یک باغ‌تالار یا گالری مبل می‌شوید و پس از پرزنت، مالک می‌گوید: «من فعلاً این برنامه را نمی‌خواهم!»',
    questionFa:
      'طبق اصل «ادب بازاری و پیشنهاد محترمانه شراکت ۲۰٪/۱۵٪»، کدام دیالوگ هم احترام مشتری را ۱۰۰٪ حفظ می‌کند و هم انگیزه ثبت کد معرف (TVN-PARTNER) را در او ایجاد می‌کند؟',
    options: [
      {
        id: 'a',
        textFa:
          '«فدای سرتان که فعلاً نیاز ندارید! من می‌خواهم پیشنهاد شراکت بدهم: من ۳۵٪ پورسانت می‌گیرم؛ ۲۰٪ من برمی‌دارم و ۱۵٪ شما! اگر کسانی که از طرف شما معرفی می‌شوند خرید کنند، ۱۵٪ حق فروش (۴.۳۵ میلیون تومان) بدون هیچ کاری نصیب شما می‌شود. البته من بعد از این به همکاران شما هم سر می‌زنم؛ اگر کد معرف را بپذیرید از خرید آن‌ها سود می‌کنید، و اگر نپذیرید و آن‌ها بپذیرند، آن‌ها سود می‌کنند و سودی نصیب شما نمی‌شود.»',
        isCorrect: true,
        coachFeedbackFa:
          'احسنت! بدون استفاده از کلمات منفی مثل «جا می‌مانید» یا «ضرر می‌کنید» (که بی‌احترامی محسوب می‌شود)، با کمال ادب منفعت ۱۵ درصدی را پیش چشم او گذاشتید.',
      },
      {
        id: 'b',
        textFa:
          'گفتن جملات منفی مثل «اگر نخرید از رقبایتان جا می‌مانید و ضرر می‌کنید!»',
        isCorrect: false,
        coachFeedbackFa:
          'خط قرمز ادب بازاری! به کار بردن کلمات «جا می‌مانید» و «ضرر می‌کنید» بی‌احترامی به شخصیت کاسب است و گارد منفی ایجاد می‌کند؛ همیشه روی «نصیب شدن سود به ایشان» تاکید کنید.',
      },
    ],
  },
];

export const SIMULATION_SCENARIOS: SalesScenario[] = [
  {
    id: 'scen_general_core',
    productId: 'GENERAL',
    titleFa: 'سناریوی جامع: عبور از گارد اولیه و کشف نیاز پنهان مدیر شوروم',
    clientNameFa: 'مهندس کاظمی',
    clientRoleFa: 'مدیرعامل کلینیک ساختمانی و شوروم متریال لوکس',
    locationFa: 'شهرک غرب — شوروم مرکزی',
    difficultyFa: 'متوسط',
    imageUrl: HERO_IMAGE_PATH,
    missionBriefFa:
      'در این سناریوی جامع، مهندس کاظمی به دلیل مراجعات ناموفق بازاریاب‌های تبلیغاتی گارد بسته‌ای دارد. ماموریت شما: مشاهده نشانه‌های محیطی، شنیدن دغدغه پنهان، پرهیز از تله تخفیف و رساندن اعتماد مشتری به بالای ۷۵٪.',
    passingTrustThreshold: 75,
    steps: [
      {
        stepNumber: 1,
        stageLabelFa: 'گام ۱: مشاهده و گشایش (Observe → Listen → Choose/Speak)',
        clientQuoteFa:
          '«ببخشید، امروز سه نفر دیگر هم برای معرفی سیستم‌های تبلیغاتی و نرم‌افزار آمده‌اند. فروش ما به لطف خدا خوب است و نیازی به ابزار جدید نداریم.»',
        clientSubtextFa:
          'مشاهده محیطی: دو زوج در گوشه شوروم ایستاده‌اند و بعد از ۲۰ دقیقه ورق زدن آلبوم سرامیک، با تردید در حال خروج از فروشگاه بدون خرید هستند.',
        clientToneFa: 'محتاط، کمی خسته از فروشندگان کلیشه‌ای، اما نگران مشتریان خروجی',
        initialTrust: 45,
        initialResistance: 70,
        options: [
          {
            id: 'step1_opt_optimal',
            labelFa: 'پیوند زدن مشاهده محیطی به دغدغه نرخ تبدیل (مشاوره‌ای)',
            spokenScriptFa:
              '«مهندس جان، کاملاً حق دارید؛ شوروم شما بسیار خوش‌نام است. فقط یک سوال کوتاه: آن زوج محترمی که الان بعد از دیدن سمپل‌ها با تردید خارج شدند، اگر همین لحظه می‌توانستند همان اسلب را در فضای پذیرایی خانه خودشان روی تبلت ببینند، چقدر احتمال داشت همین امروز پیش‌فاکتور بگیرند؟»',
            tacticType: 'CONSULTATIVE_MASTER',
            isOptimal: true,
            trustDelta: 25,
            resistanceDelta: -30,
            clientReactionFa:
              'مهندس کاظمی مکثی می‌کند، به در خروجی نگاه می‌کند و می‌گوید: «راستش دقیقاً دست روی نقطه حساسی گذاشتید؛ خیلی از مشتری‌ها بین دو طرح دودل می‌مانند و می‌روند...»',
            consequenceVisualFa:
              'اثر مستقیم مشاهده هوشمندانه: مقاومت اولیه از ۷۰٪ به ۴۰٪ سقوط کرد و اعتماد به ۷۰٪ رسید.',
            coachFeedbackFa:
              'درخشان بود! شما از مرحله Observe استفاده کردید؛ به جای دفاع از خودتان، صحنه‌ای که جلوی چشم خود مدیر در حال رخ دادن بود را به ارزش تبدیل کردید.',
          },
          {
            id: 'step1_opt_pitch',
            labelFa: 'شروع فوری معرفی فنی ویژگی‌های هوش مصنوعی',
            spokenScriptFa:
              '«مهندس ما تبلیغاتی نیستیم! نرم‌افزار ما با الگوریتم پردازش تصویر ابری کار می‌کند و ۲۰ ماژول مختلف دارد که باید حتماً ببینید.»',
            tacticType: 'PREMATURE_PITCH',
            isOptimal: false,
            trustDelta: -15,
            resistanceDelta: 20,
            clientReactionFa:
              'مهندس کاظمی ساعتش را نگاه می‌کند: «کاتالوگتان را روی میز منشی بگذارید، اگر وقت شد نگاه می‌کنم.»',
            consequenceVisualFa:
              'هشدار پیامد: صحبت فنی بدون کشف نیاز، شما را در ذهن مشتری هم‌ردیف همان ۳ بازاریاب قبلی قرار داد (اعتماد به ۳۰٪ کاهش یافت).',
            coachFeedbackFa:
              'وقتی مشتری گارد دارد، واژه‌های فنی مثل «الگوریتم ابری» مقاومت او را بیشتر می‌کند. بیایید یک گام به عقب برگردیم و به زوجی که از شوروم خارج شدند دقت کنیم.',
          },
          {
            id: 'step1_opt_discount',
            labelFa: 'پیشنهاد تخفیف ویژه برای شکستن مقاومت',
            spokenScriptFa:
              '«اگر همین امروز ثبت‌نام کنید ۳۰ درصد تخفیف جشنواره به شما می‌دهم تا ضرر نکنید.»',
            tacticType: 'DISCOUNT_TRAP',
            isOptimal: false,
            trustDelta: -25,
            resistanceDelta: 25,
            clientReactionFa:
              'مهندس کاظمی با جدیت می‌گوید: «مسئله من پول یا تخفیف نیست، وقتش را ندارم. روز بخیر.»',
            consequenceVisualFa:
              'سقوط شدید اعتبار: پیشنهاد تخفیف در دقیقه اول، ارزش برند شما را در نگاه یک مدیر B2B از بین برد.',
            coachFeedbackFa:
              'تله تخفیف زودهنگام! برای مدیر یک شوروم لوکس، زمان و اعتبار مهم‌تر از ۳۰٪ تخفیف روی ابزاری است که هنوز فایده‌اش را نمی‌داند. دوباره تلاش کنید.',
          },
        ],
        speechEvaluationRubric: {
          requiredKeywordsFa: ['مشتری', 'تردید', 'تصور', 'شوروم', 'تصمیم', 'خانه', 'تجسم'],
          forbiddenTrapWordsFa: ['تخفیف', 'ارزان', 'مفت', 'الگوریتم'],
          idealHintFa: 'به مشتریان مرددی که از شوروم خارج می‌شوند اشاره کنید و بپرسید اگر طرح را در فضای خانه خودشان می‌دیدند چه تغییری در تصمیمشان ایجاد می‌شد.',
        },
      },
      {
        stepNumber: 2,
        stageLabelFa: 'گام ۲: مدیریت اعتراض اجرایی و تثبیت ارزش (Listen → Speak/Choose)',
        clientQuoteFa:
          '«ایده جالبی است، اما راستش فروشنده‌های من وقت ندارند برای هر مشتری نیم ساعت پای کامپیوتر بنشینند و طراحی سهبعدی انجام بدهند!»',
        clientSubtextFa:
          'نگرانی واقعی مهندس کاظمی از پیچیدگی نرم‌افزارهای سنتی معماری (مثل 3ds Max) است که نیاز به اپراتور متخصص دارند.',
        clientToneFa: 'کنجکاو اما نگران پیچیدگی عملیاتی برای تیم فروش',
        initialTrust: 70,
        initialResistance: 40,
        options: [
          {
            id: 'step2_opt_optimal',
            labelFa: 'دموی تجربه‌محور ۱۵ ثانیه‌ای با مشارکت خود مشتری',
            spokenScriptFa:
              '«اگر قرار بود نیم ساعت طول بکشد، خودم هم پیشنهاد نمی‌کردم! اجازه بدهید همین الان با دوربین تبلت یک عکس از کف همین دفتر بگیریم؛ لطفاً خودتان یکی از این سرامیک‌ها را لمس کنید تا ببینید در ۵ ثانیه چه اتفاقی می‌افتد.»',
            tacticType: 'CONSULTATIVE_MASTER',
            isOptimal: true,
            trustDelta: 22,
            resistanceDelta: -25,
            clientReactionFa:
              'مهندس کاظمی خودش روی صفحه تبلت می‌زند و با دیدن تغییر آنی کف دفتر با لبخند می‌گوید: «عجب! واقعاً ۵ ثانیه شد و نور و سایه دفتر هم حفظ شد! این را هر فروشنده‌ای می‌تواند انجام دهد.»',
            consequenceVisualFa:
              'جهش اعتماد به ۹۲٪: تجربه لمسی مستقیم، فرض ذهنی «پیچیدگی ۳۰ دقیقه‌ای» را در ۵ ثانیه نابود کرد.',
            coachFeedbackFa:
              'استادانه بود! در فلسفه Practice-First، به جای بحث کلامی درباره سرعت، تبلت را به دست مشتری دادید تا خودش سادگی را تجربه کند.',
          },
          {
            id: 'step2_opt_argue',
            labelFa: 'مجادله کلامی درباره توانایی فروشندگان شوروم',
            spokenScriptFa:
              '«فروشنده‌های شما اگر کمی آموزش ببینند کار سختی نیست، بالاخره هر نرم‌افزاری اوایلش سخت است.»',
            tacticType: 'DEFENSIVE_ARGUE',
            isOptimal: false,
            trustDelta: -15,
            resistanceDelta: 20,
            clientReactionFa:
              '«نه، ما دنبال کاری که اوایلش سخت باشد و وقت شوروم را بگیرد نیستیم.»',
            consequenceVisualFa:
              'تایید ناخواسته ترس مشتری: عبارت «هر نرم‌افزاری اوایلش سخت است» ترس مدیر از اختلال در شوروم را تشدید کرد.',
            coachFeedbackFa:
              'هرگز پیچیدگی را تایید نکنید! نقطه قوت محصولات اکوسیستم آفرینش، سادگی چندثانیه‌ای بدون نیاز به دانش طراحی است. دوباره تلاش کنید.',
          },
        ],
        speechEvaluationRubric: {
          requiredKeywordsFa: ['ثانیه', 'الان', 'عکس', 'تبلت', 'خودتان', 'ساده', 'لمس'],
          forbiddenTrapWordsFa: ['سخت', 'طولانی', 'کلاس'],
          idealHintFa: 'پیشنهاد دهید همین الان در چند ثانیه از کف دفتر عکس بگیرید و خود مشتری با یک لمس تغییر متریال را ببیند.',
        },
      },
    ],
  },
  {
    id: 'scen_decormate_pro',
    productId: 'DECORMATE',
    titleFa: 'سناریوی تخصصی DecorMate: بستن قرارداد وب‌سایت + لایسنس با کلینیک ساختمانی',
    clientNameFa: 'خانم دکتر رستگار',
    clientRoleFa: 'موسس گالری معماری و کلینیک کاشی و پارکت رستگار',
    locationFa: 'فرمانیه — گالری رستگار',
    difficultyFa: 'پیشرفته',
    imageUrl: SHOWROOM_SCENARIO_PATH,
    missionBriefFa:
      'خانم دکتر رستگار دموی اولیه DecorMate را دیده و پسندیده است، اما می‌خواهد بداند چطور هزینه‌ای که می‌کند به سرعت از محل فروش برمی‌گردد و آیا برای پیج اینستاگرامش هم کاربرد دارد یا خیر.',
    passingTrustThreshold: 78,
    steps: [
      {
        stepNumber: 1,
        stageLabelFa: 'گام ۱: محاسبه بازگشت سرمایه (ROI) ملموس',
        clientQuoteFa:
          '«ابزار زیبایی است، اما هزینه راه‌اندازی وب‌سایت و لایسنس را چطور می‌توانم در بودجه امسال توجیه کنم؟»',
        clientSubtextFa:
          'او به دنبال یک استدلال منطقی و عددی بر اساس میانگین سود هر فاکتور شوروم خودش است تا با خیالی آسوده قرارداد را امضا کند.',
        clientToneFa: 'تحلیلی، دقیق و نتیجه‌گرا',
        initialTrust: 60,
        initialResistance: 50,
        options: [
          {
            id: 'dm_s1_optimal',
            labelFa: 'معادله بازگشت سرمایه با تعداد فاکتورهای نجات‌یافته',
            spokenScriptFa:
              '«سوال بسیار دقیقی است خانم دکتر. میانگین سود خالص یک فاکتور کامل سرامیک و پارکت در گالری شما حدوداً چقدر است؟ معمولاً در گالری‌های هم‌تراز شما، فقط جلوگیری از خروج ۲ مشتری مردد در ماه، کل سرمایه‌گذاری یک‌ساله DecorMate را در کمتر از ۴۵ روز برمی‌گرداند.»',
            tacticType: 'CONSULTATIVE_MASTER',
            isOptimal: true,
            trustDelta: 25,
            resistanceDelta: -30,
            clientReactionFa:
              '«درست می‌گویید، سود یک پروژه بازسازی کامل در گالری ما گاهی به تنهایی معادل کل این مبلغ است. اگر حتی ماهی ۲ پروژه مردد را قطعی کند، کاملاً به‌صرفه است.»',
            consequenceVisualFa:
              'تبدیل «هزینه نرم‌افزار» به «سرمایه‌گذاری با بازگشت ۴۵ روزه»: اعتماد به ۸۵٪ رسید.',
            coachFeedbackFa:
              'فروش B2B حرفه‌ای یعنی مقایسه قیمت محصول با سود تنها ۱ یا ۲ معامله نجات‌یافته مشتری!',
          },
          {
            id: 'dm_s1_wrong',
            labelFa: 'پیشنهاد حذف بخش وب‌سایت برای ارزان‌تر شدن فاکتور',
            spokenScriptFa:
              '«خب اگر برایتان گران است، قید وب‌سایت را بزنید و فقط نسخه پایه را بخرید.»',
            tacticType: 'DISCOUNT_TRAP',
            isOptimal: false,
            trustDelta: -18,
            resistanceDelta: 15,
            clientReactionFa:
              '«من نگفتم توان پرداخت ندارم! پرسیدم توجیه اقتصادی و بازگشت سرمایه‌اش چطور محاسبه می‌شود.»',
            consequenceVisualFa:
              'خطای تشخیص اعتراض: مشتری سوال تحلیلی درباره ROI پرسید اما شما آن را به «نداشتن بودجه» تعبیر کردید.',
            coachFeedbackFa:
              'وقتی یک مدیر تحلیلی درباره «توجیه بودجه» می‌پرسد، به دنبال فرمول بازگشت سرمایه (ROI) است، نه کوچک کردن پکیج! دوباره تلاش کنید.',
          },
        ],
        speechEvaluationRubric: {
          requiredKeywordsFa: ['فاکتور', 'برگشت', 'سرمایه', 'پروژه', 'سود', 'مشتری'],
          forbiddenTrapWordsFa: ['گران', 'ندارید'],
          idealHintFa: 'هزینه سالانه سامانه را با سود تنها ۱ یا ۲ فاکتور فروش سرامیک و پارکت که از تردید نجات پیدا می‌کنند مقایسه کنید.',
        },
      },
    ],
  },
  {
    id: 'scen_salonmate_pro',
    productId: 'SALONMATE',
    titleFa: 'سناریوی تخصصی SalonMate: حذف کنسلی نوبت‌ها و شفافیت مالی لاین‌ها',
    clientNameFa: 'خانم ملکی',
    clientRoleFa: 'مدیر مجموعه زیبایی و اسپای رویال',
    locationFa: 'سعادت‌آباد — مجموعه زیبایی رویال',
    difficultyFa: 'متوسط',
    imageUrl: SALON_SCENARIO_PATH,
    missionBriefFa:
      'خانم ملکی از درگیری‌های پایان ماه بر سر محاسبه پورسانت ۱۸ پرسنل و نوبت‌های کنسل‌شده آخر هفته خسته است اما نگران است کار با سیستم برای منشی وقت‌گیر باشد.',
    passingTrustThreshold: 75,
    steps: [
      {
        stepNumber: 1,
        stageLabelFa: 'گام ۱: لمس دغدغه کنسلی و تسویه حساب لاین‌ها',
        clientQuoteFa:
          '«پنجشنبه‌ها که سالن شلوغ است، منشی من حتی فرصت سر خاراندن ندارد؛ چطور می‌خواهید یک نرم‌افزار جدید هم به کارهایش اضافه کنید؟»',
        clientSubtextFa:
          'منشی فعلاً نوبتها را دستی می‌نویسد و آخر شب ۲ ساعت وقت صرف جمع زدن فیش‌ها می‌کند.',
        clientToneFa: 'پرانرژی اما تحت فشار کاری روزهای پیک',
        initialTrust: 55,
        initialResistance: 60,
        options: [
          {
            id: 'sal_s1_optimal',
            labelFa: 'نشان دادن کاهش بار تلفنی منشی و حذف ۲ ساعت حساب‌وکتاب شبانه',
            spokenScriptFa:
              '«دقیقاً به خاطر همین شلوغی پنجشنبه‌هاست که SalonMate بار منشی شما را کم می‌کند! وقتی یادآوری نوبت و بیعانه آنلاین خودکار شود و پورسانت هر ۱۸ نفر در لحظه صدور فیش بدون ماشین‌حساب تفکیک شود، منشی شما پنجشنبه شب ۲ ساعت زودتر و با آرامش کارش تمام می‌شود.»',
            tacticType: 'CONSULTATIVE_MASTER',
            isOptimal: true,
            trustDelta: 28,
            resistanceDelta: -35,
            clientReactionFa:
              'چهره خانم ملکی باز می‌شود: «واقعاً آخر هر ماه سر حساب کردن درصد لاین رنگ و ناخن و کسر مواد مصرفی تا ساعت ۱۱ شب درگیرم! اگر این خودکار شود عالی است.»',
            consequenceVisualFa:
              'تغییر زاویه دید از «کار اضافه» به «آزاد شدن ۲ ساعت زمان روزانه»: اعتماد به ۸۳٪ رسید.',
            coachFeedbackFa:
              'فوق‌العاده! شما نشان دادید که SalonMate کار اضافه نیست، بلکه جایگزین کلافگی آخر شب مدیر و منشی است.',
          },
          {
            id: 'sal_s1_wrong',
            labelFa: 'پیشنهاد استخدام یک منشی دوم برای کار با نرم‌افزار',
            spokenScriptFa:
              '«می‌توانید یک اپراتور دیگر هم استخدام کنید که فقط پای سیستم بنشیند.»',
            tacticType: 'PREMATURE_PITCH',
            isOptimal: false,
            trustDelta: -20,
            resistanceDelta: 25,
            clientReactionFa:
              '«من می‌خواهم هزینه‌هایم مدیریت شود، نه اینکه ماهانه حقوق یک نفر دیگر را هم اضافه کنم!»',
            consequenceVisualFa:
              'تحمیل هزینه پرسنلی جدید به مشتری باعث افت اعتماد به ۳۵٪ شد.',
            coachFeedbackFa:
              'نرم‌افزار خوب باید بهره‌وری تیم فعلی را بالا ببرد، نه اینکه هزینه استخدام جدید تحمیل کند. دوباره تلاش کنید.',
          },
        ],
        speechEvaluationRubric: {
          requiredKeywordsFa: ['خودکار', 'پورسانت', 'یادآوری', 'ساعت', 'آرامش', 'لاین'],
          forbiddenTrapWordsFa: ['استخدام', 'سخت'],
          idealHintFa: 'توضیح دهید که یادآوری خودکار و محاسبه آنی پورسانت لاین‌ها، ۲ ساعت حساب‌وکتاب آخر شب را حذف می‌کند.',
        },
      },
    ],
  },
  {
    id: 'scen_furnimate_pro',
    productId: 'FURNIMATE',
    titleFa: 'سناریوی تخصصی FurniMate VIP: قفل کردن پکیج جهیزیه عروس در بازار مبل',
    clientNameFa: 'حاج‌آقا رحیمی',
    clientRoleFa: 'مالک گالری بزرگ مبل و سرویس خواب امپراتور',
    locationFa: 'بازار مبل یافت‌آباد — گالری امپراتور',
    difficultyFa: 'پیشرفته',
    imageUrl: SHOWROOM_SCENARIO_PATH,
    missionBriefFa:
      'حاج‌آقا رحیمی گلایه دارد که ۹۰٪ عروس و دامادها بعد از نیم ساعت قیمت گرفتن می‌گویند «یک دور دیگر در بازار مبل بزنیم برمی‌گردیم» و دیگر پیدایشان نمی‌شود. ماموریت شما: اجرای دموی ۱۰ ثانیه‌ای پکیج جهیزیه + محاسبه ۳۲ متر پارچه ترک و گواهی ۵ سال ضمانت کلاف راش.',
    passingTrustThreshold: 75,
    steps: [
      {
        stepNumber: 1,
        stageLabelFa: 'گام ۱: هدف گرفتن درد «یک دور در بازار مبل بزنیم برمی‌گردیم»',
        clientQuoteFa:
          '«جمعه به جمعه ۲۰۰ تا عروس و داماد میان تو گالری، قیمت مبل و ناهارخوری رو روی کاغذ می‌گیرن و میگن یه دور دیگه تو بازار بزنیم برمی‌گردیم؛ ولی از هر ۱۰ تا ۹ تاشون دیگه برنمی‌گردن!»',
        clientSubtextFa:
          'پس از دیدن ۱۰ مغازه مبل، همه قیمت‌های کاغذی در ذهن عروس و داماد قاطی می‌شود و هیچ سندی از کیفیت چوب راش و فوم سرد گالری رحیمی در گوشی‌شان ندارند.',
        clientToneFa: 'خسته از بازدیدکنندگان عبوری، به دنبال راهکار عملی برای قفل کردن مشتری',
        initialTrust: 55,
        initialResistance: 55,
        options: [
          {
            id: 'furn_s1_optimal',
            labelFa: 'دموی پیش‌فاکتور طلاکوب جهیزیه + ۳۲ متر پارچه ترک + ضمانت ۵ ساله کلاف راش',
            spokenScriptFa:
              '«دقیقاً درد اصلی بازار مبل همینه حاج‌آقا! چون وقتی عروس و داماد ۱۰ مغازه رو می‌بینن، کاغذهای بی‌نام‌ونشون یادشون میره. اما ببینید روی تبلت با نام گالری امپراتور خودتون چه اتفاقی میفته: در ۱۰ ثانیه پکیج کامل جهیزیه (مبل ۸ نفره + ناهارخوری + سرویس خواب)، مابه‌التفاوت دقیق ۳۲ متر پارچه شانل ترک، گواهی ۵ سال ضمانت کلاف راش گرجستان و جدول چک صیادی بنفش رو به واتساپ و پیامک عروس و داماد شلیک می‌کنید تا از مغازه چهارم مستقیم پیش خودتون برگردن!»',
            tacticType: 'CONSULTATIVE_MASTER',
            isOptimal: true,
            trustDelta: 32,
            resistanceDelta: -35,
            clientReactionFa:
              'چشمان حاج‌آقا رحیمی برق می‌زند: «باریکلا! وقتی عروس و داماد پیش‌فاکتور طلاکوب با گواهی ۵ سال ضمانت چوب راش و جدول چک صیادی رو با اسم گالری من تو گوشیشون داشته باشن، معلومه که برمی‌گردن!»',
            consequenceVisualFa:
              'جهش اعتماد به ۸۷٪: تبدیل بازدیدکننده عبوری جمعه بازار مبل به خریدار قطعی جهیزیه.',
            coachFeedbackFa:
              'شاهکار بود! شما دقیقاً زخم روزمره بازار مبل یافت‌آباد و ملایر را به ارزش بی‌رقیب FurniMate تبدیل کردید.',
          },
          {
            id: 'furn_s1_wrong',
            labelFa: 'پیشنهاد ارزان‌تر فروختن مبل نسبت به مغازه‌های کناری',
            spokenScriptFa:
              '«خب حاج‌آقا قیمت مبلهاتون رو ۲۰ میلیون ارزون‌تر بدید تا مشتری نره.»',
            tacticType: 'DISCOUNT_TRAP',
            isOptimal: false,
            trustDelta: -22,
            resistanceDelta: 25,
            clientReactionFa:
              '«من چوب راش گرجستان و فوم سرد کار می‌کنم، مبل بازاری نیست که حراج کنم!»',
            consequenceVisualFa:
              'سقوط اعتماد به ۳۳٪: زیر سوال بردن اصالت کلاف و متریال گالری‌دار.',
            coachFeedbackFa:
              'هرگز به تولیدکننده مبل اصیل نگویید قیمتش را بشکند؛ مشکل او «فراموش شدن جزئیات کیفیت در شلوغی بازار» است نه قیمت.',
          },
        ],
        speechEvaluationRubric: {
          requiredKeywordsFa: ['جهیزیه', 'طلاکوب', 'پارچه', 'راش', 'ضمانت', 'چک صیادی'],
          forbiddenTrapWordsFa: ['ارزان', 'حراج'],
          idealHintFa: 'توضیح دهید که ارسال پیش‌فاکتور طلاکوب جهیزیه با جزئیات ۳۲ متر پارچه ترک، ۵ سال ضمانت کلاف راش و جدول چک صیادی باعث بازگشت عروس و داماد از بازار مبل می‌شود.',
        },
      },
    ],
  },
];

export const FURNIMATE_TRAINING_PACK = {
  catalogItem: ECOSYSTEM_PRODUCTS.FURNIMATE,
};

