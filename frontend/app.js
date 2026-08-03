// 1. CONFIGURACIÓN GLOBAL (Apunta a la URL nativa de nuestro servidor)
const API_URL = 'http://localhost:3000/tasks';

// Sistema de sesión simulada (guarda y persiste el nombre del "autor" para el navegador)
let AUTHOR = localStorage.getItem('todo_author_session');
const currentUserText = document.getElementById('currentUser');

// 2. CAPTURA CONSTANTES DEL ELEMENTOS DEL DOM
const tasksContainer = document.getElementById('tasksContainer');
const logoutBtn = document.getElementById('logoutBtn');
const taskForm = document.getElementById('taskForm');
const taskTitle = document.getElementById('taskTitle');
const taskDescription = document.getElementById('taskDescription');

// 2.1) ELEMENTOS DE MODALS PERSONALIZADOS
const customModal = document.getElementById('customModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
let modalConfirmBtn = document.getElementById('modalConfirmBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');

const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginInput = document.getElementById('loginInput');

// 2.2) CONTROLADOR GENÉRICO DE MODAL DE NOTIFICACIONES
function openCustomModal(title, message, isConfirm = false, onConfirmCallback = null) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;

  modalCancelBtn.style.display = isConfirm ? 'inline-block' : 'none';

  const nuevoConfirmBtn = modalConfirmBtn.cloneNode(true);
  modalConfirmBtn.parentNode.replaceChild(nuevoConfirmBtn, modalConfirmBtn);
  modalConfirmBtn = nuevoConfirmBtn;

  modalConfirmBtn.addEventListener('click', () => {
    customModal.classList.remove('active');
    if (onConfirmCallback) onConfirmCallback();
  });

  modalCancelBtn.addEventListener('click', () => {
    customModal.classList.remove('active');
  });

  customModal.classList.add('active');
}

// 3. GUARDIA DE AUTENTICACIÓN (Manipulación de Flujo)
function checkAuth() {
  if (!AUTHOR) {
    loginModal.classList.add('active');
  } else {
    loginModal.classList.remove('active');
    currentUserText.textContent = AUTHOR;
    fetchTasks(); // Cargamos las tareas solo si ya está identificado
  }
}

// 3.1) ESCUCHADOR PARA EL FORMULARIO INTERNO DEL MODAL LOGIN
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = loginInput.value.trim();

  if (name && name.length >= 3) {
    AUTHOR = name;
    localStorage.setItem('todo_author_session', AUTHOR);
    loginModal.classList.remove('active');
    currentUserText.textContent = AUTHOR;
    fetchTasks();
  } else {
    openCustomModal('Validación', 'Por favor ingresa un nombre válido (mínimo 3 caracteres).', false);
  }
});

// 4. LEER TAREAS DESDE MYSQL (GET)
async function fetchTasks() {
  try {
    const response = await fetch(API_URL);
    const json = await response.json();

    if (json.status === 'success' && json.data.tasks) {
      renderTasks(json.data.tasks);
    }
  } catch (error) {
    console.error('Error de red', error);
    tasksContainer.innerHTML = `<p class="error">No se pudo conectar con el servidor nativo.</p>`;
  }
}

// 5. PINTAR LAS TARJETAS DINÁMICAMENTE
function renderTasks(tasks) {
  tasksContainer.innerHTML = '';

  if (tasks.length === 0) {
    tasksContainer.innerHTML = `<p style="opacity:0.6">No hay tareas pendientes en la base de datos.</p>`;
    return;
  }

  tasks.forEach(task => {
    const taskCard = document.createElement('div');
    taskCard.className = `task-card ${task.is_completed ? 'completed' : ''}`;

    const estiloBorrachura = `style="text-decoration: ${task.is_completed ? 'line-through' : 'none'}; color: ${task.is_completed ? '#9ca3af' : '#333'};"`;

    taskCard.innerHTML = `
      <div class="task-info">
        <h3 ${estiloBorrachura}>${task.title}</h3>
        ${task.description ? `<p ${estiloBorrachura}>${task.description}</p>` : ''}
        <span class="author">Autor: ${task.author}</span>
      </div>
      <div class="task-actions" style="display:flex; gap: 8px;">
        <button class="btn-toggle" style="background-color: ${task.is_completed ? '#f59e0b' : '#10b981'}; width: auto; padding: 5px 10px; font-size: 0.85rem; border-radius: 4px; color: white; border:none; cursor:pointer;">
          ${task.is_completed ? 'Reabrir' : 'Completar'}
        </button>
        <button class="btn-delete">Eliminar</button>
      </div>
    `;

    const btnCancelar = taskCard.querySelector('.btn-cancel-value');
    const btnEliminar = taskCard.querySelector('.btn-delete');

    btnCancelar?.addEventListener('click', () => deleteTask(task.id, task.author));

    btnEliminar.addEventListener('click', () => {
      openCustomModal('Confirmar Eliminación', `¿de seguro que deseas eliminar esta tarea de la base de datos?`, true, () => {
        deleteTask(task.id, task.author);
      });
    });

    tasksContainer.appendChild(taskCard);
  });
}

// 6. CREAR TAREA (POST)
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = taskTitle.value.trim();
  const description = taskDescription.value.trim();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, author: AUTHOR })
    });

    if (response.ok) {
      taskForm.reset();
      fetchTasks();
    }
  } catch (error) {
    openCustomModal('Error de Red', 'Error de red al intentar crear la tarea.', false);
  }
});

// 7. ACTUALIZAR TAREA (PUT)
async function updateTask(taskId, title, description, is_completed) {
  try {
    const response = await fetch(`${API_URL}/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, is_completed, author: AUTHOR })
    });

    const json = await response.json();

    if (response.ok && json.status === 'success') {
      fetchTasks();
    } else {
      openCustomModal('Error de Servidor', 'Error al actualizar en el servidor.', false);
    }
  } catch (error) {
    openCustomModal('Error de Red', 'Error al comunicar la actualización.', false);
  }
}

// 8. ELIMINAR TAREA (DELETE)
async function deleteTask(taskId, taskAuthor) {
  if (AUTHOR !== taskAuthor) {
    openCustomModal('Acceso Denegado', 'No autorizado. Esta tarea es de ${taskAuthor}', false);
    return;
  }

  openCustomModal(
    '¿Confirmar Eliminación?',
    'Esta acción borrará la tarea de la base de datos de manera permanente.',
    true,
    async () => {
      try {
        const response = await fetch(`${API_URL}/${taskId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ author: AUTHOR })
        });

        const json = await response.json();

        if (response.ok && json.status === 'success') {
          fetchTasks();
        } else {
          openCustomModal('Error de Servidor', json.message || 'Falla de autorización en el servidor.', false);
        }
      } catch (error) {
        openCustomModal('Error de Red', 'Error de red al eliminar la tarea.', false);
      }
    }
  );
}

// 9. CERRAR SESIÓN (LOGOUT)
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('todo_author_session');
  window.location.reload();
});

// === INICIALIZACIÓN AL ABRIR LA PÁGINA ===
checkAuth();