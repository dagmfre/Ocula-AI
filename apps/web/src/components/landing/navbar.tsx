"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Github, Menu, X, ArrowUpRight } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(Number(scroll));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "py-4" : "py-6"
      }`}
    >
      <div className="container px-4 md:px-6 mx-auto relative">
        <div 
          className={`relative flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300 overflow-hidden ${
            scrolled 
              ? "bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20" 
              : "bg-transparent border border-transparent"
          }`}
        >
          {/* Scroll Progress Line (Only visible when scrolled) */}
          {scrolled && (
            <div 
              className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-brand-indigo to-transparent opacity-50"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group relative z-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-indigo to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] group-hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-shadow">
              O
            </div>
            <span className="font-bold text-lg tracking-tight">Ocula</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-indigo transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="https://github.com/google-gemini/ocula"
              target="_blank"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all group"
            >
              <Github size={16} />
              <span>Star</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded-md text-xs font-mono group-hover:bg-white/20 transition-colors">1.2k</span>
            </Link>
            
            <Link
              href="/sign-in"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            
            <Link
              href="/sign-up"
              className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              Get Started <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 p-4 md:hidden animate-fade-in-up">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-lg font-medium text-gray-300 hover:text-brand-indigo px-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="h-px bg-white/10 w-full my-2" />
            <Link
              href="/sign-in"
              className="text-lg font-medium text-gray-300 px-2"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-3 rounded-xl bg-brand-indigo text-center text-white font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
