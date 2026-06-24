"use client";
import { useState, useEffect } from "react";

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const targetText = "10XWORKFORCE.AI";

  useEffect(() => {
    let iteration = 0;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    
    const interval = setInterval(() => {
      setDecryptedText(
        targetText
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return targetText[index];
            }
            return letters[Math.floor(Math.random() * letters.length)];
          })
          .join("")
      );

      if (iteration >= targetText.length) {
        clearInterval(interval);
        setTimeout(() => setFadeOut(true), 1300); 
        setTimeout(() => setShowSplash(false), 1800); 
      }

      iteration += 1 / 3;
    }, 40);

    return () => clearInterval(interval);
  }, []);

  if (!showSplash) return null;

  return (
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950 transition-opacity duration-500 pointer-events-none ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        <div className="relative w-full max-w-lg flex flex-col items-center">
          {/* Sophisticated Orbital Node Animation */}
          <div className="relative w-24 h-24 mb-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[spin_4s_linear_infinite]"></div>
            <div className="absolute inset-2 rounded-full border border-t-indigo-500/80 border-r-transparent border-b-indigo-500/30 border-l-transparent animate-[spin_2.5s_linear_infinite_reverse]"></div>
            <div className="absolute inset-6 rounded-full bg-indigo-950/50 backdrop-blur-md border border-indigo-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></div>
              <div className="absolute w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
          {/* Premium Typography with Decryption */}
          <div className="flex flex-col items-center z-10">
            <h1 className="text-3xl md:text-5xl font-mono font-bold tracking-[0.2em] text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {decryptedText || "0101010101010"}
            </h1>
            <div className="mt-8 flex items-center space-x-4 opacity-70">
              <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-indigo-500/80"></div>
              <span className="text-indigo-200/80 font-mono text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                {decryptedText === targetText ? 'NEURAL ENGINE ACTIVE' : 'DECRYPTING CORE...'}
              </span>
              <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-indigo-500/80"></div>
            </div>
          </div>
        </div>
      </div>
  );
}
