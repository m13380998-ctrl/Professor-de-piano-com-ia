
import React from 'react';
import { PianoKeyProps } from '../types';

const PianoKey: React.FC<PianoKeyProps> = ({ 
  note, 
  octave, 
  isBlack, 
  isHighlighted, 
  onMouseDown, 
  onMouseUp,
  isActive 
}) => {
  const baseClasses = "piano-key flex items-end justify-center select-none cursor-pointer border border-slate-400 rounded-b-md relative";
  const whiteClasses = "white-key w-12 h-44 z-0 text-slate-800 pb-2 text-xs font-bold";
  const blackClasses = "black-key w-8 h-28 -mx-4 z-10 border-slate-900 shadow-xl text-slate-200 pb-2 text-[10px]";
  
  const highlightClass = isHighlighted ? "ring-4 ring-yellow-400 ring-inset" : "";
  const activeClass = isActive ? "piano-key-active bg-blue-200" : "";

  return (
    <div
      onMouseDown={() => onMouseDown(note, octave)}
      onMouseUp={() => onMouseUp(note, octave)}
      onMouseLeave={() => isActive && onMouseUp(note, octave)}
      className={`
        ${baseClasses} 
        ${isBlack ? blackClasses : whiteClasses} 
        ${highlightClass} 
        ${activeClass}
      `}
    >
      {note}{octave}
    </div>
  );
};

export default PianoKey;
