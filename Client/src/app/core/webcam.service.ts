import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebcamService {
  private stream: MediaStream | null = null;
  public isWebcamOn = signal(false);
  public videoElement: HTMLVideoElement | null = null;

  async setupWebcam(videoElement: HTMLVideoElement): Promise<void> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Webcam API is not supported in this browser context (requires HTTPS or localhost).");
        return;
      }
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 224, height: 224 },
        audio: false
      });
      videoElement.srcObject = this.stream;
      this.videoElement = videoElement;
      this.isWebcamOn.set(true);
      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play().catch(e => console.error("Error playing video:", e));
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
      this.videoElement = null;
      this.isWebcamOn.set(false);
    }
  }

  captureFrameAsBase64(): string | null {
    if (!this.isWebcamOn() || !this.videoElement) return null;
    
    const video = this.videoElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (ctx && video.videoWidth) {
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      
      canvas.width = 224;
      canvas.height = 224;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, 224, 224);
      
      // Sử dụng định dạng WebP để nén nhẹ hơn thay vì JPEG
      return canvas.toDataURL('image/webp', 0.8);
    }
    return null;
  }
}
