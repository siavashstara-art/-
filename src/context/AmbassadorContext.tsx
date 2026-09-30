import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  ALL_PRODUCT_IDS,
  AmbassadorDomainProfile,
  CommissionPolicy,
  DEFAULT_COMMISSION_POLICY,
  ProductCertificationRecord,
  ProductId,
  computeProductLifecycleStatus,
  createInitialProductCertifications,
  evaluateGeneralCertification,
} from '../domain/core';

interface VerifiedServerSession {
  verified: boolean;
  identity?: {
    uid: string;
    email: string;
    emailVerified: boolean;
    tenantId: string;
    issuer: string;
    audience: string;
  };
  securityNoteFa?: string;
}

export interface XpActivityLogItem {
  id: string;
  reasonFa: string;
  delta: number;
  timestamp: string;
}

export interface AmbassadorRegistrationInfo {
  mobilePhone: string;
  email: string;
  referralCode: string;
  referredByCode: string;
  isRegisteredWithContact: boolean;
  xpHistory: XpActivityLogItem[];
}

interface AmbassadorContextValue {
  firebaseUser: User | null;
  authReady: boolean;
  isSigningIn: boolean;
  authError: string | null;
  verifiedServerSession: VerifiedServerSession | null;
  profile: AmbassadorDomainProfile;
  registrationInfo: AmbassadorRegistrationInfo;
  commissionPolicy: CommissionPolicy;
  updateCommissionPolicy: (policy: CommissionPolicy) => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  registerWithMobileAndEmail: (params: {
    displayName: string;
    mobilePhone: string;
    email: string;
    referredByCode?: string;
  }) => Promise<{ referralCode: string; awardedXp: number }>;
  completeGeneralTrainingStep: (progressDelta: number) => Promise<void>;
  submitGeneralExamResult: (examScore: number) => Promise<void>;
  markGeneralSimulationPassed: (trustScore: number, mistakesCount: number) => Promise<void>;
  startProductTrack: (productId: ProductId) => Promise<void>;
  completeProductTraining: (productId: ProductId) => Promise<void>;
  submitProductExam: (productId: ProductId, score: number) => Promise<void>;
  markProductSimulationOutcome: (
    productId: ProductId,
    passed: boolean,
    trustScore: number,
    mistakesCount: number
  ) => Promise<void>;
  completeProductFieldEvaluation: (productId: ProductId, passed: boolean) => Promise<void>;
  adjustAmbassadorXp: (xpDelta: number, reasonFa?: string) => Promise<void>;
  applyPresetProfileScenario: (
    preset: 'BRIEF_MULTI_PRODUCT_EXAMPLE' | 'TIER_A_PLUS_PLUS' | 'REASSESSMENT_TIER_B' | 'FRESH_START'
  ) => Promise<void>;
}

const AmbassadorContext = createContext<AmbassadorContextValue | null>(null);

function deriveTenantIdFromEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return 'ablecity_default';
  const domain = email
    .split('@')[1]
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  return `ablecity_${domain || 'default'}`;
}

