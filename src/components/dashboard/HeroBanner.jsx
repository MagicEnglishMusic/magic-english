import React from 'react';
import { Play, Sparkles, Headphones, ArrowRight } from 'lucide-react';

export default function HeroBanner({ onContinue, onExplore }) {
  return (
    <section className="relative w-full h-[360px] sm:h-[380px] lg:h-[400px] overflow-hidden border-b border-purple-500/30 bg-[#070811] group select-none transition-all flex items-center">
      
      {/* 1. Background Artwork: Full-Width Student with Headphones & London Night Bokeh */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/hero-banner.png"
          alt="Magic English Student with Headphones"
          className="w-full h-full object-cover object-right md:object-center scale-100 group-hover:scale-[1.02] transition-transform duration-1000 ease-out"
        />

        {/* Precision cinematic gradient mask: deep dark on text side, crystal clear on student */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070811] via-[#070811]/90 via-45% to-transparent to-90%"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#070811]/90 via-transparent to-[#070811]/40"></div>
        <div className="absolute -top-16 -left-16 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 2. Inner Content Grid: Aligned with standard max-w-7xl container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 w-full h-full flex items-center justify-between">
        
        {/* Left Content Area: Generous Spacing & High-Contrast Typography */}
        <div className="max-w-xl flex flex-col justify-center h-full pr-4">
          
          {/* Badge */}
          <div className="mb-3 sm:mb-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/25 border border-purple-400/50 text-purple-200 text-xs font-bold tracking-wide backdrop-blur-md shadow-md shadow-purple-950/50">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>✨ Método Musical Exclusivo</span>
            </div>
          </div>

          {/* Título & Subtítulo */}
          <div className="space-y-1.5 mb-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
              Magic <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">English</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl font-bold text-purple-200/95 tracking-wide">
              “Cantar, repetir e dominar.”
            </p>
          </div>

          {/* Descrição */}
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-md mb-6 sm:mb-7">
            Aprenda inglês através de músicas e transforme seu sonho em realidade.
          </p>

          {/* Botões com espaçamento refinado */}
          <div className="flex flex-wrap items-center gap-3.5">
            {/* Botão Principal */}
            <button
              onClick={onContinue}
              className="flex items-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base shadow-[0_0_25px_rgba(168,85,247,0.55)] hover:shadow-[0_0_35px_rgba(168,85,247,0.75)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer border border-purple-300/30"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-3 h-3 fill-white text-white ml-0.5" />
              </div>
              <span>▶ Continuar aprendendo</span>
            </button>

            {/* Botão Secundário */}
            <button
              onClick={onExplore}
              className="flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-[#121526]/85 hover:bg-[#1a1f38] border border-slate-700/80 hover:border-purple-400/60 text-slate-200 hover:text-white text-sm font-semibold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
            >
              <span>Explorar catálogo</span>
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>

        {/* Floating "Música do Dia" & Visualizer Widget (Top Right) */}
        <div className="hidden md:flex items-center gap-3 self-start mt-6">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0c0e1e]/85 backdrop-blur-xl border border-purple-500/35 shadow-2xl shadow-purple-950/70 transition-all hover:border-purple-400/60 group/widget">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 text-white shadow-md shadow-purple-600/40">
              <Headphones className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0c0e1e] animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300">
                  Música do Dia
                </span>
              </div>
              <p className="text-xs font-bold text-white leading-tight">London Lights • Pop</p>
            </div>

            {/* Equalizer sound bars */}
            <div className="flex items-end gap-1 h-4 pl-2 border-l border-purple-500/30">
              <span className="w-1 bg-purple-400 rounded-full animate-pulse h-2"></span>
              <span className="w-1 bg-blue-400 rounded-full animate-bounce h-4" style={{ animationDelay: '120ms' }}></span>
              <span className="w-1 bg-cyan-300 rounded-full animate-bounce h-3" style={{ animationDelay: '250ms' }}></span>
              <span className="w-1 bg-purple-400 rounded-full animate-bounce h-4" style={{ animationDelay: '75ms' }}></span>
              <span className="w-1 bg-fuchsia-400 rounded-full animate-pulse h-2.5"></span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Bottom ambient neon line */}
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent"></div>
    </section>
  );
}
