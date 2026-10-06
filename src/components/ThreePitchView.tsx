import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable } from '../utils/webgl';
import { Activity, Radio } from 'lucide-react';

interface ThreePitchViewProps {
  minute: number;
  isPaused: boolean;
}

export const ThreePitchView: React.FC<ThreePitchViewProps> = ({ minute, isPaused }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isWebGLEnabled, setIsWebGLEnabled] = useState<boolean>(() => isWebGLAvailable());

  useEffect(() => {
    if (!isWebGLEnabled) return;
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 260;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false });
    } catch (err) {
      console.warn('WebGL context could not be created for pitch view, using 2D tactical pitch:', err);
      setIsWebGLEnabled(false);
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080c14, 0.035);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 7.5, 9.5);
    camera.lookAt(0, 0, 0);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    mount.appendChild(renderer.domElement);

    // Floodlight Ambience
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const floodlightLeft = new THREE.SpotLight(0xffffff, 4.0);
    floodlightLeft.position.set(-10, 15, 10);
    floodlightLeft.angle = Math.PI / 4;
    floodlightLeft.penumbra = 0.4;
    scene.add(floodlightLeft);

    const floodlightRight = new THREE.SpotLight(0xa5f3fc, 3.5);
    floodlightRight.position.set(10, 15, -10);
    floodlightRight.angle = Math.PI / 4;
    scene.add(floodlightRight);

    // Green Grass Turf with Mown Stripes
    const pitchGroup = new THREE.Group();
    scene.add(pitchGroup);

    const pitchWidth = 16;
    const pitchLength = 11;
    const stripeWidth = 1.6;

    for (let x = -pitchWidth / 2; x < pitchWidth / 2; x += stripeWidth) {
      const isEven = Math.round(x / stripeWidth) % 2 === 0;
      const stripeGeo = new THREE.PlaneGeometry(stripeWidth, pitchLength);
      const stripeMat = new THREE.MeshStandardMaterial({
        color: isEven ? 0x166534 : 0x15803d,
        roughness: 0.85,
      });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x + stripeWidth / 2, 0, 0);
      stripe.receiveShadow = true;
      pitchGroup.add(stripe);
    }

    // Pitch White Markings
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Touchlines
    const outlineGeo = new THREE.RingGeometry(0.06, 0.08, 32);
    const centerCircle = new THREE.Mesh(outlineGeo, lineMat);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.scale.set(18, 18, 1);
    centerCircle.position.y = 0.01;
    pitchGroup.add(centerCircle);

    // Halfway line
    const halfLineGeo = new THREE.PlaneGeometry(0.08, pitchLength * 0.95);
    const halfLine = new THREE.Mesh(halfLineGeo, lineMat);
    halfLine.rotation.x = -Math.PI / 2;
    halfLine.position.y = 0.01;
    pitchGroup.add(halfLine);

    // Goals (Left & Right)
    const goalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 });
    const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 12);
    const crossbarGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.6, 12);

    const createGoal = (posX: number, rotY: number) => {
      const goal = new THREE.Group();
      const p1 = new THREE.Mesh(postGeo, goalMat);
      p1.position.set(0, 0.6, -1.3);
      const p2 = new THREE.Mesh(postGeo, goalMat);
      p2.position.set(0, 0.6, 1.3);
      const bar = new THREE.Mesh(crossbarGeo, goalMat);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(0, 1.2, 0);
      goal.add(p1, p2, bar);
      goal.position.set(posX, 0, 0);
      goal.rotation.y = rotY;
      return goal;
    };

    pitchGroup.add(createGoal(-7.2, Math.PI / 2));
    pitchGroup.add(createGoal(7.2, -Math.PI / 2));

    // Live Ball on the pitch
    const ballGeo = new THREE.SphereGeometry(0.14, 20, 20);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    ball.position.set(0, 0.14, 0);
    scene.add(ball);

    // Light Glow around ball
    const ballLight = new THREE.PointLight(0xa7f3d0, 1.5, 4);
    ballLight.position.set(0, 0.5, 0);
    ball.add(ballLight);

    // Animation Loop
    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Ball moves across pitch following match minute
      if (!isPaused) {
        ball.position.x = Math.sin(elapsed * 1.5) * 4.5;
        ball.position.z = Math.cos(elapsed * 1.2) * 2.5;
        ball.position.y = 0.14 + Math.abs(Math.sin(elapsed * 4)) * 0.25; // bounce
        ball.rotation.x += 0.05;
        ball.rotation.z += 0.05;
      }

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

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
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };
  }, [minute, isPaused, isWebGLEnabled]);

  // If WebGL is not available, render a 2D Tactical Broadcast Pitch
  if (!isWebGLEnabled) {
    // Ball position calculates dynamically based on current match minute
    const ballPercentX = Math.round(50 + Math.sin(minute * 0.4) * 38);
    const ballPercentY = Math.round(50 + Math.cos(minute * 0.6) * 32);

    return (
      <div className="relative w-full h-[220px] md:h-[260px] bg-gradient-to-b from-[#080c14] via-emerald-950 to-slate-950 rounded-2xl border-2 border-emerald-900 overflow-hidden shadow-2xl p-3 flex flex-col justify-between select-none">
        {/* Top Broadcast HUD */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded backdrop-blur border border-emerald-800/40 text-[11px] font-mono text-emerald-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Tactical 2D Pitch Feed · Radar</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded backdrop-blur border border-slate-800 text-[11px] font-mono text-slate-300">
            <span>Match Clock: <strong>{minute}'</strong></span>
          </div>
        </div>

        {/* Pitch Graphic Representation */}
        <div className="relative w-full h-[150px] md:h-[180px] my-auto rounded-xl border-2 border-white/40 overflow-hidden shadow-inner flex items-center justify-center bg-[#15803d]">
          {/* Alternating Grass Stripes */}
          <div className="absolute inset-0 flex">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <div 
                key={i} 
                className={`flex-1 h-full ${i % 2 === 0 ? 'bg-emerald-700/30' : 'bg-emerald-600/10'}`} 
              />
            ))}
          </div>

          {/* Halfway Line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 -translate-x-1/2" />

          {/* Center Circle */}
          <div className="absolute w-20 h-20 rounded-full border-2 border-white/40 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>

          {/* Left Penalty Box */}
          <div className="absolute left-0 top-1/4 bottom-1/4 w-16 border-y-2 border-r-2 border-white/40" />
          <div className="absolute left-0 top-1/3 bottom-1/3 w-8 border-y-2 border-r-2 border-white/30" />

          {/* Right Penalty Box */}
          <div className="absolute right-0 top-1/4 bottom-1/4 w-16 border-y-2 border-l-2 border-white/40" />
          <div className="absolute right-0 top-1/3 bottom-1/3 w-8 border-y-2 border-l-2 border-white/30" />

          {/* Animated Ball Indicator */}
          <div 
            className="absolute w-4 h-4 bg-white rounded-full shadow-lg border border-slate-900 transition-all duration-700 ease-out flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${ballPercentX}%`,
              top: `${ballPercentY}%`,
              boxShadow: '0 0 12px 3px rgba(52, 211, 153, 0.8)',
            }}
          >
            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
          </div>
        </div>

        {/* Bottom Status Feed */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono z-10 px-1">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Ball Coordinates: X:{ballPercentX}m Y:{ballPercentY}m</span>
          </div>
          <span className="text-emerald-400/80">Broadcasting Match Atmosphere</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[220px] md:h-[260px] bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 rounded-2xl border-2 border-emerald-900 overflow-hidden shadow-2xl">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-3 left-4 text-[11px] font-mono text-emerald-300 bg-slate-950/80 px-2.5 py-1 rounded backdrop-blur border border-emerald-800/40">
        3D Stadium Engine · Floodlight Camera View
      </div>
    </div>
  );
};
