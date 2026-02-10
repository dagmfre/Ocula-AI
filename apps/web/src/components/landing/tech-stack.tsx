"use client";

import { useRef, useState } from "react";
import { Cpu, Terminal, Zap, Globe, Sparkles } from "lucide-react";

export function TechStack() {
  const techs = [
    { name: "Gemini 3 Flash", icon: <Sparkles size={20} />, desc: "Agentic Vision Model" },
    { name: "LangChain", icon: <Terminal size={20} />, desc: "Orchestration" },
    { name: "Live API", icon: <Zap size={20} />, desc: "Real-time Voice" },
    { name: "Next.js 14", icon: <Globe size={20} />, desc: "App Router" },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto text-center">
        
        {/* Massive Badge */}
        <div className="inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-12">
          <div className="px-8 py-4 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center gap-4">
            <div className="text-gray-400 font-medium">Powering the next generation of SaaS</div>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 font-bold">
              <Cpu size={18} className="text-purple-400" />
              Gemini 3 Models
            </div>
          </div>
        </div>

        {/* Tech Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {techs.map((tech) => (
            <SpotlightCard key={tech.name}>
              <div className="relative z-10 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-brand-indigo group-hover:scale-110 transition-all mb-4 mx-auto border border-white/5">
                {tech.icon}
              </div>
              <h3 className="relative z-10 font-bold text-white mb-1">{tech.name}</h3>
              <p className="relative z-10 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{tech.desc}</p>
            </SpotlightCard>
          ))}
        </div>

      </div>
    </section>
  );
}

function SpotlightCard({ children }: { children: React.ReactNode }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative p-6 rounded-2xl bg-white/5 border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10"
    >
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(79, 70, 229, 0.15), transparent 40%)`
        }}
      />
      {children}
    </div>
  );
}
