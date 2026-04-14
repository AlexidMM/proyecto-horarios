import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent {
  usuarioNombre: string = '';
  usuarioTurno: string = '';
  sidebarCollapsed = false;
  constructor(private router: Router) {}

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  

  ngOnInit() {
    const usuarioData = localStorage.getItem('userData');
    if (usuarioData) {
      const parsed = JSON.parse(usuarioData);
      const full_name = parsed.full_name;
      const turno = parsed?.metadata?.turno;
      this.usuarioNombre = full_name;
      this.usuarioTurno = turno || 'Sin turno';
    } else {
      this.router.navigate(['/']);
    }
  }
}