import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassManagerService, ClassItem } from '../../core/class-manager.service';
import { WebcamService } from '../../core/webcam.service';

@Component({
  selector: 'app-class-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-card.html',
})
export class ClassCardComponent {
  @Input() cls!: ClassItem;
  recordingInterval: any = null;

  constructor(
    public classManager: ClassManagerService,
    public webcamService: WebcamService
  ) {}

  updateName(newName: string) {
    this.classManager.updateClassName(this.cls.id, newName);
  }

  removeClass() {
    this.classManager.removeClass(this.cls.id);
  }

  removeSample(index: number) {
    this.classManager.removeSample(this.cls.id, index);
  }

  startRecording() {
    if (!this.webcamService.isWebcamOn()) {
      alert("Please turn on the webcam first.");
      return;
    }
    
    this.captureSingleFrame();
    this.classManager.playBeep();

    this.recordingInterval = setInterval(() => {
      this.captureSingleFrame();
      this.classManager.playBeep();
    }, 150);
  }

  stopRecording() {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }

  captureSingleFrame() {
    const base64Image = this.webcamService.captureFrameAsBase64();
    if (base64Image) {
      this.classManager.addSample(this.cls.id, base64Image);
    }
  }
}
