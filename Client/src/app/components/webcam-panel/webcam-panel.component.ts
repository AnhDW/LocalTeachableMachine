import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebcamService } from '../../core/webcam.service';

@Component({
  selector: 'app-webcam-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './webcam-panel.html',
})
export class WebcamPanelComponent implements AfterViewInit {
  @ViewChild('webcamVideo') webcamVideo!: ElementRef<HTMLVideoElement>;

  constructor(public webcamService: WebcamService) {}

  ngAfterViewInit() {
    // Optionally auto-start webcam
  }

  async toggleWebcam() {
    if (this.webcamService.isWebcamOn()) {
      this.webcamService.stopWebcam();
    } else {
      await this.webcamService.setupWebcam(this.webcamVideo.nativeElement);
    }
  }
}
