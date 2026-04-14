
import { CommonModule } from '@angular/common';
import { Component, } from '@angular/core';
import { FormsModule, } from '@angular/forms';
import { ProfesorData } from '../profesores/profesores';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';


export interface Grupo {
  id: string;
  nombre: string;
  grado: number;
  data?: object;
}


interface Tutor {
  id: string;
  nombre: string;
  apellidos: string;
  fullName: string;
}



@Component({
  selector: 'app-grupos',
  imports: [CommonModule, FormsModule, NgSelectModule, RouterModule],
  templateUrl: './grupos.html',
  styleUrl: './grupos.scss'
})



export class GruposComponent {
  grupos: Grupo[] = [];
  grupoEditando: Grupo | null = null;
  nuevoGrupo: Grupo = { id: '', nombre: '', grado: 1, data: {} };
  tutores: Tutor[] = [];
  tutoresOpciones: string[] = [];
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'success';
  ngOnInit() {
    this.cargarGrupos();
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 2600);
  }

  private normalizeGroupName(value: string) {
    return value.trim().toLowerCase();
  }

  private isNombreDuplicado(nombre: string, excludeId?: string): boolean {
    const normalized = this.normalizeGroupName(nombre);
    return this.grupos.some((g) =>
      g.id !== excludeId && this.normalizeGroupName(g.nombre) === normalized
    );
  }


  getNombreTutor(id?: string): string {
    if (!id) return '-';
    const tutor = this.tutores.find(t => t.id === id);
    return tutor ? tutor.fullName : '-';
  }


  async cargarTutores(): Promise<void> {
    try {
      const res = await fetch('http://localhost:3000/profesores/tutores');
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        this.tutores = data.map((t: any) => ({
          id: t.id,
          nombre: t.nombre,
          apellidos: t.apellidos || '',
          fullName: `${t.nombre} ${t.apellidos || ''}`.trim()
        }));

        // Para usar en ng-select como lista de opciones
        this.tutoresOpciones = this.tutores.map(t => t.fullName);
      }

    } catch (error) {
      console.error('Error cargando tutores:', error);
      this.showToast('No se pudo cargar la lista de tutores', 'error');
    }
  }

  async cargarGrupos() {
    try {
      const res = await fetch('http://localhost:3000/grupos');
      if (!res.ok) throw new Error('Error al obtener grupos');
      const data = await res.json();
      this.grupos = Array.isArray(data)
        ? data.map((g: any) => ({
          id: g.id,
          nombre: g.nombre,
          grado: g.grado,
          data: g.data || {}
        }))
        : [];
    } catch (err) {
      this.showToast('No se pudo cargar la lista de grupos', 'error');
    }
  }

  async cargarGrupoPorId(id: string) {
    try {
      const res = await fetch(`http://localhost:3000/grupos/${id}`);
      if (!res.ok) throw new Error('Error al obtener grupo');
      return await res.json();
    } catch (err) {
      this.showToast('No se pudo cargar el grupo', 'error');
      return null;
    }
  }


  // Agregar un nuevo grupo
  async agregarGrupo() {
    if (!this.nuevoGrupo.nombre || !this.nuevoGrupo.grado) {
      this.showToast('Debes completar todos los campos obligatorios', 'warning');
      return;
    }

    if (this.isNombreDuplicado(this.nuevoGrupo.nombre)) {
      this.showToast('Ya existe un grupo con ese nombre', 'warning');
      return;
    }
    const body = {
      nombre: this.nuevoGrupo.nombre,
      grado: this.nuevoGrupo.grado,
      data: this.nuevoGrupo.data || {}
    };
    try {
      const res = await fetch('http://localhost:3000/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al crear el grupo');
      const data = await res.json();
      this.grupos.push({
        id: data.id || crypto.randomUUID(),
        nombre: data.nombre,
        grado: data.grado,
        data: data.data || {}
      });
      this.nuevoGrupo = { id: '', nombre: '', grado: 1, data: {} };
      this.showToast('Grupo creado correctamente', 'success');
    } catch (err) {
      this.showToast('No se pudo crear el grupo', 'error');
    }
  }

  // Inicia la ediciÃ³n de un grupo
  editarGrupo(grupo: Grupo): void {
    this.grupoEditando = { ...grupo };
    this.nuevoGrupo = { ...grupo }; // Copia los datos al formulario
  }

  // Guardar los cambios de un grupo editado
  async guardarEdicion() {
    if (!this.nuevoGrupo.nombre || !this.nuevoGrupo.grado) {
      this.showToast('Debes completar todos los campos obligatorios', 'warning');
      return;
    }
    if (!this.grupoEditando) return;

    if (this.isNombreDuplicado(this.nuevoGrupo.nombre, this.grupoEditando.id)) {
      this.showToast('Ya existe un grupo con ese nombre', 'warning');
      return;
    }

    const body = {
      nombre: this.nuevoGrupo.nombre,
      grado: this.nuevoGrupo.grado,
      data: this.nuevoGrupo.data || {}
    };
    try {
      const res = await fetch(`http://localhost:3000/grupos/${this.grupoEditando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al editar el grupo');
      const data = await res.json();
      const index = this.grupos.findIndex(g => g.id === this.grupoEditando!.id);
      if (index !== -1) {
        this.grupos[index] = {
          id: this.grupoEditando.id,
          nombre: body.nombre,
          grado: body.grado,
          data: body.data
        };
      }
      this.grupoEditando = null;
      this.nuevoGrupo = { id: '', nombre: '', grado: 1, data: {} };
      this.showToast('Grupo editado correctamente', 'success');
    } catch (err) {
      this.showToast('No se pudo editar el grupo', 'error');
    }
  }

  // Cancelar ediciÃ³n
  cancelarEdicion(): void {
    this.grupoEditando = null;
    this.nuevoGrupo = { id: '', nombre: '', grado: 1, data: {} };
  }

  // Eliminar un grupo
  async eliminarGrupo(id: string) {
    const confirmacion = confirm('¿Estás seguro de eliminar este grupo?');
    if (!confirmacion) return;

    try {
      const res = await fetch(`http://localhost:3000/grupos/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar el grupo');
      this.grupos = this.grupos.filter(g => g.id !== id);
      this.showToast('Grupo eliminado correctamente', 'success');
    } catch (err) {
      this.showToast('No se pudo eliminar el grupo', 'error');
    }
  }
}