function buildInitialSandboxProfile(): AmbassadorDomainProfile {
  const now = new Date().toISOString();
  const uid = 'sandbox_visitor';
  const tenantId = 'ablecity_sandbox';
  const baseCerts = createInitialProductCertifications(uid, tenantId);

  // Initialize with the exact Multi-Product example from Section 2 of the Brief:
  // DecorMate = CERTIFIED, SalonMate = CERTIFIED, EventMate = TRAINING, TalaYar = NOT_STARTED
  baseCerts.DECORMATE = {
    ambassadorId: uid,
    tenantId,
    productId: 'DECORMATE',
    status: 'CERTIFIED',
    trainingCompleted: true,
    trainingProgress: 100,
    examScore: 92,
    simulationPassed: true,
    fieldEvaluationPassed: true,
    updatedAt: now,
  };

  baseCerts.SALONMATE = {
    ambassadorId: uid,
    tenantId,
    productId: 'SALONMATE',
    status: 'CERTIFIED',
    trainingCompleted: true,
    trainingProgress: 100,
    examScore: 85,
    simulationPassed: true,
    fieldEvaluationPassed: true,
    updatedAt: now,
  };

  baseCerts.EVENTMATE = {
    ambassadorId: uid,
    tenantId,
    productId: 'EVENTMATE',
    status: 'TRAINING',
    trainingCompleted: false,
    trainingProgress: 60,
    examScore: 0,
    simulationPassed: false,
    fieldEvaluationPassed: false,
    updatedAt: now,
  };

  baseCerts.SLABMATE = {
    ambassadorId: uid,
    tenantId,
    productId: 'SLABMATE',
    status: 'FIELD_EVALUATION',
    trainingCompleted: true,
    trainingProgress: 100,
    examScore: 82,
    simulationPassed: true,
    fieldEvaluationPassed: false,
    updatedAt: now,
  };

  return {
    uid,
    tenantId,
    displayName: 'سفیر فروش آفرینش (محیط تمرین)',
    email: 'ambassador@ablecity.ir',
    academyStage: 'CERTIFIED',
    tier: 'A+',
    generalTrainingScore: 100,
    generalExamScore: 89,
    generalSimulationPassed: true,
    generalCertified: true,
    reassessmentRequired: false,
    xp: 420,
    completedScenariosCount: 3,
    productCertifications: baseCerts,
    createdAt: now,
    updatedAt: now,
  };
}

