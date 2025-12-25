
import { InstrumentType } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private oscillators: Map<string, OscillatorNode[]> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private getFrequency(note: string, octave: number): number {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const index = notes.indexOf(note);
    return 440 * Math.pow(2, (index + (octave - 4) * 12) / 12);
  }

  public playNote(note: string, octave: number, type: InstrumentType) {
    this.initContext();
    if (!this.ctx) return;

    const freq = this.getFrequency(note, octave);
    const id = `${note}${octave}`;
    
    // Stop previous if exists
    this.stopNote(note, octave);

    const gainNode = this.ctx.createGain();
    const now = this.ctx.currentTime;

    const oscs: OscillatorNode[] = [];

    if (type === InstrumentType.PIANO) {
      // Simple Piano Synth: Sine + Harmonics + Fast Decay
      const main = this.ctx.createOscillator();
      main.type = 'sine';
      main.frequency.setValueAtTime(freq, now);
      
      const sub = this.ctx.createOscillator();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(freq, now);
      sub.detune.setValueAtTime(4, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

      main.connect(gainNode);
      sub.connect(gainNode);
      main.start();
      sub.start();
      oscs.push(main, sub);
    } else {
      // Organ Synth: Multiple harmonics (Drawbars simulation)
      const harmonics = [1, 2, 3, 4, 6];
      harmonics.forEach((h, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * h, now);
        const hGain = this.ctx.createGain();
        hGain.gain.value = 0.2 / (i + 1);
        osc.connect(hGain);
        hGain.connect(gainNode);
        osc.start();
        oscs.push(osc);
      });

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    }

    gainNode.connect(this.ctx.destination);
    this.oscillators.set(id, oscs);
    this.gainNodes.set(id, gainNode);
  }

  public stopNote(note: string, octave: number) {
    const id = `${note}${octave}`;
    const oscs = this.oscillators.get(id);
    const gain = this.gainNodes.get(id);
    
    if (oscs && gain && this.ctx) {
      const now = this.ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      setTimeout(() => {
        oscs.forEach(o => {
            try { o.stop(); } catch(e) {}
        });
        this.oscillators.delete(id);
        this.gainNodes.delete(id);
      }, 150);
    }
  }
}

export const audioService = new AudioService();
