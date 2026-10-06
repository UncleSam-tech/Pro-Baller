import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Club, Player } from '../types/game';
import { isWebGLAvailable } from '../utils/webgl';
import { Award, RotateCw, Shield, Sparkles, User, Zap } from 'lucide-react';

interface ThreePlayerAvatarProps {
  player: Player;
  club: Club;
}

export const ThreePlayerAvatar: React.FC<ThreePlayerAvatarProps> = ({ player, club }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [isWebGLEnabled, setIsWebGLEnabled] = useState<boolean>(() => isWebGLAvailable());
  const [kitView, setKitView] = useState<'front' | 'back'>('back');

  useEffect(() => {
    if (!isWebGLEnabled) return;
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 380;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false });
    } catch (err) {
      console.warn('WebGL context could not be created, using 2D avatar representation:', err);
      setIsWebGLEnabled(false);
      return;
    }

    // 1. Scene, Camera
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.3, 3.4);
    camera.lookAt(0, 1.1, 0);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // 2. Lighting (Stadium floodlight feel)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.5);
    rimLight.position.set(-2, 3, -2);
    scene.add(rimLight);

    // 3. Player Group Assembly
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    // Color conversion
    const kitColor = new THREE.Color(club.primaryColor);
    const shortsColor = new THREE.Color(club.secondaryColor || '#ffffff');
    const skinColor = new THREE.Color(
      player.nationality === 'Nigeria' ? 0x4a2c11 : 
      player.nationality === 'Brazil' || player.nationality === 'Spain' ? 0xd49b6a : 
      0xf5c396
    );

    // Pedestal / Grass Turf Base
    const baseGeo = new THREE.CylinderGeometry(1.0, 1.1, 0.12, 32);
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0x15803d, 
      roughness: 0.8,
      metalness: 0.1 
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.06;
    base.receiveShadow = true;
    playerGroup.add(base);

    // Torso / Jersey
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.72, 0.28);
    const jerseyMat = new THREE.MeshStandardMaterial({ 
      color: kitColor, 
      roughness: 0.6,
      metalness: 0.1 
    });
    const torso = new THREE.Mesh(torsoGeo, jerseyMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    playerGroup.add(torso);

    // Head & Hair
    const headGeo = new THREE.SphereGeometry(0.18, 24, 24);
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.86;
    head.castShadow = true;
    playerGroup.add(head);

    // Hair Top
    const hairGeo = new THREE.SphereGeometry(0.185, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2.2);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.88;
    playerGroup.add(hair);

    // Shorts
    const shortsGeo = new THREE.BoxGeometry(0.52, 0.35, 0.26);
    const shortsMat = new THREE.MeshStandardMaterial({ color: shortsColor, roughness: 0.7 });
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.y = 0.92;
    shorts.castShadow = true;
    playerGroup.add(shorts);

    // Left & Right Legs (Socks in kit color)
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 16);
    const sockMat = new THREE.MeshStandardMaterial({ color: kitColor, roughness: 0.7 });

    const leftLeg = new THREE.Mesh(legGeo, sockMat);
    leftLeg.position.set(-0.16, 0.44, 0);
    leftLeg.castShadow = true;
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, sockMat);
    rightLeg.position.set(0.16, 0.44, 0);
    rightLeg.castShadow = true;
    playerGroup.add(rightLeg);

    // Boots (Neon or sleek modern football boots)
    const bootGeo = new THREE.BoxGeometry(0.11, 0.1, 0.24);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });

    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.16, 0.06, 0.04);
    playerGroup.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.16, 0.06, 0.04);
    playerGroup.add(rightBoot);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.6, 16);
    const leftArm = new THREE.Mesh(armGeo, jerseyMat);
    leftArm.position.set(-0.36, 1.25, 0);
    leftArm.rotation.z = 0.2;
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, jerseyMat);
    rightArm.position.set(0.36, 1.25, 0);
    rightArm.rotation.z = -0.2;
    playerGroup.add(rightArm);

    // Official Match Ball on the turf
    const ballGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0.35, 0.12, 0.35);
    ball.castShadow = true;
    playerGroup.add(ball);

    // 4. Interactive Mouse Drag Controls
    let isDragging = false;
    let previousMouseX = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouseX;
      playerGroup.rotation.y += deltaX * 0.01;
      previousMouseX = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 5. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle idle breathing and rotation
      torso.position.y = 1.35 + Math.sin(elapsedTime * 2.2) * 0.012;
      head.position.y = 1.86 + Math.sin(elapsedTime * 2.2) * 0.014;

      if (!isDragging && isRotating) {
        playerGroup.rotation.y += 0.006;
      }

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mount || !renderer) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };
  }, [player, club, isRotating, isWebGLEnabled]);

  // If WebGL is not supported in the user's browser/environment, show a stunning 2D Kit & Card Showcase
  if (!isWebGLEnabled) {
    return (
      <div className="relative w-full h-[360px] bg-gradient-to-b from-slate-900 via-slate-950 to-[#080c14] rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col items-center justify-between p-6 shadow-2xl">
        {/* Top Header Card */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-md border border-white/20"
              style={{ backgroundColor: club.primaryColor }}
            >
              #{player.jerseyNumber}
            </div>
            <div>
              <div className="text-xs font-black text-white tracking-wide">
                {player.firstName} {player.lastName}
              </div>
              <div className="text-[10px] text-slate-400">
                {club.name} · {player.position}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-800 text-[10px] text-amber-400 font-mono font-bold">
            <Award className="w-3 h-3 text-amber-400" />
            <span>{player.overallRating} OVR</span>
          </div>
        </div>

        {/* Central Official Kit Render */}
        <div className="relative flex flex-col items-center justify-center my-auto">
          {/* Glowing Turf Disc Under Player Kit */}
          <div className="absolute w-44 h-8 bg-emerald-500/20 rounded-full blur-md -bottom-2" />
          
          {/* Styled Jersey Graphic */}
          <div 
            onClick={() => setKitView(v => v === 'back' ? 'front' : 'back')}
            className="relative w-44 h-48 rounded-2xl p-4 flex flex-col items-center justify-center text-white cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-xl select-none"
            style={{
              background: `linear-gradient(135deg, ${club.primaryColor} 0%, ${club.secondaryColor || '#0a0f1d'} 100%)`,
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            {/* Jersey Neck & Collar */}
            <div className="w-14 h-4 bg-slate-950/40 rounded-b-full border-b border-white/20 mb-2" />

            {kitView === 'back' ? (
              <>
                {/* Back Nameplate */}
                <div className="text-xs font-black tracking-widest uppercase font-mono drop-shadow-md">
                  {player.lastName}
                </div>
                {/* Big Squad Number */}
                <div className="text-5xl font-black font-mono tracking-tight my-1 drop-shadow-lg text-white">
                  {player.jerseyNumber}
                </div>
                {/* League / Club Patch */}
                <div className="text-[9px] uppercase tracking-wider text-white/80 font-bold bg-black/30 px-2 py-0.5 rounded-full mt-1 border border-white/10">
                  {club.league}
                </div>
              </>
            ) : (
              <>
                {/* Front Sponsor & Crest */}
                <div className="flex items-center justify-between w-full px-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold border border-white/30">
                    ⚽
                  </div>
                  <div className="text-[10px] font-bold text-white/80 uppercase">
                    PRO
                  </div>
                </div>
                <div className="text-2xl font-black font-mono tracking-tight my-2 text-white/95">
                  #{player.jerseyNumber}
                </div>
                <div className="text-[10px] tracking-widest uppercase font-black bg-white/15 px-3 py-1 rounded text-white border border-white/20">
                  {club.shortName}
                </div>
              </>
            )}

            {/* Click to Flip Prompt */}
            <div className="absolute bottom-1.5 flex items-center gap-1 text-[8px] text-white/70">
              <RotateCw className="w-2.5 h-2.5" />
              <span>Click to view {kitView === 'back' ? 'front' : 'back'}</span>
            </div>
          </div>
        </div>

        {/* Footer Vitals Bar */}
        <div className="w-full flex items-center justify-between text-[11px] pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-3 text-slate-400">
            <span><strong>{player.heightCm}</strong> cm</span>
            <span>·</span>
            <span><strong>{player.weightKg}</strong> kg</span>
            <span>·</span>
            <span className="capitalize">{player.preferredFoot} Foot</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
              {player.archetype}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[360px] bg-gradient-to-b from-slate-900 via-slate-950 to-[#080c14] rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center shadow-2xl">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Overlay Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <div 
          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-md border border-white/20"
          style={{ backgroundColor: club.primaryColor }}
        >
          #{player.jerseyNumber}
        </div>
        <span className="text-xs font-bold text-white bg-slate-900/80 px-2.5 py-1 rounded-md backdrop-blur border border-slate-800">
          {player.firstName} {player.lastName}
        </span>
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <button
          onClick={() => setIsRotating(r => !r)}
          className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 hover:text-white cursor-pointer transition-colors"
        >
          {isRotating ? 'Pause Spin' : 'Resume Spin'}
        </button>
      </div>

      <div className="absolute bottom-3 left-3 text-[10px] text-slate-500 font-mono pointer-events-none">
        Drag to rotate 3D footballer
      </div>
    </div>
  );
};
