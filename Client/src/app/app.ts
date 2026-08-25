import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebcamPanelComponent } from './components/webcam-panel/webcam-panel.component';
import { ClassListComponent } from './components/class-list/class-list.component';
import { TrainingPanelComponent } from './components/training-panel/training-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, WebcamPanelComponent, ClassListComponent, TrainingPanelComponent],
  templateUrl: './app.html'
})
export class App {
  constructor() {}
}
