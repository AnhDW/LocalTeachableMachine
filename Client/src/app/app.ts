import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebcamService } from './core/webcam.service';
import { ClassManagerService } from './core/class-manager.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html'
})
export class App implements AfterViewInit {
  @ViewChild('webcamVideo') webcamVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('captureCanvas') captureCanvas!: ElementRef<HTMLCanvasElement>;

  recordingInterval: any = null;

  constructor(
    public webcamService: WebcamService,
    public classManager: ClassManagerService
  ) {}

  ngAfterViewInit() {
  }

  async toggleWebcam() {
    if (this.webcamService.isWebcamOn) {
      this.webcamService.stopWebcam();
    } else {
      await this.webcamService.setupWebcam(this.webcamVideo.nativeElement);
    }
  }

  startRecording(classId: string) {
    if (!this.webcamService.isWebcamOn) {
      alert("Please turn on the webcam first.");
      return;
    }
    
    this.captureFrame(classId);
    this.classManager.playBeep();

    this.recordingInterval = setInterval(() => {
      this.captureFrame(classId);
      this.classManager.playBeep();
    }, 150);
  }

  stopRecording() {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }

  captureFrame(classId: string) {
    const video = this.webcamVideo.nativeElement;
    const canvas = this.captureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (ctx && video.videoWidth) {
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      
      canvas.width = 224;
      canvas.height = 224;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, 224, 224);
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      this.classManager.addSample(classId, base64Image);
    }
  }
}
