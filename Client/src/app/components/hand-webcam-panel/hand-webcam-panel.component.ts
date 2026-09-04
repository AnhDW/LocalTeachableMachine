import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebcamService } from '../../core/webcam.service';
import { HandMlService } from '../../core/hand-ml.service';

const FINGER_LOOKUP_INDICES: { [finger: string]: number[] } = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20]
};

@Component({
  selector: 'app-hand-webcam-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hand-webcam-panel.html',
})
export class HandWebcamPanelComponent implements AfterViewInit, OnDestroy {
  @ViewChild('webcamVideo') webcamVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlayCanvas') overlayCanvas!: ElementRef<HTMLCanvasElement>;
  
  private drawLoopId: any;

  constructor(
    public webcamService: WebcamService,
    private handMlService: HandMlService
  ) {}

  ngAfterViewInit() {
    // Optionally setup listeners or canvas contexts
  }

  ngOnDestroy() {
    if (this.drawLoopId) cancelAnimationFrame(this.drawLoopId);
  }

  async toggleWebcam() {
    if (this.webcamService.isWebcamOn()) {
      this.webcamService.stopWebcam();
      if (this.drawLoopId) cancelAnimationFrame(this.drawLoopId);
      const ctx = this.overlayCanvas.nativeElement.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, this.overlayCanvas.nativeElement.width, this.overlayCanvas.nativeElement.height);
    } else {
      await this.webcamService.setupWebcam(this.webcamVideo.nativeElement);
      this.startDrawingHands();
    }
  }

  startDrawingHands() {
    if (this.drawLoopId) cancelAnimationFrame(this.drawLoopId);
    
    const canvas = this.overlayCanvas.nativeElement;
    const video = this.webcamVideo.nativeElement;
    const ctx = canvas.getContext('2d');
    
    const loop = async () => {
      if (!this.webcamService.isWebcamOn() || !video.videoWidth || !ctx) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (this.handMlService.detector) {
        try {
          const hands = await this.handMlService.detector.estimateHands(video);
          if (hands.length > 0) {
            const hand = hands[0] as any;
            const keypoints = hand.landmarks;
            
            // Draw points
            for (let i = 0; i < keypoints.length; i++) {
              const x = keypoints[i][0];
              const y = keypoints[i][1];
              ctx.beginPath();
              ctx.arc(x, y, 4, 0, 2 * Math.PI);
              ctx.fillStyle = '#00FF00';
              ctx.fill();
            }
            
            // Draw lines
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            const fingers = Object.keys(FINGER_LOOKUP_INDICES);
            for (let i = 0; i < fingers.length; i++) {
              const finger = fingers[i];
              const points = FINGER_LOOKUP_INDICES[finger].map(idx => keypoints[idx]);
              const path = new Path2D();
              path.moveTo(points[0][0], points[0][1]);
              for (let j = 1; j < points.length; j++) {
                path.lineTo(points[j][0], points[j][1]);
              }
              ctx.stroke(path);
            }
          }
        } catch(e) {
          console.error(e);
        }
      }
      
      this.drawLoopId = requestAnimationFrame(loop);
    };
    
    loop();
  }
}
