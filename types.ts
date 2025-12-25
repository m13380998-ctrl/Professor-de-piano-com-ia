
export enum InstrumentType {
  PIANO = 'PIANO',
  ORGAN = 'ORGAN'
}

export interface NoteGuide {
  note: string;
  octave: number;
  duration: string;
  step: number;
}

export interface SongAnalysisResponse {
  songTitle: string;
  artist: string;
  notes: NoteGuide[];
  difficulty: string;
}

export interface PianoKeyProps {
  note: string;
  octave: number;
  isBlack: boolean;
  isHighlighted: boolean;
  onMouseDown: (note: string, octave: number) => void;
  onMouseUp: (note: string, octave: number) => void;
  isActive: boolean;
}
