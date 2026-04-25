'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

type TourAction = 
  | 'clickBoost' 
  | 'switchToAuditTab' 
  | 'switchToEditTab' 
  | 'clickExecutiveTheme' 
  | 'openCustomPanel'
  | 'waitForPdf' 
  | 'clickVisualEdit' 
  | 'switchToJobTab' 
  | 'triggerJobSearchAndWait' 
  | 'switchToCompareTab';

interface TourStep {
  target: string;
  title: string;
  desc: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: TourAction;
}

const STEPS: TourStep[] = [
  {
    target: '.brand',
    title: 'Bienvenue sur IRIS ⧡',
    desc: 'Un outil simple pour t\'aider à améliorer ton CV. On va regarder ensemble comment l\'IA analyse ton profil pour les recruteurs.',
    position: 'right',
  },
  {
    target: '[data-tour="api-provider"]',
    title: '🔑 1. Configuration IA',
    desc: 'On commence par ta clé API. C\'est le moteur qui permet à l\'IA de réfléchir.',
    position: 'right',
  },
  {
    target: '.file-drop',
    title: '📄 2. Ton CV & L\'Offre',
    desc: 'Dépose ton CV et l\'offre d\'emploi ici. C\'est la base de toute l\'analyse.',
    position: 'right',
  },
  {
    target: '[data-tour="boost"]',
    title: '🚀 Mode Boost',
    desc: 'Active ce mode pour une analyse ultra-profonde. C\'est indispensable pour un résultat pro.',
    position: 'right',
    action: 'clickBoost',
  },
  {
    target: '[data-tour="launch-audit"]',
    title: '⬡ Lancement de l\'Audit',
    desc: 'C\'est ici qu\'on lance la machine. En cliquant, IRIS analyse tout instantanément.',
    position: 'right',
  },
  {
    target: '[data-tour="audit-tab"]',
    title: '📊 Onglet Audit',
    desc: 'Cliquons sur l\'onglet Audit pour voir les résultats de l\'analyse.',
    position: 'bottom',
    action: 'switchToAuditTab',
  },
  {
    target: '[data-tour="market-verdict"]',
    title: '⚖️ Verdict du Marché',
    desc: 'Voici ton score d\'employabilité. C\'est ce que voient les recruteurs en premier.',
    position: 'bottom',
  },
  {
    target: '[data-tour="semantic-audit"]',
    title: '🔍 Analyse Sémantique',
    desc: 'Regarde : IRIS identifie les mots-clés qui manquent pour matcher l\'offre.',
    position: 'top',
  },
  {
    target: '[data-tour="edit-tab"]',
    title: '✏️ Onglet Content',
    desc: 'Passons à l\'onglet Content pour voir comment IRIS a structuré tes données.',
    position: 'bottom',
    action: 'switchToEditTab',
  },
  {
    target: '.input-field.mono',
    title: '✏️ Édition (Content)',
    desc: 'Modifie ton CV ici. Le format JSON garantit une structure parfaite pour les robots.',
    position: 'top',
  },
  {
    target: '[data-tour="pdf-tab"]',
    title: '🎨 Onglet PDF Export',
    desc: 'Cliquons sur l\'export PDF pour voir ton nouveau CV stylisé.',
    position: 'bottom',
    action: 'clickExecutiveTheme',
  },
  {
    target: '[data-tour="theme-executive"]',
    title: '🎨 Design & Thèmes',
    desc: 'IRIS a sélectionné le thème "Executive". Tu peux changer le style de ton CV immédiatement.',
    position: 'bottom',
  },
  {
    target: '[data-tour="customization-body"]',
    title: '✨ Personnalisation Avancée',
    desc: 'Voici les réglages de design. Tu peux tout changer : couleurs, police, et même demander à l\'IA de copier le style d\'une marque !',
    position: 'top',
    action: 'openCustomPanel',
  },
  {
    target: '#pdf-preview-container, #pdf-iframe, [data-tour="pdf-placeholder"]',
    title: '✨ CV Généré !',
    desc: 'Regarde ici : ton nouveau CV est là. Design pro, structure ATS, prêt à l\'envoi.',
    position: 'left',
    action: 'waitForPdf',
  },
  {
    target: '[data-tour="visual-edit-toggle"]',
    title: '✏️ Édition Visuelle',
    desc: 'C\'est la partie magique ! Clique ici pour modifier ton CV directement sur l\'aperçu.',
    position: 'top',
    action: 'clickVisualEdit',
  },
  {
    target: '.simple-pdf-editor',
    title: '🛠️ Modifie en Direct',
    desc: 'Ici, tu peux changer ton texte, tes dates ou tes expériences. Le PDF se met à jour tout seul !',
    position: 'left',
  },
  {
    target: '[data-tour="jobs-tab"]',
    title: '💼 Onglet Jobs',
    desc: 'Cliquons sur l\'onglet Jobs pour trouver des offres qui te correspondent.',
    position: 'bottom',
    action: 'switchToJobTab',
  },
  {
    target: '[data-tour="job-search-btn"]',
    title: '💼 Recherche d\'Emploi',
    desc: 'Cliquons sur "Auto-Match" pour lancer une recherche réelle d\'offres.',
    position: 'top',
  },
  {
    target: '.animate-in.card',
    title: '🎯 Opportunités Réelles',
    desc: 'Recherche terminée ! Voilà les offres sur la carte avec ton score de correspondance.',
    position: 'top',
    action: 'triggerJobSearchAndWait',
  },
  {
    target: '[data-tour="job-map"]',
    title: '🗺️ Géolocalisation SIG',
    desc: 'Toutes les offres sont cartographiées. Tu peux voir les opportunités autour de toi en un coup d\'œil.',
    position: 'bottom',
  },
  {
    target: '[data-tour="privacy-shield-header"]',
    title: '🛡️ Privacy Shield (Zero-Trust)',
    desc: 'Enfin, IRIS protège ta vie privée. Tes clés API et ton CV sont stockés localement. Aucune donnée personnelle n\'est conservée sur nos serveurs. AES-256 & TLS 1.3 garantis.',
    position: 'bottom',
    action: 'switchToCompareTab',
  },
  {
    target: '[data-tour="reset-tour"]',
    title: '🚀 C\'est à toi !',
    desc: 'Bonne chance ! Si tu as un doute, le guide est toujours là (?).',
    position: 'right',
    action: 'switchToAuditTab',
  },
];