export const AmbassadorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifiedServerSession, setVerifiedServerSession] = useState<VerifiedServerSession | null>(
    null
  );
  const [profile, setProfile] = useState<AmbassadorDomainProfile>(() => {
    try {
      const saved = localStorage.getItem('foroshyar_offline_profile_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.productCertifications && parsed.productCertifications.DECORMATE) {
          const baseCerts = createInitialProductCertifications(
            parsed.uid || 'sandbox_visitor',
            parsed.tenantId || 'ablecity_sandbox'
          );
          return {
            ...parsed,
            productCertifications: {
              ...baseCerts,
              ...parsed.productCertifications,
            },
          } as AmbassadorDomainProfile;
        }
      }
    } catch {
      // Fallback to default sandbox profile
    }
    return buildInitialSandboxProfile();
  });
  const [commissionPolicy, setCommissionPolicy] = useState<CommissionPolicy>(
    DEFAULT_COMMISSION_POLICY
  );

  const [registrationInfo, setRegistrationInfo] = useState<AmbassadorRegistrationInfo>(() => {
    try {
      const saved = localStorage.getItem('foroshyar_ambassador_registration_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.referralCode) {
          return parsed as AmbassadorRegistrationInfo;
        }
      }
    } catch {
      // ignore
    }
    return {
      mobilePhone: '',
      email: 'ambassador@ablecity.ir',
      referralCode: 'TVN-AMB-1042',
      referredByCode: '',
      isRegisteredWithContact: false,
      xpHistory: [
        {
          id: 'init_xp_1',
          reasonFa: 'امتیاز پایه ورود به آکادمی فروشیار و قبولی در ۲ گواهینامه اولیه',
          delta: 420,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        'foroshyar_ambassador_registration_v4',
        JSON.stringify(registrationInfo)
      );
    } catch {
      // ignore
    }
  }, [registrationInfo]);

  const appendXpLog = useCallback((delta: number, reasonFa: string) => {
    if (delta === 0) return;
    setRegistrationInfo((prev) => ({
      ...prev,
      xpHistory: [
        {
          id: `xp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          reasonFa,
          delta,
          timestamp: new Date().toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...prev.xpHistory.slice(0, 24),
      ],
    }));
  }, []);

  // Offline-First synchronization for practice, training, and simulations
  useEffect(() => {
    try {
      localStorage.setItem('foroshyar_offline_profile_v4', JSON.stringify(profile));
    } catch {
      // Ignore storage quota errors
    }
  }, [profile]);

  // Sync authenticated user with backend JWT verification and Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setVerifiedServerSession(null);
        setProfile(buildInitialSandboxProfile());
        setAuthReady(true);
        return;
      }

      try {
        // 1. Verify Real JWT on Server
        const idToken = await user.getIdToken();
        const verifyRes = await fetch('/api/security/verify-session', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (verifyRes.ok) {
          const sessionData = (await verifyRes.json()) as VerifiedServerSession;
          setVerifiedServerSession(sessionData);
        }
      } catch (err) {
        console.error('JWT verification check error:', err);
      }

      // 2. Load or Initialize Ambassador Profile in Firestore
      const uid = user.uid;
      const tenantId = deriveTenantIdFromEmail(user.email);
      const ambassadorPath = `ambassadors/${uid}`;
      const ambassadorRef = doc(db, 'ambassadors', uid);

      try {
        const snap = await getDoc(ambassadorRef);
        const nowIso = new Date().toISOString();

        if (!snap.exists()) {
          const initialCerts = createInitialProductCertifications(uid, tenantId);
          // Seed DecorMate & SalonMate as certified and EventMate as training so the user immediately sees multi-product architecture
          initialCerts.DECORMATE = {
            ambassadorId: uid,
            tenantId,
            productId: 'DECORMATE',
            status: 'CERTIFIED',
            trainingCompleted: true,
            trainingProgress: 100,
            examScore: 92,
            simulationPassed: true,
            fieldEvaluationPassed: true,
            updatedAt: nowIso,
          };
          initialCerts.SALONMATE = {
            ambassadorId: uid,
            tenantId,
            productId: 'SALONMATE',
            status: 'CERTIFIED',
            trainingCompleted: true,
            trainingProgress: 100,
            examScore: 85,
            simulationPassed: true,
            fieldEvaluationPassed: true,
            updatedAt: nowIso,
          };
          initialCerts.EVENTMATE = {
            ambassadorId: uid,
            tenantId,
            productId: 'EVENTMATE',
            status: 'TRAINING',
            trainingCompleted: false,
            trainingProgress: 60,
            examScore: 0,
            simulationPassed: false,
            fieldEvaluationPassed: false,
            updatedAt: nowIso,
          };

          const safeDisplayName = (user.displayName || 'سفیر فروش فروشیار').slice(0, 95);
          const safeEmail = (user.email || 'user@ablecity.ir').slice(0, 145);

          await setDoc(ambassadorRef, {
            uid,
            tenantId,
            displayName: safeDisplayName,
            email: safeEmail,
            academyStage: 'CERTIFIED',
            tier: 'A+',
            generalTrainingScore: 100,
            generalExamScore: 89,
            generalSimulationPassed: true,
            generalCertified: true,
            reassessmentRequired: false,
            xp: 420,
            completedScenariosCount: 3,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          for (const pid of ALL_PRODUCT_IDS) {
            const c = initialCerts[pid];
            await setDoc(doc(db, 'ambassadors', uid, 'productCertifications', pid), {
              ambassadorId: uid,
              tenantId,
              productId: pid,
              status: c.status,
              trainingCompleted: c.trainingCompleted,
              trainingProgress: c.trainingProgress,
              examScore: c.examScore,
              simulationPassed: c.simulationPassed,
              fieldEvaluationPassed: c.fieldEvaluationPassed,
              updatedAt: serverTimestamp(),
            });
          }

          setProfile({
            uid,
            tenantId,
            displayName: safeDisplayName,
            email: safeEmail,
            academyStage: 'CERTIFIED',
            tier: 'A+',
            generalTrainingScore: 100,
            generalExamScore: 89,
            generalSimulationPassed: true,
            generalCertified: true,
            reassessmentRequired: false,
            xp: 420,
            completedScenariosCount: 3,
            productCertifications: initialCerts,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        } else {
          const data = snap.data();
          const certsMap = createInitialProductCertifications(uid, data.tenantId || tenantId);
          const certsColRef = collection(db, 'ambassadors', uid, 'productCertifications');
          const certsSnap = await getDocs(certsColRef);
          certsSnap.forEach((docSnap) => {
            const cData = docSnap.data();
            const pid = cData.productId as ProductId;
            if (ALL_PRODUCT_IDS.includes(pid)) {
              certsMap[pid] = {
                ambassadorId: cData.ambassadorId,
                tenantId: cData.tenantId,
                productId: pid,
                status: cData.status,
                trainingCompleted: Boolean(cData.trainingCompleted),
                trainingProgress: Number(cData.trainingProgress ?? 0),
                examScore: Number(cData.examScore ?? 0),
                simulationPassed: Boolean(cData.simulationPassed),
                fieldEvaluationPassed: Boolean(cData.fieldEvaluationPassed),
                updatedAt: nowIso,
              };
            }
          });

          setProfile({
            uid: data.uid,
            tenantId: data.tenantId,
            displayName: data.displayName,
            email: data.email,
            academyStage: data.academyStage,
            tier: data.tier,
            generalTrainingScore: Number(data.generalTrainingScore ?? 0),
            generalExamScore: Number(data.generalExamScore ?? 0),
            generalSimulationPassed: Boolean(data.generalSimulationPassed),
            generalCertified: Boolean(data.generalCertified),
            reassessmentRequired: Boolean(data.reassessmentRequired),
            xp: Number(data.xp ?? 0),
            completedScenariosCount: Number(data.completedScenariosCount ?? 0),
            productCertifications: certsMap,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, ambassadorPath);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const persistAmbassadorFields = useCallback(
    async (updated: AmbassadorDomainProfile) => {
      setProfile(updated);
      if (!firebaseUser) return;
      const path = `ambassadors/${firebaseUser.uid}`;
      try {
        await updateDoc(doc(db, 'ambassadors', firebaseUser.uid), {
          displayName: updated.displayName.slice(0, 95),
          academyStage: updated.academyStage,
          tier: updated.tier,
          generalTrainingScore: Math.min(100, Math.max(0, updated.generalTrainingScore)),
          generalExamScore: Math.min(100, Math.max(0, updated.generalExamScore)),
          generalSimulationPassed: updated.generalSimulationPassed,
          generalCertified: updated.generalCertified,
          reassessmentRequired: updated.reassessmentRequired,
          xp: Math.min(1000000, Math.max(0, updated.xp)),
          completedScenariosCount: Math.min(10000, Math.max(0, updated.completedScenariosCount)),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [firebaseUser]
  );

  const persistProductCert = useCallback(
    async (cert: ProductCertificationRecord) => {
      if (!firebaseUser) return;
      const path = `ambassadors/${firebaseUser.uid}/productCertifications/${cert.productId}`;
      try {
        await setDoc(doc(db, 'ambassadors', firebaseUser.uid, 'productCertifications', cert.productId), {
          ambassadorId: firebaseUser.uid,
          tenantId: profile.tenantId,
          productId: cert.productId,
          status: cert.status,
          trainingCompleted: cert.trainingCompleted,
          trainingProgress: Math.min(100, Math.max(0, cert.trainingProgress)),
          examScore: Math.min(100, Math.max(0, cert.examScore)),
          simulationPassed: cert.simulationPassed,
          fieldEvaluationPassed: cert.fieldEvaluationPassed,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [firebaseUser, profile.tenantId]
  );

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? `خطا در ورود با حساب گوگل: ${err.message}`
          : 'ورود با حساب گوگل انجام نشد.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOutUser = async () => {
    await firebaseSignOut(auth);
  };

  const completeGeneralTrainingStep = async (progressDelta: number) => {
    const newProgress = Math.min(100, profile.generalTrainingScore + progressDelta);
    const updated: AmbassadorDomainProfile = {
      ...profile,
      generalTrainingScore: newProgress,
      academyStage:
        profile.academyStage === 'REGISTERED' ? 'GENERAL_TRAINING' : profile.academyStage,
      xp: profile.xp + 35,
      updatedAt: new Date().toISOString(),
    };
    appendXpLog(35, 'مطالعه گام آموزشی در آکادمی جامع فروشیار');
    await persistAmbassadorFields(updated);
  };

  const submitGeneralExamResult = async (examScore: number) => {
    const evalResult = evaluateGeneralCertification(
      examScore,
      profile.generalSimulationPassed
    );
    if (!evalResult.valid || !evalResult.tier || !evalResult.nextStage) return;

    const updated: AmbassadorDomainProfile = {
      ...profile,
      generalExamScore: examScore,
      tier: evalResult.tier,
      generalCertified: Boolean(evalResult.generalCertified),
      reassessmentRequired: Boolean(evalResult.reassessmentRequired),
      academyStage: evalResult.nextStage,
      xp: profile.xp + 80,
      updatedAt: new Date().toISOString(),
    };
    appendXpLog(80, `ثبت نمره ${examScore}٪ در آزمون جامع تعیین سطح (${evalResult.tier})`);
    await persistAmbassadorFields(updated);
  };

  const markGeneralSimulationPassed = async (trustScore: number, mistakesCount: number) => {
    const passed = trustScore >= 75;
    const newSimPassed = profile.generalSimulationPassed || passed;
    const evalResult = evaluateGeneralCertification(profile.generalExamScore, newSimPassed);

    const delta = passed ? 100 : 30;
    const updated: AmbassadorDomainProfile = {
      ...profile,
      generalSimulationPassed: newSimPassed,
      tier: evalResult.tier || profile.tier,
      generalCertified:
        evalResult.generalCertified !== undefined
          ? evalResult.generalCertified
          : profile.generalCertified,
      reassessmentRequired:
        evalResult.reassessmentRequired !== undefined
          ? evalResult.reassessmentRequired
          : profile.reassessmentRequired,
      academyStage: evalResult.nextStage || profile.academyStage,
      xp: profile.xp + delta,
      completedScenariosCount: profile.completedScenariosCount + 1,
      updatedAt: new Date().toISOString(),
    };
    appendXpLog(delta, `تکمیل شبیه‌سازی مذاکره عمومی (اعتماد مشتری: ${trustScore}٪)`);
    await persistAmbassadorFields(updated);

    if (firebaseUser) {
      const attemptId = `att_${Date.now()}`;
      const attemptPath = `ambassadors/${firebaseUser.uid}/simulationAttempts/${attemptId}`;
      try {
        await setDoc(doc(db, 'ambassadors', firebaseUser.uid, 'simulationAttempts', attemptId), {
          ambassadorId: firebaseUser.uid,
          tenantId: profile.tenantId,
          scenarioId: 'scen_general_core',
          productId: 'GENERAL',
          finalTrustScore: Math.min(100, Math.max(0, trustScore)),
          mistakesMade: Math.max(0, mistakesCount),
          passed,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, attemptPath);
      }
    }
  };

  const startProductTrack = async (productId: ProductId) => {
    const existingCert = profile.productCertifications[productId];
    if (existingCert.status !== 'NOT_STARTED') return;

    const updatedCert: ProductCertificationRecord = {
      ...existingCert,
      status: 'TRAINING',
      trainingProgress: 25,
      updatedAt: new Date().toISOString(),
    };
    const nextProfile: AmbassadorDomainProfile = {
      ...profile,
      academyStage:
        profile.academyStage === 'CERTIFIED_GENERAL'
          ? 'SPECIALIZED_TRAINING'
          : profile.academyStage,
      productCertifications: {
        ...profile.productCertifications,
        [productId]: updatedCert,
      },
      updatedAt: new Date().toISOString(),
    };
    await persistAmbassadorFields(nextProfile);
    await persistProductCert(updatedCert);
  };

  const completeProductTraining = async (productId: ProductId) => {
    const existingCert = profile.productCertifications[productId];
    const draft = {
      ...existingCert,
      trainingCompleted: true,
      trainingProgress: 100,
    };
    const lifecycle = computeProductLifecycleStatus(draft, false, false);
    const updatedCert: ProductCertificationRecord = {
      ...draft,
      status: lifecycle.status,
      updatedAt: new Date().toISOString(),
    };
    const nextProfile: AmbassadorDomainProfile = {
      ...profile,
      xp: profile.xp + 50,
      productCertifications: {
        ...profile.productCertifications,
        [productId]: updatedCert,
      },
      updatedAt: new Date().toISOString(),
    };
    appendXpLog(50, `تکمیل سرفصل آموزشی و پلی‌بوک صنف (${productId})`);
    await persistAmbassadorFields(nextProfile);
    await persistProductCert(updatedCert);
  };

  const submitProductExam = async (productId: ProductId, score: number) => {
    const existingCert = profile.productCertifications[productId];
    const draft = {
      ...existingCert,
      trainingCompleted: true,
      trainingProgress: 100,
      examScore: score,
    };
    const lifecycle = computeProductLifecycleStatus(draft, true, false);
    const updatedCert: ProductCertificationRecord = {
      ...draft,
      status: lifecycle.status,
      updatedAt: new Date().toISOString(),
    };
    const delta = score >= 75 ? 90 : 20;
    const nextProfile: AmbassadorDomainProfile = {
      ...profile,
      xp: profile.xp + delta,
      productCertifications: {
        ...profile.productCertifications,
        [productId]: updatedCert,
      },
      updatedAt: new Date().toISOString(),
    };
    appendXpLog(delta, `شرکت در آزمون تخصصی صنف (${productId}) با نمره ${score}٪`);
    await persistAmbassadorFields(nextProfile);
    await persistProductCert(updatedCert);
  };

  const markProductSimulationOutcome = async (
    productId: ProductId,
    passed: boolean,
    trustScore: number,
    mistakesCount: number
  ) => {
    const existingCert = profile.productCertifications[productId];
    const draft = {
      ...existingCert,
      simulationPassed: existingCert.simulationPassed || passed,
    };
    const lifecycle = computeProductLifecycleStatus(draft, false, true);
    const updatedCert: ProductCertificationRecord = {
      ...draft,
      status: lifecycle.status,
      updatedAt: new Date().toISOString(),
    };
    const nextProfile: AmbassadorDomainProfile = {
      ...profile,
      xp: profile.xp + (passed ? 110 : 25),
      completedScenariosCount: profile.completedScenariosCount + 1,
      productCertifications: {
        ...profile.productCertifications,
        [productId]: updatedCert,
      },
      updatedAt: new Date().toISOString(),
    };
    await persistAmbassadorFields(nextProfile);
    await persistProductCert(updatedCert);

    if (firebaseUser) {
      const attemptId = `att_${Date.now()}`;
      const attemptPath = `ambassadors/${firebaseUser.uid}/simulationAttempts/${attemptId}`;
      try {
        await setDoc(doc(db, 'ambassadors', firebaseUser.uid, 'simulationAttempts', attemptId), {
          ambassadorId: firebaseUser.uid,
          tenantId: profile.tenantId,
          scenarioId: `scen_${productId.toLowerCase()}`,
          productId,
          finalTrustScore: Math.min(100, Math.max(0, trustScore)),
          mistakesMade: Math.max(0, mistakesCount),
          passed,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, attemptPath);
      }
    }
  };

  const completeProductFieldEvaluation = async (productId: ProductId, passed: boolean) => {
    const existingCert = profile.productCertifications[productId];
    const draft = {
      ...existingCert,
      fieldEvaluationPassed: passed,
    };
    const lifecycle = computeProductLifecycleStatus(draft, false, false);
    const updatedCert: ProductCertificationRecord = {
      ...draft,
      status: lifecycle.status,
      updatedAt: new Date().toISOString(),
    };
    const nextProfile: AmbassadorDomainProfile = {
      ...profile,
      academyStage: lifecycle.status === 'CERTIFIED' ? 'CERTIFIED' : profile.academyStage,
      xp: profile.xp + (passed ? 150 : 0),
      productCertifications: {
        ...profile.productCertifications,
        [productId]: updatedCert,
      },
      updatedAt: new Date().toISOString(),
    };
    await persistAmbassadorFields(nextProfile);
    await persistProductCert(updatedCert);
  };

  const adjustAmbassadorXp = async (xpDelta: number, reasonFa?: string) => {
    const roundedDelta = Math.round(xpDelta);
    const nextXp = Math.max(0, Math.min(1000000, Math.round(profile.xp + roundedDelta)));
    const nextProfile: AmbassadorDomainProfile = {
      ...profile,
      xp: nextXp,
      updatedAt: new Date().toISOString(),
    };
    if (reasonFa) {
      appendXpLog(roundedDelta, reasonFa);
    }
    await persistAmbassadorFields(nextProfile);
  };

  const registerWithMobileAndEmail = async (params: {
    displayName: string;
    mobilePhone: string;
    email: string;
    referredByCode?: string;
  }): Promise<{ referralCode: string; awardedXp: number }> => {
    const cleanName = params.displayName.trim() || profile.displayName;
    const cleanPhone = params.mobilePhone.trim();
    const cleanEmail = params.email.trim() || profile.email;
    const cleanRefBy = (params.referredByCode || '').trim().toUpperCase();

    // Generate deterministic official referral code from phone digits + email prefix
    const digitsOnly = cleanPhone.replace(/[^0-9۰-۹]/g, '');
    const normalizedDigits = digitsOnly.replace(/[۰-۹]/g, (d) =>
      String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    );
    const suffix4 =
      normalizedDigits.length >= 4
        ? normalizedDigits.slice(-4)
        : String(1000 + Math.floor(Math.random() * 8999));
    const emailPrefix = cleanEmail
      .split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 3) || 'AMB';

    const generatedCode = `TVN-${emailPrefix}-${suffix4}`;

    const isFirstContactReg = !registrationInfo.isRegisteredWithContact;
    const baseBonus = isFirstContactReg ? 150 : 0;
    const referralBonus =
      isFirstContactReg && cleanRefBy && cleanRefBy !== generatedCode ? 100 : 0;
    const totalBonus = baseBonus + referralBonus;

    setRegistrationInfo((prev) => {
      const newLogs: XpActivityLogItem[] = [...prev.xpHistory];
      if (baseBonus > 0) {
        newLogs.unshift({
          id: `reg_${Date.now()}`,
          reasonFa: `ثبت‌نام رسمی با موبایل (${cleanPhone}) و ایمیل و صدور کد معرف ${generatedCode}`,
          delta: baseBonus,
          timestamp: new Date().toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      }
      if (referralBonus > 0) {
        newLogs.unshift({
          id: `refby_${Date.now()}`,
          reasonFa: `پاداش ورود با کد معرف دعوت‌کننده (${cleanRefBy})`,
          delta: referralBonus,
          timestamp: new Date().toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      }
      return {
        mobilePhone: cleanPhone,
        email: cleanEmail,
        referralCode: generatedCode,
        referredByCode: cleanRefBy || prev.referredByCode,
        isRegisteredWithContact: true,
        xpHistory: newLogs.slice(0, 25),
      };
    });

    try {
      localStorage.setItem('foroshyar_ambassador_ref_code', generatedCode);
    } catch {
      // ignore
    }

    const nextProfile: AmbassadorDomainProfile = {
      ...profile,
      displayName: cleanName,
      email: cleanEmail,
      xp: Math.min(1000000, profile.xp + totalBonus),
      updatedAt: new Date().toISOString(),
    };
    await persistAmbassadorFields(nextProfile);

    return { referralCode: generatedCode, awardedXp: totalBonus };
  };

  const applyPresetProfileScenario = async (
    preset:
      | 'BRIEF_MULTI_PRODUCT_EXAMPLE'
      | 'TIER_A_PLUS_PLUS'
      | 'REASSESSMENT_TIER_B'
      | 'FRESH_START'
  ) => {
    const now = new Date().toISOString();
    const uid = profile.uid;
    const tenantId = profile.tenantId;
    const certs = createInitialProductCertifications(uid, tenantId);

    let nextProfile: AmbassadorDomainProfile;

    if (preset === 'BRIEF_MULTI_PRODUCT_EXAMPLE') {
      certs.DECORMATE = {
        ambassadorId: uid,
        tenantId,
        productId: 'DECORMATE',
        status: 'CERTIFIED',
        trainingCompleted: true,
        trainingProgress: 100,
        examScore: 92,
        simulationPassed: true,
        fieldEvaluationPassed: true,
        updatedAt: now,
      };
      certs.SALONMATE = {
        ambassadorId: uid,
        tenantId,
        productId: 'SALONMATE',
        status: 'CERTIFIED',
        trainingCompleted: true,
        trainingProgress: 100,
        examScore: 85,
        simulationPassed: true,
        fieldEvaluationPassed: true,
        updatedAt: now,
      };
      certs.EVENTMATE = {
        ambassadorId: uid,
        tenantId,
        productId: 'EVENTMATE',
        status: 'TRAINING',
        trainingCompleted: false,
        trainingProgress: 60,
        examScore: 0,
        simulationPassed: false,
        fieldEvaluationPassed: false,
        updatedAt: now,
      };
      nextProfile = {
        ...profile,
        academyStage: 'CERTIFIED',
        tier: 'A+',
        generalTrainingScore: 100,
        generalExamScore: 89,
        generalSimulationPassed: true,
        generalCertified: true,
        reassessmentRequired: false,
        productCertifications: certs,
        updatedAt: now,
      };
    } else if (preset === 'TIER_A_PLUS_PLUS') {
      for (const pid of ALL_PRODUCT_IDS) {
        certs[pid] = {
          ambassadorId: uid,
          tenantId,
          productId: pid,
          status: 'CERTIFIED',
          trainingCompleted: true,
          trainingProgress: 100,
          examScore: 96,
          simulationPassed: true,
          fieldEvaluationPassed: true,
          updatedAt: now,
        };
      }
      nextProfile = {
        ...profile,
        academyStage: 'CERTIFIED',
        tier: 'A++',
        generalTrainingScore: 100,
        generalExamScore: 98,
        generalSimulationPassed: true,
        generalCertified: true,
        reassessmentRequired: false,
        productCertifications: certs,
        updatedAt: now,
      };
    } else if (preset === 'REASSESSMENT_TIER_B') {
      // Demonstrates that Tier B enters Reassessment and is blocked from field sales even if a product was previously certified
      certs.DECORMATE = {
        ambassadorId: uid,
        tenantId,
        productId: 'DECORMATE',
        status: 'CERTIFIED',
        trainingCompleted: true,
        trainingProgress: 100,
        examScore: 88,
        simulationPassed: true,
        fieldEvaluationPassed: true,
        updatedAt: now,
      };
      nextProfile = {
        ...profile,
        academyStage: 'REASSESSMENT',
        tier: 'B',
        generalTrainingScore: 100,
        generalExamScore: 62,
        generalSimulationPassed: false,
        generalCertified: false,
        reassessmentRequired: true,
        productCertifications: certs,
        updatedAt: now,
      };
    } else {
      nextProfile = {
        ...profile,
        academyStage: 'REGISTERED',
        tier: 'UNRANKED',
        generalTrainingScore: 20,
        generalExamScore: 0,
        generalSimulationPassed: false,
        generalCertified: false,
        reassessmentRequired: false,
        productCertifications: certs,
        updatedAt: now,
      };
    }

    await persistAmbassadorFields(nextProfile);
    if (firebaseUser) {
      for (const pid of ALL_PRODUCT_IDS) {
        await persistProductCert(nextProfile.productCertifications[pid]);
      }
    }
  };

  return (
    <AmbassadorContext.Provider
      value={{
        firebaseUser,
        authReady,
        isSigningIn,
        authError,
        verifiedServerSession,
        profile,
        registrationInfo,
        commissionPolicy,
        updateCommissionPolicy: setCommissionPolicy,
        signInWithGoogle,
        signOutUser,
        registerWithMobileAndEmail,
        completeGeneralTrainingStep,
        submitGeneralExamResult,
        markGeneralSimulationPassed,
        startProductTrack,
        completeProductTraining,
        submitProductExam,
        markProductSimulationOutcome,
        completeProductFieldEvaluation,
        adjustAmbassadorXp,
        applyPresetProfileScenario,
      }}
    >
      {children}
    </AmbassadorContext.Provider>
  );
};

export function useAmbassador() {
  const ctx = useContext(AmbassadorContext);
  if (!ctx) {
    throw new Error('useAmbassador must be used within AmbassadorProvider');
  }
  return ctx;
}
