import { Injectable, signal } from '@angular/core';

export interface ClassItem {
  id: string;
  name: string;
  samples: string[];
  color: string;
}

const CLASS_COLORS = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#38BDF8'];

@Injectable({
  providedIn: 'root'
})
export class ClassManagerService {
  classes = signal<ClassItem[]>([
    { id: 'class-1', name: 'Class 1', samples: [], color: CLASS_COLORS[0] },
    { id: 'class-2', name: 'Class 2', samples: [], color: CLASS_COLORS[1] }
  ]);

  addClass() {
    const current = this.classes();
    const newId = `class-${current.length + 1}`;
    const color = CLASS_COLORS[current.length % CLASS_COLORS.length];
    this.classes.set([...current, { id: newId, name: `Class ${current.length + 1}`, samples: [], color }]);
  }

  getClassColorByName(name: string): string {
    const cls = this.classes().find(c => c.name === name);
    return (cls && cls.color) ? cls.color : '#3B82F6'; // fallback to blue
  }

  removeClass(id: string) {
    this.classes.set(this.classes().filter(c => c.id !== id));
  }

  updateClassName(id: string, newName: string) {
    this.classes.set(this.classes().map(c => c.id === id ? { ...c, name: newName } : c));
  }

  addSample(classId: string, sampleBase64: string) {
    this.classes.set(this.classes().map(c => {
      if (c.id === classId) {
        return { ...c, samples: [...c.samples, sampleBase64] };
      }
      return c;
    }));
  }

  removeSample(classId: string, index: number) {
    this.classes.set(this.classes().map(c => {
      if (c.id === classId) {
        const newSamples = [...c.samples];
        newSamples.splice(index, 1);
        return { ...c, samples: newSamples };
      }
      return c;
    }));
  }

  playBeep() {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // volume 5%
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05); // 50ms beep
  }
}
