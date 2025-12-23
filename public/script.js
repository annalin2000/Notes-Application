const notes = [];
let mode = 'add';
let editingId = null;

const elements = {
  input: document.getElementById('noteText'),
  list: document.getElementById('list-items'),
  button: document.getElementById('AddUpdateClick'),
  alert: document.getElementById('Alert'),
  count: document.getElementById('count'),
  form: document.getElementById('noteForm')
};

document.addEventListener('DOMContentLoaded', () => {
  fetchNotes();
});

function fetchNotes() {
  fetch('http://localhost:3001/note')
    .then((response) => response.json())
    .then((data) => {
      notes.length = 0;
      notes.push(...data);
      render();
    })
    .catch((error) => {
      showAlert('Failed to load notes from the server', 'error');
      console.error(error);
    });
}

function showAlert(message, type = 'info') {
  elements.alert.textContent = message;
  elements.alert.className = `alert alert-${type}`;
  
  if (message) {
    elements.alert.classList.add('show');
    setTimeout(() => {
      elements.alert.classList.remove('show');
    }, 3000);
  } else {
    elements.alert.classList.remove('show');
  }
}

function setMode(newMode) {
  mode = newMode;
  const isUpdate = mode === 'update';
  elements.button.textContent = isUpdate ? 'Update' : 'Add';
  elements.button.className = isUpdate ? 'btn-update' : 'btn-add';
  elements.form.classList.toggle('is-editing', isUpdate);
}

function render() {
  elements.list.innerHTML = '';

  if (notes.length === 0) {
    elements.count.innerHTML = '';
    elements.list.innerHTML = `
      <li class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">No notes yet</p>
        <p class="empty-subtext">Start by adding your first note above</p>
      </li>
    `;
  } else {
    notes.forEach(note => {
      const li = document.createElement('li');
      li.className = `note-item${note.done ? ' is-completed' : ''}${editingId === note.id ? ' is-editing' : ''}`;
      li.setAttribute('data-id', note.id);
      li.style.animation = 'slideIn 0.3s ease-out';

      li.innerHTML = `
        <div class="note-content">
          <span class="note-text">${escapeHtml(note.text)}</span>
          <span class="note-meta">Just now</span>
        </div>
        <div class="note-actions">
          <button class="btn-icon btn-edit" aria-label="Edit note">✏️</button>
          <button class="btn-icon btn-delete" aria-label="Delete note">🗑️</button>
        </div>
      `;

      elements.list.appendChild(li);

      li.querySelector('.btn-edit').addEventListener('click', () => {
        setMode('update');  
        editingId = note.id;  
        elements.input.value = note.text;  
      });

      li.querySelector('.btn-delete').addEventListener('click', () => {
        fetch(`http://localhost:3001/note/${note.id}`, {
          method: 'DELETE',
        })
          .then(() => {
            showAlert('Note deleted', 'success');
            fetchNotes(); 
          })
          .catch((error) => {
            showAlert('Failed to delete note', 'error');
            console.error(error);
          });
      });
    });

    const total = notes.length;
    elements.count.innerHTML = `<strong>${total}</strong> notes`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

elements.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = elements.input.value.trim();

  if (!text) {
    showAlert('Please enter a note', 'warning');
    return;
  }

  if (mode === 'update') {
    const note = notes.find(n => n.id === editingId);
    if (note) {
      note.text = text;
      showAlert('Note updated!', 'success');
      editingId = null;  
      setMode('add');  

      fetch('http://localhost:3001/note', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      })
        .then(() => fetchNotes()) 
        .catch((error) => {
          showAlert('Failed to update note', 'error');
          console.error(error);
        });
    }
  } else {
    if (notes.some(n => n.text.toLowerCase() === text.toLowerCase())) {
      showAlert('That note already exists', 'error');
      return;
    }

  
    fetch('http://localhost:3001/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then(() => {
        showAlert('Note added!', 'success');
        fetchNotes(); 
      })
      .catch((error) => {
        showAlert('Failed to add note', 'error');
        console.error(error);
      });
  }

  elements.input.value = ''; 
});
