import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable } from '../utils/webgl';
import { sounds } from '../utils/soundFx';
import { 
  Award, ChevronLeft, ChevronRight, Compass, FileText, Globe, Heart, 
  MapPin, Play, Shield, Sparkles, Trophy, User, Video, Volume2, VolumeX, Zap 
} from 'lucide-react';

interface IntroCinematicProps {
  onProceedToCreation: () => void;
}

export const IntroCinematic: React.FC<IntroCinematicProps> = ({ onProceedToCreation }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [isWebGLEnabled, setIsWebGLEnabled] = useState<boolean>(() => isWebGLAvailable());
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const chapters = [
    {
      number: '01',
      tag: 'PHILOSOPHY & ROOTS',
      title: 'A Person Makes The Player',
      quote: '"A person makes the player, not a player makes the person. Football revolves around the human."',
      description: 'Your football journey begins far from the bright European lights—in the dusty cages, red dirt pitches, and humble neighborhood streets of your birthplace. Before you ever touch a million-pound contract, your family sacrifices, monthly remittances home, and moral discipline will forge the man within the athlete.',
      highlight: 'Family Roots · Remittances · Character Morale',
      icon: Heart,
      accentColor: 'from-amber-500 to-rose-500',
    },
    {
      number: '02',
      tag: 'PLAYER CREATION GUIDE',
      title: 'How To Go About Creating Your Player',
      quote: '"You build your legend from the ground up: your continent, your region, and your authentic heritage."',
      description: 'In the next screen, you will personally create your football persona. You will choose your continent (Africa, Europe, South America, North America, or Asia), navigate down into its geographic region (e.g. West Africa, Western Europe), and select your nation. Your dual nationality will NOT be chosen from a menu—it will arise completely naturally from ancestral lineage and real-world diaspora ties.',
      highlight: 'Continent → Region → Country → Natural Dual Heritage',
      icon: Compass,
      accentColor: 'from-emerald-500 to-teal-500',
      isGuide: true,
    },
    {
      number: '03',
      tag: 'IMMIGRATION & LAW',
      title: 'Passports, Visas & Bureaucracy',
      quote: '"You just don\'t travel because you want to travel. There are real legal processes to crossing international borders."',
      description: 'Foreign wonderkids face real-world immigration barriers. You must manage biometric passport validity, navigate the post-Brexit UK GBE points matrix, obtain Schengen athletic visas, and clear FIFA Article 19 under-18 transfer safeguards before competing in overseas leagues.',
      highlight: 'Biometric Passports · UK GBE Matrix · FIFA Article 19 Clearance',
      icon: Globe,
      accentColor: 'from-blue-500 to-cyan-500',
    },
    {
      number: '04',
      tag: 'BOARDROOM & TAXES',
      title: 'Real Contracts & Local Tax Residency',
      quote: '"Gross wage is just a headline. What matters is your net take-home under local country tax law."',
      description: 'Sign authentic multi-clause contracts with sporting directors featuring signing bonuses, buyout release clauses, and Ballon d\'Or wage bumps. Your weekly income is dynamically calculated under your club\'s local tax regime: 47% HMRC in England, 47% in Spain, 49% in France, 24% in Nigeria, or 0% tax-free haven in Saudi Arabia.',
      highlight: 'Club Country Tax Residency · Signing Bonuses · Buyout Clauses',
      icon: FileText,
      accentColor: 'from-purple-500 to-indigo-500',
    },
    {
      number: '05',
      tag: 'MATCHDAY & DESTINY',
      title: 'Tactical Pitch Battles & Generational Wealth',
      quote: '"70,000 roar under the floodlights. One split-second decision defines your destiny."',
      description: 'Control tactical match events, maintain locker room chemistry, handle post-match press conferences under media scrutiny, and invest your wealth across 50+ real-life assets: buy a family estate in your hometown, fund a medical academy, or collect hypercars.',
      highlight: 'Tactical Match Decisions · Media Press · 50+ Life Investments',
      icon: Trophy,
      accentColor: 'from-amber-500 to-emerald-500',
    },
  ];

  // 3D Rotating Golden Ball / Stadium Pedestal with Particle Sparkles
  useEffect(() => {
    if (!isWebGLEnabled) return;
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 340;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false });
    } catch {
      setIsWebGLEnabled(false);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.3, 3.2);
    camera.lookAt(0, 0.65, 0);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Dynamic Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const warmKeyLight = new THREE.DirectionalLight(0xf59e0b, 3.2); // Warm gold spotlight
    warmKeyLight.position.set(2.5, 4.5, 3.0);
    scene.add(warmKeyLight);

    const stadiumRimLight = new THREE.DirectionalLight(0x10b981, 2.8); // Emerald stadium floodlight
    stadiumRimLight.position.set(-2.5, 3.0, -2.5);
    scene.add(stadiumRimLight);

    // Group for Golden Ball & Trophy
    const group = new THREE.Group();
    scene.add(group);

    // Tier 1 Base: Dark Marble
    const baseGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.2, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2, metalness: 0.85 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0;
    group.add(base);

    // Tier 2: Gold Pedestal Ring
    const goldRingGeo = new THREE.CylinderGeometry(0.8, 0.85, 0.08, 32);
    const goldMat = new THREE.MeshStandardMaterial({ 
      color: 0xf59e0b, 
      metalness: 0.95, 
      roughness: 0.18 
    });
    const goldRing = new THREE.Mesh(goldRingGeo, goldMat);
    goldRing.position.y = 0.14;
    group.add(goldRing);

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.14, 0.22, 0.45, 16);
    const stem = new THREE.Mesh(stemGeo, goldMat);
    stem.position.y = 0.4;
    group.add(stem);

    // The Golden Match Ball
    const ballGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const ball = new THREE.Mesh(ballGeo, goldMat);
    ball.position.y = 1.0;
    group.add(ball);

    // Orbiting Emerald Rings
    const ringGeo = new THREE.TorusGeometry(0.72, 0.02, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.9, roughness: 0.2 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    ring1.position.y = 1.0;
    group.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.2 }));
    ring2.rotation.x = -Math.PI / 3.5;
    ring2.position.y = 1.0;
    group.add(ring2);

    // Floating Golden Dust Particles
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 2.8;
      particlePositions[i + 1] = Math.random() * 2.2;
      particlePositions[i + 2] = (Math.random() - 0.5) * 2.8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.035,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      group.rotation.y = elapsed * 0.4;
      ring1.rotation.z = elapsed * 0.6;
      ring2.rotation.y = elapsed * 0.5;
      ball.position.y = 1.0 + Math.sin(elapsed * 2.2) * 0.035;

      // Gentle floating particles
      particles.rotation.y = elapsed * 0.08;

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (renderer) {
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };
  }, [isWebGLEnabled]);

  const curr = chapters[activeChapter];
  const Icon = curr.icon;

  const handleNext = () => {
    sounds.playClick();
    if (activeChapter < chapters.length - 1) {
      setActiveChapter(c => c + 1);
    } else {
      sounds.playWhistle();
      onProceedToCreation();
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    if (activeChapter > 0) {
      setActiveChapter(c => c - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden font-sans select-none">
      {/* Background Stadium Glow & Atmospheric Sweep */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-emerald-500/12 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[450px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[300px] bg-blue-500/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between z-10 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-emerald-950">
            ⚽
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wider text-white">CAREER LEGEND</span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                Act I: The Prologue
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              REALISTIC FOOTBALLER CAREER SIMULATOR & PERSONA RPG
            </span>
          </div>
        </div>

        <button
          onClick={() => { sounds.playWhistle(); onProceedToCreation(); }}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer py-2 px-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 shadow-sm"
        >
          <span>Skip to Player Creation</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </header>

      {/* Center Stage Presentation */}
      <main className="max-w-6xl w-full mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Column: 3D Golden Ball / Stadium Visual */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-full h-[320px] md:h-[390px] bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-[#070b14] rounded-3xl border border-slate-800/90 shadow-2xl flex items-center justify-center overflow-hidden group">
            {isWebGLEnabled ? (
              <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-4xl shadow-xl shadow-amber-950/60 border-2 border-amber-200">
                  🏆
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-black text-white">THE BALLON D'OR PRODIGY</div>
                  <div className="text-xs text-amber-400 font-mono">From Grassroots to European Silverware</div>
                </div>
              </div>
            )}

            {/* Top Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-800/60 px-2.5 py-1 rounded-full backdrop-blur">
                ★ 3D Stadium & Trophy Engine
              </span>
            </div>

            {/* Bottom Interactive Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/90 backdrop-blur p-2.5 rounded-xl border border-slate-800/80 font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                FIFA & Legal Rules
              </span>
              <span className="text-amber-300 font-bold">Country Tax Residency</span>
            </div>
          </div>

          {/* Quick Step Indicators */}
          <div className="w-full grid grid-cols-2 gap-2 mt-3 text-center text-[10px] font-mono text-slate-400">
            <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-emerald-400 font-bold block">FIRST TO BE DISPLAYED</span>
              <span>Visual 3D & Story Overview</span>
            </div>
            <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-amber-400 font-bold block">SECOND TO BE DISPLAYED</span>
              <span>Continent → Region → Country</span>
            </div>
          </div>
        </div>

        {/* Right Column: Story & Philosophy Chapter */}
        <div className="lg:col-span-7 space-y-5">
          {/* Chapter Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {chapters.map((ch, idx) => (
              <button
                key={ch.number}
                onClick={() => { sounds.playClick(); setActiveChapter(idx); }}
                className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeChapter === idx
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{ch.number}</span>
                <span className="hidden sm:inline">{ch.tag}</span>
              </button>
            ))}
          </div>

          {/* Chapter Content Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl relative backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                <Icon className="w-4 h-4 text-emerald-400" />
                <span>Chapter {curr.number} · {curr.tag}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {activeChapter + 1} of {chapters.length}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
              {curr.title}
            </h2>

            <blockquote className="border-l-2 border-emerald-500 pl-4 text-xs md:text-sm text-emerald-300/90 italic font-serif">
              {curr.quote}
            </blockquote>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {curr.description}
            </p>

            {/* Special Highlight for Creation Guide (Chapter 2) */}
            {curr.isGuide && (
              <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 space-y-3">
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>The Creation Steps You Will Take Next:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <strong className="text-white block font-bold">1. Continent Breakdown</strong>
                    <span className="text-[11px] text-slate-400">Choose Africa, Europe, South America, North America, or Asia, then drill into its geographic region.</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <strong className="text-white block font-bold">2. Country & Natural Roots</strong>
                    <span className="text-[11px] text-slate-400">Select your nation. Dual nationality is never artificially picked—it emerges naturally from family diaspora!</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <strong className="text-white block font-bold">3. Identity & Position</strong>
                    <span className="text-[11px] text-slate-400">Name your player, pick your hometown cage, and select your tactical archetype (Poacher, Playmaker, Speed Demon).</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <strong className="text-white block font-bold">4. Launchpad & Local Taxes</strong>
                    <span className="text-[11px] text-slate-400">Sign your first pro scholarship. Your wages will follow the authentic tax rates of your club's country.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mechanics Highlight Box */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="text-slate-500">Core Simulation Systems:</span>
              <strong className="text-white truncate ml-2">{curr.highlight}</strong>
            </div>

            {/* Stepper Navigation */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                {chapters.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { sounds.playClick(); setActiveChapter(i); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      activeChapter === i ? 'bg-emerald-400 scale-125' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {activeChapter > 0 && (
                  <button
                    onClick={handlePrev}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}

                {activeChapter < chapters.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Next Chapter</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : null}

                <button
                  onClick={() => { sounds.playWhistle(); onProceedToCreation(); }}
                  className="flex-1 sm:flex-initial py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Create My Player (Step 2) →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Credits */}
      <footer className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500 font-mono z-10 border-t border-slate-800/80 pt-3">
        <div>
          FIFA Regulations Form 104-B · UK GBE Matrix · Global Tax Residency (HMRC, AEAT, ZATCA)
        </div>
        <div className="text-emerald-400 font-bold">
          Next Step: Continent → Region → Country Selection (Natural Diaspora)
        </div>
      </footer>
    </div>
  );
};
