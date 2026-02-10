"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Terminal, Copy, Check, Play } from "lucide-react";

export function HeroSection() {
  const [copied, setCopied] = useState(false);
  const [typedLines, setTypedLines] = useState<string[]>([]);
  
  const codeLines = [
    "import { Ocula } from '@ocula/sdk';",
    "",
    "const ocula = new Ocula({",
    "  apiKey: process.env.OCULA_KEY,",
    "  capabilities: ['vision', 'voice']",
    "});",
    "",
    "await ocula.connect();",
    "// AI is now seeing and guiding..."
  ];

  useEffect(() => {
    let currentLine = 0;
    let currentChar = 0;
    let timeoutId: NodeJS.Timeout;

    const typeCode = () => {
      if (currentLine >= codeLines.length) return;

      const lineContent = codeLines[currentLine];
      
      if (currentChar <= lineContent.length) {
        setTypedLines(prev => {
          const newLines = [...prev];
          if (!newLines[currentLine]) newLines[currentLine] = "";
          newLines[currentLine] = lineContent.substring(0, currentChar);
          return newLines;
        });
        currentChar++;
        timeoutId = setTimeout(typeCode, 30 + Math.random() * 30);
      } else {
        currentLine++;
        currentChar = 0;
        timeoutId = setTimeout(typeCode, 100);
      }
    };

    // Initialize empty lines
    setTypedLines(new Array(codeLines.length).fill(""));
    
    // Start typing after delay
    timeoutId = setTimeout(typeCode, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText("npm install @ocula/sdk");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
      {/* Neural Nebula Background */}
      <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-brand-indigo/20 blur-[120px] rounded-full animate-pulse-glow pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-charcoal blur-[100px] rounded-full pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
        
        {/* Floating Badge */}
        <div className="animate-fade-in-up opacity-0 [animation-delay:200ms] mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm text-gray-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-indigo opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-indigo"></span>
          </span>
          Gemini 3 Powered Agentic Vision
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up opacity-0 [animation-delay:400ms] max-w-4xl text-4xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1] selection:bg-brand-indigo/50">
          AI that <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-indigo via-purple-400 to-indigo-400 animate-gradient-x">Sees</span>, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">Speaks</span>, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-brand-indigo to-pink-400">Guides</span>.
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in-up opacity-0 [animation-delay:600ms] max-w-2xl text-lg md:text-xl text-gray-400 mb-10 leading-relaxed px-4 text-balance">
          Embed agentic vision and real-time voice guidance into your SaaS in just 4 lines of code. Turn any interface into an intelligent, guided experience.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up opacity-0 [animation-delay:800ms] flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/sign-up" className="group relative px-8 py-3.5 rounded-full bg-brand-indigo text-white font-medium overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95 no-underline">
            <span className="relative z-10 flex items-center gap-2">
              Get Started Free <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-indigo via-purple-500 to-brand-indigo opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
          
          <Link href="#features" className="group px-8 py-3.5 rounded-full glass hover:bg-white/5 text-white font-medium transition-all hover:border-brand-indigo/50 hover:text-brand-indigo hover:scale-105 active:scale-95 no-underline">
            See Features
          </Link>
        </div>

        {/* Terminal-in-Glass */}
        <div className="animate-float animate-fade-in-up opacity-0 [animation-delay:1000ms] relative w-full max-w-3xl mx-auto perspective-[1000px]">
          <div className="relative glass rounded-xl overflow-hidden shadow-2xl border border-white/10 group transform transition-transform duration-500 hover:rotate-x-2 hover:scale-[1.01]">
            
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                <Terminal size={12} />
                <span>install-ocula.bash</span>
              </div>
              <div className="w-12" /> {/* Spacer */}
            </div>

            {/* Terminal Body */}
            <div className="p-6 text-left font-mono text-sm md:text-base relative min-h-[300px] bg-[#0A0A0A]/80">
              {typedLines.map((line, i) => (
                <div key={i} className="min-h-[1.5em] text-gray-300">
                  <span className="text-purple-400">{i + 1}</span>
                  <span className="mx-4 text-gray-600">|</span>
                  <span dangerouslySetInnerHTML={{ 
                    __html: line
                      .replace(/import|from|const|new|await/g, '<span class="text-brand-indigo">$&</span>')
                      .replace(/'[^']*'/g, '<span class="text-green-400">$&</span>')
                      .replace(/\/\/.*/g, '<span class="text-gray-500">$&</span>')
                  }} />
                  {/* Cursor */}
                  {i === typedLines.findIndex((l, index) => l.length < codeLines[index].length) && (
                    <span className="inline-block w-2 h-4 bg-brand-indigo ml-1 animate-pulse" />
                  )}
                </div>
              ))}
            </div>

            {/* Copy Command */}
            <div className="absolute top-4 right-4 animate-fade-in-up opacity-0 [animation-delay:1500ms]">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors border border-white/5"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {copied ? "Copied!" : "npm i @ocula/sdk"}
              </button>
            </div>
          </div>
          
          {/* Reflection Effect */}
          <div className="absolute -bottom-8 left-4 right-4 h-8 bg-gradient-to-b from-brand-indigo/10 to-transparent blur-xl rounded-full opacity-50 transform scale-x-90" />
        </div>

      </div>
    </section>
  );
}
