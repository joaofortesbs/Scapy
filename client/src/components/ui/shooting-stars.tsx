"use client";
import React, { useRef, useEffect } from "react";

export const ShootingStars = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createShootingStar = () => {
      if (!containerRef.current) return;

      const star = document.createElement("div");
      star.className = "shooting-star";
      star.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: #00F6FF;
        border-radius: 50%;
        animation: shoot 3s linear forwards;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        box-shadow: 0 0 6px #00F6FF;
      `;

      containerRef.current.appendChild(star);

      setTimeout(() => {
        if (star.parentNode) {
          star.parentNode.removeChild(star);
        }
      }, 3000);
    };

    const interval = setInterval(createShootingStar, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        background: `linear-gradient(180deg, #00F6FF 0%, #00F6FF 17%, #000515 17%, #000515 100%)`
      }}
    />
  );
};