"use client";

import { useRef, useState, useEffect } from "react";
import { MousePointer2, Mic, Lock, Zap, Eye, Database } from "lucide-react";

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-brand-indigo/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Live Developer Tools</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to build agentic experiences, available as simple primitives.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[400px]">
          
          {/* Tile 1: Vision (Interactive Cursor) */}
          <VisionTile />
          
          {/* Tile 2: Voice (Audio Visualizer) */}
          <VoiceTile />
          
          {/* Tile 3: Auth (Schema) */}
          <AuthTile />
          
        </div>
      </div>
    </section>
  );
}

function VisionTile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="glass rounded-3xl p-6 relative overflow-hidden group cursor-none hover:border-brand-indigo/30 transition-colors"
    >
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-brand-indigo/10 p-2 rounded-lg inline-block mb-3">
          <Eye className="w-6 h-6 text-brand-indigo" />
        </div>
        <h3 className="text-2xl font-bold mb-1">Agentic Vision</h3>
        <p className="text-sm text-gray-400">Real-time DOM analysis & visual grounding</p>
      </div>

      {/* Mock Interface */}
      <div className="absolute inset-0 top-[120px] px-6">
        <div className="w-full h-full bg-[#111] rounded-t-xl border border-white/10 p-4 space-y-4">
          <div 
            onMouseEnter={() => setHoveredElement("div.header")}
            onMouseLeave={() => setHoveredElement(null)}
            className="h-12 w-full bg-white/5 rounded-lg border border-dashed border-white/5 hover:border-brand-indigo/50 transition-colors flex items-center px-4"
          >
            <div className="w-24 h-3 bg-white/20 rounded-full" />
          </div>
          <div className="flex gap-4">
            <div 
              onMouseEnter={() => setHoveredElement("div.sidebar")}
              onMouseLeave={() => setHoveredElement(null)}
              className="w-1/4 h-32 bg-white/5 rounded-lg border border-dashed border-white/5 hover:border-brand-indigo/50 transition-colors" 
            />
            <div 
              onMouseEnter={() => setHoveredElement("div.content")}
              onMouseLeave={() => setHoveredElement(null)}
              className="flex-1 h-32 bg-white/5 rounded-lg border border-dashed border-white/5 hover:border-brand-indigo/50 transition-colors p-4 space-y-2"
            >
              <div className="w-3/4 h-3 bg-white/10 rounded-full" />
              <div className="w-1/2 h-3 bg-white/10 rounded-full" />
              <div 
                onMouseEnter={(e) => {
                  e.stopPropagation(); 
                  setHoveredElement("button.submit-btn");
                }}
                onMouseLeave={() => setHoveredElement("div.content")}
                className="mt-4 px-4 py-2 bg-brand-indigo/20 rounded-md inline-block border border-brand-indigo/30"
              >
                <span className="text-xs text-brand-indigo">Submit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cursor & Label */}
      <div 
        className="absolute w-8 h-8 pointer-events-none z-20 transition-all duration-100 ease-out mix-blend-difference"
        style={{ 
          transform: `translate(${cursorPos.x - 16}px, ${cursorPos.y - 16}px) scale(${hoveredElement ? 1.2 : 1})` 
        }}
      >
        <div className={`w-full h-full rounded-full border-2 border-brand-indigo bg-brand-indigo/20 ${hoveredElement ? 'animate-none scale-110' : 'animate-pulse'}`} />
      </div>

      {hoveredElement && (
        <div 
          className="absolute pointer-events-none z-20 bg-black/80 backdrop-blur text-xs font-mono px-2 py-1 rounded border border-brand-indigo/50 text-brand-indigo"
          style={{ transform: `translate(${cursorPos.x + 20}px, ${cursorPos.y}px)` }}
        >
          {hoveredElement}
        </div>
      )}
    </div>
  );
}

function VoiceTile() {
  const [bars, setBars] = useState<number[]>([10, 20, 15, 30, 25, 40, 35, 20, 15, 10]);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!isHovering) return;
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 50 + 10));
    }, 100);
    return () => clearInterval(interval);
  }, [isHovering]);

  return (
    <div 
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setBars([10, 20, 15, 30, 25, 40, 35, 20, 15, 10]);
      }}
      className="glass rounded-3xl p-6 relative overflow-hidden group hover:border-brand-indigo/30 transition-colors"
    >
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-brand-indigo/10 p-2 rounded-lg inline-block mb-3">
          <Mic className="w-6 h-6 text-brand-indigo" />
        </div>
        <h3 className="text-2xl font-bold mb-1">Live Voice API</h3>
        <p className="text-sm text-gray-400">Sub-100ms latency voice interaction</p>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1/2 flex items-center justify-center gap-1.5 pb-12">
        {bars.map((height, i) => (
          <div 
            key={i}
            className="w-2 bg-gradient-to-t from-brand-indigo to-purple-400 rounded-full transition-all duration-100"
            style={{ height: `${height}%`, opacity: isHovering ? 1 : 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}

function AuthTile() {
  return (
    <div className="glass rounded-3xl p-6 relative overflow-hidden group hover:border-brand-indigo/30 transition-colors lg:row-span-1">
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-brand-indigo/10 p-2 rounded-lg inline-block mb-3">
          <Lock className="w-6 h-6 text-brand-indigo" />
        </div>
        <h3 className="text-2xl font-bold mb-1">Secure Auth</h3>
        <p className="text-sm text-gray-400">Better-Auth + Google OAuth integration</p>
      </div>

      <div className="absolute inset-0 top-[100px] flex items-center justify-center pointer-events-none">
        <div className="relative w-full h-full p-8 flex items-center justify-around">
          {/* Nodes */}
          <div className="flex flex-col gap-12 w-full">
            <div className="flex justify-center gap-16">
              <Node icon={<Database size={16} />} label="User" />
              <Node icon={<Zap size={16} />} label="Session" />
            </div>
            <div className="flex justify-center">
              <Node icon={<Lock size={16} />} label="OAuth" active />
            </div>
          </div>
          
          {/* Connecting Lines (Simplified with CSS) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
            <path d="M150 150 L 250 250" stroke="url(#gradient-line)" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_10s_linear_infinite]" />
            <path d="M350 150 L 250 250" stroke="url(#gradient-line)" strokeWidth="2" strokeDasharray="5,5" />
            <defs>
              <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

function Node({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`
      flex items-center gap-2 px-4 py-2 rounded-full border 
      ${active ? 'bg-brand-indigo/20 border-brand-indigo text-brand-indigo shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-white/5 border-white/10 text-gray-400'}
    `}>
      {icon}
      <span className="text-sm font-mono">{label}</span>
    </div>
  );
}
