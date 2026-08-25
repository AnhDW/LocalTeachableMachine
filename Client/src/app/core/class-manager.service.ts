import { Injectable, signal } from '@angular/core';

export interface ClassItem {
  id: string;
  name: string;
  samples: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ClassManagerService {
  classes = signal<ClassItem[]>([
    { id: 'class-1', name: 'Class 1', samples: [] },
    { id: 'class-2', name: 'Class 2', samples: [] }
  ]);

  addClass() {
    const current = this.classes();
    const newId = `class-${current.length + 1}`;
    this.classes.set([...current, { id: newId, name: `Class ${current.length + 1}`, samples: [] }]);
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
