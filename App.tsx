
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InstrumentType, NoteGuide, SongAnalysisResponse } from './types';
import { audioService } from './services/audioService';
import { analyzeSongFromUrl } from './services/geminiService';
import PianoKey from './components/PianoKey';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const App: React.FC = () => {
  const [instrument, setInstrument] = useState<InstrumentType>(InstrumentType.PIANO);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<SongAnalysisResponse | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [videoId, setVideoId] = useState<string | null>(null);

  // Fix: Use any or number instead of NodeJS.Timeout to resolve "Cannot find namespace 'NodeJS'" in browser environments
  const timerRef = useRef<any>(null);

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handlePlayNote = useCallback((note: string, octave: number) => {
    audioService.playNote(note, octave, instrument);
    setActiveNotes(prev => new Set(prev).add(`${note}${octave}`));
  }, [instrument]);

  const handleStopNote = useCallback((note: string, octave: number) => {
    audioService.stopNote(note, octave);
    setActiveNotes(prev => {
      const next = new Set(prev);
      next.delete(`${note}${octave}`);
      return next;
    });
  }, []);

  const handleProcessUrl = async () => {
    if (!youtubeUrl) return;
    setLoading(true);
    const id = extractVideoId(youtubeUrl);
    setVideoId(id);
    
    try {
      const result = await analyzeSongFromUrl(youtubeUrl);
      setGuide(result);
      setCurrentStep(0);
    } catch (error) {
      console.error("Erro ao processar música:", error);
      alert("Não foi possível analisar esta música. Tente outro link.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (!guide) return;
    setCurrentStep(prev => (prev + 1) % guide.notes.length);
  };

  const startAutoPlay = () => {
    if (!guide) return;
    let step = 0;
    timerRef.current = setInterval(() => {
      const currentNote = guide.notes[step];
      handlePlayNote(currentNote.note, currentNote.octave);
      setTimeout(() => handleStopNote(currentNote.note, currentNote.octave), 400);
      setCurrentStep(step);
      step = (step + 1) % guide.notes.length;
    }, 600);
  };

  const stopAutoPlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const renderKeys = () => {
    const keys = [];
    const octaves = [3, 4, 5];
    
    octaves.forEach(octave => {
      NOTES.forEach(note => {
        const isBlack = note.includes('#');
        const id = `${note}${octave}`;
        const isHighlighted = guide ? guide.notes[currentStep]?.note === note && guide.notes[currentStep]?.octave === octave : false;
        
        keys.push(
          <PianoKey
            key={id}
            note={note}
            octave={octave}
            isBlack={isBlack}
            isHighlighted={isHighlighted}
            onMouseDown={handlePlayNote}
            onMouseUp={handleStopNote}
            isActive={activeNotes.has(id)}
          />
        );
      });
    });
    return keys;
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-900 pb-20 p-4">
      {/* Header */}
      <header className="w-full max-w-6xl py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Piano<span className="text-indigo-400">AI</span> Organ</h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-700">
          <button
            onClick={() => setInstrument(InstrumentType.PIANO)}
            className={`px-6 py-2 rounded-lg transition-all font-semibold ${instrument === InstrumentType.PIANO ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Piano
          </button>
          <button
            onClick={() => setInstrument(InstrumentType.ORGAN)}
            className={`px-6 py-2 rounded-lg transition-all font-semibold ${instrument === InstrumentType.ORGAN ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Órgão
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl flex flex-col gap-10">
        
        {/* URL Input and Video */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Aprender Música</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Cole o link do YouTube aqui..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-100"
                />
                <button
                  onClick={handleProcessUrl}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : "Analisar"}
                </button>
              </div>
            </div>

            {guide && (
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-indigo-500/30">
                <h2 className="text-xl font-bold text-indigo-400">{guide.songTitle}</h2>
                <p className="text-slate-400">{guide.artist} • Dificuldade: {guide.difficulty}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button 
                    onClick={nextStep}
                    className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700 text-sm font-medium"
                  >
                    Próxima Tecla
                  </button>
                  <button 
                    onClick={startAutoPlay}
                    className="bg-slate-800 hover:bg-green-600/20 hover:text-green-400 px-4 py-2 rounded-lg border border-slate-700 hover:border-green-600 text-sm font-medium transition-all"
                  >
                    Auto-Player
                  </button>
                  <button 
                    onClick={stopAutoPlay}
                    className="bg-slate-800 hover:bg-red-600/20 hover:text-red-400 px-4 py-2 rounded-lg border border-slate-700 hover:border-red-600 text-sm font-medium transition-all"
                  >
                    Parar
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl aspect-video flex items-center justify-center text-slate-500">
            {videoId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube music"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <svg className="w-16 h-16 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
                <p>O vídeo aparecerá aqui após a análise</p>
              </div>
            )}
          </div>
        </div>

        {/* Piano/Keyboard Section */}
        <div className="relative pt-12">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 px-8 py-2 rounded-t-2xl border-x border-t border-slate-700 text-sm font-bold text-slate-400 uppercase tracking-widest">
            Teclado Interativo
          </div>
          <div className="bg-slate-800 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 overflow-x-auto">
            <div className="flex justify-center min-w-max">
              {renderKeys()}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800">
             <h3 className="text-indigo-400 font-bold mb-2">1. Cole o Link</h3>
             <p className="text-sm text-slate-400">Pegue um link de qualquer música do YouTube que você queira aprender.</p>
           </div>
           <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800">
             <h3 className="text-indigo-400 font-bold mb-2">2. Analise com IA</h3>
             <p className="text-sm text-slate-400">Nossa inteligência artificial identifica as notas principais para você.</p>
           </div>
           <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800">
             <h3 className="text-indigo-400 font-bold mb-2">3. Siga o Guia</h3>
             <p className="text-sm text-slate-400">As teclas amarelas indicam o que você deve tocar no momento.</p>
           </div>
        </div>
      </main>

      <footer className="mt-20 text-slate-600 text-sm">
        Piano & Organ AI Teacher &copy; 2024 • Desenvolvido com Gemini
      </footer>
    </div>
  );
};

export default App;
