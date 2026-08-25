import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebcamService {
  private stream: MediaStream | null = null;
  public isWebcamOn = false;

  async setupWebcam(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 224, height: 224 },
        audio: false
      });
      videoElement.srcObject = this.stream;
      this.isWebcamOn = true;
      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Error accessing webcam:', error);
      throw error;
    }
  }

  stopWebcam(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      this.isWebcamOn = false;
    }
  }
}
