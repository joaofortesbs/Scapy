
import React from 'react';

interface ScapyIconProps {
  className?: string;
  size?: number;
}

export const ScapyIcon: React.FC<ScapyIconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Escudo principal */}
      <path
        d="M12 2L20 6V10C20 16 16.5 20.5 12 22C7.5 20.5 4 16 4 10V6L12 2Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* S estilizado no centro */}
      <path
        d="M9 8.5C9 7.67 9.67 7 10.5 7H13.5C14.33 7 15 7.67 15 8.5C15 9.33 14.33 10 13.5 10H10.5C9.67 10 9 10.67 9 11.5C9 12.33 9.67 13 10.5 13H13.5C14.33 13 15 13.67 15 14.5C15 15.33 14.33 16 13.5 16H10.5C9.67 16 9 15.33 9 14.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Pequenos pontos decorativos */}
      <circle cx="8" cy="6" r="1" fill="currentColor" fillOpacity="0.6" />
      <circle cx="16" cy="6" r="1" fill="currentColor" fillOpacity="0.6" />
      <circle cx="6" cy="18" r="1" fill="currentColor" fillOpacity="0.4" />
      <circle cx="18" cy="18" r="1" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
};

export default ScapyIcon;
