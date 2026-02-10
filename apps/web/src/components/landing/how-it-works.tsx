"use client";

import { useRef, useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scanPosition, setScanPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate how far we've scrolled into the container (0 to 1)
      const progress = 1 - (rect.bottom - viewportHeight) / (rect.height + viewportHeight);
      const clamped = Math.max(0, Math.min(1, progress));
      setScanPosition(clamped * 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="how-it-works" className="py-32 relative bg-brand-charcoal overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          {/* Content */}
          <div className="lg:w-1/2 space-y-8">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-indigo/10 text-brand-indigo text-xs font-mono uppercase tracking-wider">
               <span className="w-2 h-2 rounded-full bg-brand-indigo animate-pulse"></span>
               How It Works
             </div>
             <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
               From screenshot to <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-indigo to-purple-400">semantic understanding</span>
             </h2>
             <p className="text-xl text-gray-400">
               Ocula uses Gemini 3's agentic vision to analyze your interface frame-by-frame, turning pixels into actionable accessibility trees in real-time.
             </p>
             
             <div className="space-y-6 pt-8">
               <Step number="1" title="Inject Widget" desc="Add the script tag to your dashboard." />
               <Step number="2" title="Define Tools" desc="Agent automatically maps clickable elements." />
               <Step number="3" title="Guide Users" desc="AI provides voice & visual assistance instantly." />
             </div>
          </div>

          {/* X-Ray Visual */}
          <div ref={containerRef} className="lg:w-1/2 relative h-[600px] w-full max-w-lg mx-auto">
            {/* The base screenshot (Normal UI) */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#111]">
              <div className="h-full w-full p-6 flex flex-col gap-4">
                <div className="h-8 w-1/3 bg-gray-700/50 rounded-lg"></div>
                <div className="flex gap-4 h-full">
                  <div className="w-1/4 h-full bg-gray-800/50 rounded-lg"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-32 bg-gray-700/30 rounded-lg"></div>
                    <div className="h-32 bg-gray-700/30 rounded-lg"></div>
                    <div className="h-32 bg-gray-700/30 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* The X-Ray scan line container */}
            <div 
              className="absolute inset-x-0 top-0 overflow-hidden rounded-2xl border-x border-t border-brand-indigo shadow-[0_0_50px_rgba(79,70,229,0.3)] bg-[#050505] transition-all duration-100 ease-linear z-10"
              style={{ height: `${scanPosition}%` }}
            >
               {/* Inside the scan: Wireframe / Code View */}
               <div className="h-[600px] w-full p-6 flex flex-col gap-4 relative">
                 <div className="absolute top-0 inset-x-0 h-px bg-brand-indigo shadow-[0_0_20px_#4f46e5]"></div>
                 
                 <div className="h-8 w-1/3 border border-brand-indigo/50 bg-brand-indigo/10 rounded-lg flex items-center justify-center">
                   <span className="text-xs font-mono text-brand-indigo">h1.dashboard-title</span>
                 </div>
                 <div className="flex gap-4 h-full">
                   <div className="w-1/4 h-full border border-dashed border-purple-500/30 rounded-lg relative">
                     <span className="absolute top-2 left-2 text-[10px] font-mono text-purple-400">nav.sidebar</span>
                   </div>
                   <div className="flex-1 space-y-4">
                     {[1,2,3].map(i => (
                       <div key={i} className="h-32 border border-brand-indigo/30 bg-brand-indigo/5 rounded-lg relative flex items-center justify-center">
                         <div className="absolute top-0 right-0 p-1">
                           <div className="text-[10px] font-mono text-gray-500">{`{ accessible: true }`}</div>
                         </div>
                         <div className="text-xs font-mono text-brand-indigo">div.card-metric-{i}</div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            </div>

            {/* Scan Line Laser */}
            <div 
              className="absolute left-[-10%] right-[-10%] h-1 bg-brand-indigo blur-[2px] z-20 shadow-[0_0_20px_#4f46e5] pointer-events-none"
              style={{ top: `${scanPosition}%` }}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-indigo/20 flex items-center justify-center text-brand-indigo font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-gray-400 text-sm">{desc}</p>
      </div>
    </div>
  );
}
