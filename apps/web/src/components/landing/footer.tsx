"use client";

import Link from "next/link";
import { Command, Circle, Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#050505]">
      <div className="container px-4 md:px-6 py-12 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-indigo to-purple-600 flex items-center justify-center text-white font-bold text-xs">O</div>
              <span className="font-bold text-lg">Ocula</span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs">
              Agentic vision and voice guidance for the next generation of software.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-600 pt-4">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
                <Command size={10} />
                <span>K</span>
              </div>
              <span>to search documentation</span>
            </div>
          </div>

          {/* Links Column */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="#features" className="hover:text-brand-indigo transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="hover:text-brand-indigo transition-colors">How It Works</Link></li>
              <li><Link href="/sign-up" className="hover:text-brand-indigo transition-colors">Get Started</Link></li>
              <li><Link href="/sign-in" className="hover:text-brand-indigo transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="https://github.com/google-gemini/ocula" target="_blank" className="hover:text-brand-indigo transition-colors">GitHub</Link></li>
              <li><Link href="https://ai.google.dev/gemini-api/docs" target="_blank" className="hover:text-brand-indigo transition-colors">Gemini API Docs</Link></li>
              <li><Link href="https://docs.langchain.com" target="_blank" className="hover:text-brand-indigo transition-colors">LangChain Docs</Link></li>
              <li><Link href="/sign-up" className="hover:text-brand-indigo transition-colors">Request Demo</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <div>
            &copy; {new Date().getFullYear()} Ocula AI Inc. All rights reserved.
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-30 delay-150"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              </span>
              <span className="font-mono text-emerald-500">All Systems Operational</span>
            </div>
            
            <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
               <Activity size={14} />
               <span>v1.0.0-beta</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
