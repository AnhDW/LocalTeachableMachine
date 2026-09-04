import { Routes } from '@angular/router';
import { HubComponent } from './pages/hub/hub.component';
import { ImageProjectComponent } from './pages/image-project/image-project.component';
import { HandProjectComponent } from './pages/hand-project/hand-project.component';

export const routes: Routes = [
  { path: '', component: HubComponent },
  { path: 'image', component: ImageProjectComponent },
  { path: 'hand', component: HandProjectComponent },
  { path: '**', redirectTo: '' }
];
