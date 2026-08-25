import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassManagerService } from '../../core/class-manager.service';
import { ClassCardComponent } from '../class-card/class-card.component';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, ClassCardComponent],
  templateUrl: './class-list.html',
})
export class ClassListComponent {
  constructor(public classManager: ClassManagerService) {}

  addClass() {
    this.classManager.addClass();
  }
}
