import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WebcamPanelComponent } from '../../components/webcam-panel/webcam-panel.component';
import { ClassListComponent } from '../../components/class-list/class-list.component';
import { TrainingPanelComponent } from '../../components/training-panel/training-panel.component';
import { ProjectLocalService } from '../../core/project-local.service';

@Component({
  selector: 'app-image-project',
  standalone: true,
  imports: [CommonModule, RouterLink, WebcamPanelComponent, ClassListComponent, TrainingPanelComponent],
  template: `
    <div class="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/" class="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            <span class="font-medium">Hub</span>
          </a>
          <div class="h-6 w-px bg-gray-300"></div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">TM</div>
            <h1 class="text-xl font-medium text-gray-700">Image Project</h1>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Hidden file input for import -->
          <input type="file" #fileInput (change)="onFileSelected($event)" accept=".tmproj,.json" class="hidden" />
          <button (click)="fileInput.click()" class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">Import Project</button>
          <button (click)="exportProject()" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">Export Project</button>
        </div>
      </header>

      <main class="p-6 grid grid-cols-12 gap-6 h-[calc(100vh-73px)]">
        <!-- Left Column: Webcam Input (3 columns) -->
        <section class="col-span-3 flex flex-col gap-4">
          <app-webcam-panel></app-webcam-panel>
        </section>

        <!-- Middle Column: Classes (6 columns) -->
        <section class="col-span-6 flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
          <app-class-list></app-class-list>
        </section>

        <!-- Right Column: Training (3 columns) -->
        <section class="col-span-3 flex flex-col gap-4">
          <app-training-panel></app-training-panel>
        </section>
      </main>
    </div>
  `
})
export class ImageProjectComponent {
  constructor(private projectLocal: ProjectLocalService) {}

  exportProject() {
    this.projectLocal.exportProject();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.projectLocal.importProject(file).then(success => {
        if (success) {
          alert('Import dự án thành công!');
        }
        input.value = '';
      });
    }
  }
}