export default function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const done = localStorage.getItem('IRIS_tour_done_v15');
      if (!done) setTimeout(() => setShow(true), 1000);
    } catch {
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  useEffect(() => {
    (window as any).__resetTour = () => {
      localStorage.removeItem('IRIS_tour_done_v15');
      setShow(true);
      setActive(false);
      setStep(0);
    };
  }, []);

  const updateRect = useCallback(() => {
    const selector = STEPS[step]?.target;
    if (!selector) return;
    
    let attempts = 0;
    const find = () => {
        const elements = selector.split(',').map(s => s.trim());
        let el: HTMLElement | null = null;
        for (const s of elements) {
            const found = Array.from(document.querySelectorAll(s)).find(e => (e as HTMLElement).offsetParent !== null) as HTMLElement;
            if (found) { el = found; break; }
        }
        
        if (el) {
            const bodyRect = document.body.getBoundingClientRect();
            const elemRect = el.getBoundingClientRect();
            const offsetTop = elemRect.top - bodyRect.top;
            
            window.scrollTo({
                top: offsetTop - (window.innerHeight / 2) + (elemRect.height / 2),
                behavior: 'smooth'
            });

            const measure = () => {
                if (el) setRect(el.getBoundingClientRect());
            };
            [100, 300, 600, 1000, 1500, 2000].forEach(ms => setTimeout(measure, ms));
        } else if (attempts < 60) {
            attempts++;
            setTimeout(find, 250);
        }
    };
    find();
  }, [step]);

  useEffect(() => {
    if (!active) {
        (window as any).__isTourActive = false;
        return;
    }
    (window as any).__isTourActive = true;
    
    const currentStep = STEPS[step];
    
    const clickTab = (selectorOrText: string) => {
        try {
            const tabByTour = document.querySelector(`[data-tour="${selectorOrText}"]`) as HTMLElement;
            if (tabByTour) {
                tabByTour.click();
                return;
            }
            const tabs = Array.from(document.querySelectorAll('.tab')) as HTMLElement[];
            const tab = tabs.find(el => el.textContent?.toLowerCase().includes(selectorOrText.toLowerCase()));
            if (tab) tab.click();
        } catch (e) { }
    };

    const runAction = async () => {
        if (!currentStep.action) {
            setTimeout(updateRect, 400);
            return;
        }

        if (currentStep.action === 'waitForPdf' || currentStep.action === 'clickVisualEdit' || currentStep.action === 'openCustomPanel') {
            clickTab('pdf-tab');
        } else if (currentStep.action === 'switchToJobTab') {
            clickTab('jobs-tab');
        } else if (currentStep.action === 'switchToCompareTab') {
            clickTab('compare-tab');
        } else if (currentStep.action === 'switchToAuditTab') {
            clickTab('audit-tab');
        } else if (currentStep.action === 'switchToEditTab') {
            clickTab('edit-tab');
        } else if (currentStep.action === 'clickBoost') {
            const boost = document.querySelector('[data-tour="boost"]') as HTMLElement;
            if (boost) boost.click();
        }

        if (currentStep.action === 'clickExecutiveTheme') {
            clickTab('pdf-tab');
            setTimeout(() => {
                const theme = document.querySelector('[data-tour="theme-executive"]') as HTMLElement;
                if (theme) theme.click();
            }, 800);
        } else if (currentStep.action === 'openCustomPanel') {
            clickTab('pdf-tab');
            setTimeout(() => {
                const panel = document.querySelector('[data-tour="customization"]') as HTMLElement;
                const header = document.querySelector('[data-tour="customization-header"]') as HTMLElement;
                const isOpen = panel?.getAttribute('data-open') === 'true';
                if (header && !isOpen) {
                    header.click();
                }
                setTimeout(updateRect, 400);
            }, 800);
        } else if (currentStep.action === 'clickVisualEdit') {
            clickTab('pdf-tab');
            setTimeout(() => {
                const btn = document.querySelector('[data-tour="visual-edit-toggle"]') as HTMLElement;
                if (btn) btn.click();
                setTimeout(updateRect, 800);
            }, 800);
        } else if (currentStep.action === 'triggerJobSearchAndWait') {
            clickTab('jobs-tab');
            setWaiting(true);
            const btn = document.querySelector('[data-tour="job-search-btn"]') as HTMLElement;
            if (btn) btn.click();
            
            const check = setInterval(() => {
                const card = document.querySelector('.animate-in.card');
                const empty = document.querySelector('.empty, .no-results');
                if (card || empty) {
                    clearInterval(check);
                    setWaiting(false);
                    setTimeout(updateRect, 500);
                }
            }, 800);
            
            setTimeout(() => { setWaiting(false); clearInterval(check); }, 15000);
            return;
        } else if (currentStep.action === 'waitForPdf') {
            const alreadyThere = document.querySelector('#pdf-iframe');
            if (alreadyThere) {
                setTimeout(updateRect, 400);
                return;
            }
            
            setWaiting(true);
            const check = setInterval(() => {
                const preview = document.querySelector('#pdf-iframe');
                if (preview) {
                    clearInterval(check);
                    setWaiting(false);
                    setTimeout(updateRect, 800);
                }
            }, 500);
            
            setTimeout(() => { 
                setWaiting(false); 
                clearInterval(check);
                updateRect();
            }, 8000);
            return;
        }
        
        setTimeout(updateRect, 400);
    };

    runAction();
    
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [active, step, updateRect]);

  const startDemo = () => {
    setShow(false);
    setTimeout(() => {
      const exampleBtn = document.querySelector('.example-cv-btn') as HTMLButtonElement;
      if (exampleBtn) exampleBtn.click();
      setTimeout(() => { setActive(true); setStep(0); }, 1000);
    }, 300);
  };

  const skip = () => { setShow(false); localStorage.setItem('IRIS_tour_done_v15', '1'); };
  const next = () => {
    if (waiting) return;
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  };
  const prev = () => { if (step > 0) setStep(s => s - 1); };
  const finish = () => { setActive(false); (window as any).__isTourActive = false; localStorage.setItem('IRIS_tour_done_v15', '1'); };

  const PAD = 10;
  const tooltipW = typeof window !== 'undefined' && window.innerWidth <= 768 ? Math.min(window.innerWidth - 40, 320) : 340;

  const tooltipStyle = (): React.CSSProperties => {
    if (!rect) return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
    const base: React.CSSProperties = { position: 'fixed', width: tooltipW, zIndex: 10001, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' };
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;
    const isMobile = viewW <= 768;

    let top: number;
    let left: number;

    if (isMobile) {
      top = rect.bottom + PAD + 12;
      left = Math.max(10, Math.min(viewW - tooltipW - 10, viewW / 2 - tooltipW / 2));
      if (top + 250 > viewH) top = Math.max(10, rect.top - 250 - PAD);
    } else {
      top = rect.top + rect.height / 2 - 120;
      left = rect.right + PAD + 60;
      if (left + tooltipW > viewW - 20) left = rect.left - tooltipW - PAD - 60;
      if (top + 320 > viewH) top = viewH - 340;
      if (top < 20) top = 20;
    }

    return { ...base, left, top };
  };

  const ApiGuide = ({ id, title, steps, link, format }: any) => (
    <div style={{ marginBottom: '10px', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <button 
        onClick={() => setActiveGuide(activeGuide === id ? null : id)}
        style={{ width: '100%', padding: '12px 16px', background: 'var(--card)', border: 'none', color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '0.7rem' }}
      >
        <span>{title}</span>
        <span>{activeGuide === id ? '−' : '+'}</span>
      </button>
      {activeGuide === id && (
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.1)', fontSize: '0.75rem', textAlign: 'left', lineHeight: '1.5' }}>
          <div style={{ color: 'var(--gold)', marginBottom: '8px', fontWeight: 600 }}>Étapes à suivre :</div>
          {steps.map((s: string, i: number) => <div key={i} style={{ marginBottom: '4px' }}>{i + 1}. {s}</div>)}
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>Format : <code style={{ color: 'var(--cyan)' }}>{format}</code></div>
            <a href={link} target="_blank" rel="noopener" style={{ display: 'inline-block', marginTop: '8px', padding: '6px 12px', background: 'var(--gold)', color: '#000', borderRadius: '4px', textDecoration: 'none', fontWeight: 700, fontSize: '0.6rem' }}>OBTENIR MA CLÉ →</a>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {show && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5,6,10,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="animate-in" style={{ background: 'var(--card)', border: '1px solid var(--gold)', borderRadius: 24, padding: '2.5rem', maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 0 80px rgba(212,168,83,0.2)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 1.5rem', background: 'linear-gradient(135deg, var(--gold), var(--gold-bright))', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', boxShadow: '0 0 20px var(--gold-glow)' }}>⧡</div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.8rem', fontWeight: 900 }}>Besoin d'un coup de pouce ?</h2>
            <p style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              IRIS est un outil gratuit conçu pour t'aider à mieux comprendre comment ton CV est lu par les entreprises. On va t'aider à l'optimiser simplement.
            </p>

            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text3)', marginBottom: '12px', fontWeight: 700 }}>🛠️ Configuration des Clés API</div>
              <ApiGuide 
                id="groq" title="⚡ GROQ (Le plus rapide - Gratuit)" 
                steps={['Ouvre Groq Cloud', 'Connecte-toi', 'Crée une clé dans "API Keys"', 'Copie-la dans la barre latérale']}
                link="https://console.groq.com/keys" format="gsk_xxxx..." 
              />
              <ApiGuide 
                id="google" title="🔷 GOOGLE AI (Gemini - Gratuit)" 
                steps={['Ouvre Google AI Studio', 'Clique sur "Get API key"', 'Copie-la dans la barre latérale']}
                link="https://aistudio.google.com/app/apikey" format="AIzaSy..." 
              />
              <ApiGuide 
                id="mistral" title="🌊 MISTRAL AI (IA Française - Gratuit)" 
                steps={['Ouvre Mistral Console', 'Va dans "API Keys"', 'Copie-la dans la barre latérale']}
                link="https://console.mistral.ai/api-keys/" format="xxxxx..." 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={startDemo} style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-bright))', color: '#000', border: 'none', borderRadius: '12px', padding: '1.2rem', fontFamily: 'Space Mono, monospace', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 25px rgba(212, 168, 83, 0.5)' }}>🚀 DÉMARRER LA DÉMO COMPLÈTE</button>
              <button onClick={skip} style={{ background: 'transparent', color: 'var(--text3)', border: 'none', padding: '0.5rem', fontSize: '0.65rem', cursor: 'pointer' }}>Passer la visite</button>
            </div>
          </div>
        </div>
      )}

      {active && (
        <>
          <div ref={overlayRef} style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
            {rect && (
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                <defs><mask id="hole"><rect width="100%" height="100%" fill="white" /><rect x={rect.left - PAD} y={rect.top - PAD} width={rect.width + PAD * 2} height={rect.height + PAD * 2} rx={12} fill="black" /></mask></defs>
                <rect width="100%" height="100%" fill="rgba(5,6,10,0.85)" mask="url(#hole)" />
                <rect x={rect.left - PAD} y={rect.top - PAD} width={rect.width + PAD * 2} height={rect.height + PAD * 2} rx={12} fill="none" stroke="var(--gold)" strokeWidth={3} style={{ filter: 'drop-shadow(0 0 12px var(--gold-glow))' }} />
              </svg>
            )}
          </div>

          <div style={{ ...tooltipStyle(), background: 'var(--card)', border: '1px solid var(--gold)', borderRadius: 20, padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', pointerEvents: 'all' }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: '1.2rem' }}>
              {STEPS.map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? 'var(--gold)' : 'var(--border)', transition: 'background 0.3s' }} />)}
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: 'var(--text)', fontWeight: 800 }}>{STEPS[step].title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '1.5rem' }}>{STEPS[step].desc}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={prev} disabled={step === 0 || waiting} style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.6rem 1.2rem', fontSize: '0.6rem', cursor: (step === 0 || waiting) ? 'not-allowed' : 'pointer', opacity: (step === 0 || waiting) ? 0.4 : 1 }}>← Préc.</button>
              <button onClick={next} disabled={waiting} style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-bright))', color: '#000', border: 'none', borderRadius: 8, padding: '0.6rem 1.2rem', fontSize: '0.65rem', fontWeight: 800, cursor: waiting ? 'wait' : 'pointer' }}>
                {waiting ? 'Chargement...' : step === STEPS.length - 1 ? 'C\'est parti !' : 'Suivant →'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
