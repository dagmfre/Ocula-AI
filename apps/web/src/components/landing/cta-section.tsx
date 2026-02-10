"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden flex items-center justify-center">
      {/* Warp Speed Background (CSS Radial) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-indigo/20 via-[#050505] to-[#050505] z-0 pointer-events-none" />
      
      {/* Stars/Dust */}
      <div className="absolute inset-0 z-0 opacity-50">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse [animation-delay:1s]"></div>
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse [animation-delay:0.5s]"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-indigo/10 text-brand-indigo text-xs font-mono border border-brand-indigo/20">
            <Sparkles size={12} />
            <span>Ready for production</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
            Build the future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-indigo to-purple-400 text-glow">
              Guided SaaS
            </span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-xl mx-auto">
            Get your API key today and start embedding agentic vision into your application.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
             <Link href="/sign-up" className="group relative px-8 py-4 rounded-full bg-white text-black font-bold overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] no-underline">
               <span className="relative z-10 flex items-center gap-2">
                 Get Early Access <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
               </span>
             </Link>
             
             <Link href="#features" className="px-8 py-4 rounded-full glass text-white font-medium hover:bg-white/10 transition-all no-underline">
               Explore Features
             </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
