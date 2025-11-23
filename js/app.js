/************************************************************
 *          URL DE LA WEB APP (Google Apps Script)
 ************************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbzt77BLIMnAJYsrsAKAF2zm5A6HDorPXV4c7FcXm97PpbYCMZX2xT29LTZojfhX2tU7VA/exec";

let currentModule = 'comunicados';

/************************************************************
 *                  LOGIN
 ************************************************************/
async function login(usuario, contrasena) {
  if (!usuario || !contrasena) {
    alert("Debe ingresar usuario y contraseña");
    return;
  }

  try {
    const response = await fetch(`${API_URL}?action=login&usuario=${encodeURIComponent(usuario)}&contrasena=${encodeURIComponent(contrasena)}`);
    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Usuario o contraseña incorrecta");
      return;
    }

    localStorage.setItem('usuario', JSON.stringify(result.usuario));

    const tipo = (result.usuario.TipoUsuario || "").trim().toLowerCase();
    switch (tipo) {
      case "superadmin":
        window.location.href = "superadmin.html"; break;
      case "admin":
        window.location.href = "admin.html"; break;
      case "usuario":
        window.location.href = "usuario.html"; break;
      default:
        alert("Tipo de usuario no válido, revise la hoja PERSONAS");
        localStorage.removeItem('usuario');
    }

  } catch (error) {
    console.error("Error al conectar con la Web App:", error);
    alert("No se pudo conectar con el servidor. Intente más tarde.");
  }
}

/************************************************************
 *                  LOGOUT
 ************************************************************/
function logout() {
  localStorage.removeItem('usuario');
  window.location.href = "index.html";
}

/************************************************************
 *                  FUNCIONES CRUD
 ************************************************************/
async function getItems(tipo) {
  try {
    const resp = await fetch(`${API_URL}?action=getItems&tipo=${tipo}`);
    const data = await resp.json();
    if (!data.success) return [];
    return data.items || [];
  } catch (err) {
    console.error("Error al obtener items:", err);
    return [];
  }
}

// Subir archivo y registrar en Sheet
async function uploadItem(tipo, nombre, tipoDocumento, archivo) {
  if (!archivo) {
    alert("Debe seleccionar un archivo");
    return;
  }

  const usuario = JSON.parse(localStorage.getItem('usuario') || "{}").DNI || "";

  const formData = new FormData();
  formData.append("action", "uploadItem");
  formData.append("tipo", tipo);
  formData.append("nombre", nombre);
  formData.append("tipoDocumento", tipoDocumento);
  formData.append("usuario", usuario);
  formData.append("archivo", archivo);
  formData.append("nombreArchivo", archivo.name);
  formData.append("mimeType", archivo.type);

  try {
    const resp = await fetch(API_URL, { method: "POST", body: formData });
    const data = await resp.json();
    if (!data.success) throw new Error(data.message || "Error al subir el archivo");
    alert("Archivo subido correctamente. ID: " + data.id);
    await loadModule(tipo);
  } catch (err) {
    alert("Error al subir archivo: " + err.message);
  }
}

async function updateItem(tipo, id, nombre, tipoDocumento) {
  const body = new URLSearchParams({ action: "updateItem", tipo, id, nombre, tipoDocumento });
  const resp = await fetch(API_URL, { method: "POST", body });
  const data = await resp.json();
  if (!data.success) throw new Error(data.message || "Error al actualizar item");
  return true;
}

async function deleteItem(tipo, id) {
  const body = new URLSearchParams({ action: "deleteItem", tipo, id });
  const resp = await fetch(API_URL, { method: "POST", body });
  const data = await resp.json();
  if (!data.success) throw new Error(data.message || "Error al eliminar item");
  return true;
}

/************************************************************
 *                  RENDER TABLAS
 ************************************************************/
function renderTable(tipo, items) {
  const container = document.getElementById('moduleContainer');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = "<p>No hay registros.</p>";
    return;
  }

  let html = `<table id="${tipo}Table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Archivo</th>
                    <th>QR</th>
                    <th>Usuario</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>`;
  container.innerHTML = html;

  const tbody = container.querySelector("tbody");
  items.forEach(item => {
    const idKey = Object.keys(item).find(k => k.toLowerCase().includes("id"));
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item[idKey]}</td>
      <td>${item.Nombre}</td>
      <td>${item.Tipo}</td>
      <td><a href="${item.Link}" target="_blank">Ver Archivo</a></td>
      <td>
        <img src="${item["QR Online"]}" width="50" height="50" style="cursor:pointer;" onclick="copyToClipboard('${item["QR Online"]}')">
      </td>
      <td>${item["Usuario Crea"]}</td>
      <td>${item["Fecha Creado"]}</td>
      <td>
        <button class="crud-btn edit" onclick="editItemHandler('${tipo}', '${item[idKey]}')">Editar</button>
        <button class="crud-btn delete" onclick="deleteItemHandler('${tipo}', '${item[idKey]}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/************************************************************
 *                  COPIAR QR
 ************************************************************/
function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => alert("URL del QR copiada al portapapeles"))
    .catch(err => alert("Error al copiar: " + err));
}

/************************************************************
 *                  FILTRO TABLA
 ************************************************************/
function filterTable() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  const query = input.value.toLowerCase();
  const rows = document.querySelectorAll("#moduleContainer table tbody tr");

  rows.forEach(row => {
    const nombre = row.cells[1]?.innerText.toLowerCase() || "";
    row.style.display = nombre.includes(query) ? "" : "none";
  });
}

/************************************************************
 *                  CRUD HANDLERS
 ************************************************************/
async function editItemHandler(tipo, id) {
  const nombre = prompt("Ingrese nuevo nombre:");
  const tipoDocumento = prompt("Ingrese nuevo tipo:");

  if (!nombre || !tipoDocumento) return;
  try {
    await updateItem(tipo, id, nombre, tipoDocumento);
    await loadModule(tipo);
  } catch (err) {
    alert("Error al actualizar: " + err.message);
  }
}

async function deleteItemHandler(tipo, id) {
  if (!confirm("¿Desea eliminar este registro?")) return;
  try {
    await deleteItem(tipo, id);
    await loadModule(tipo);
  } catch (err) {
    alert("Error al eliminar: " + err.message);
  }
}

/************************************************************
 *                  CARGA DE MÓDULOS
 ************************************************************/
async function loadModule(module) {
  currentModule = module;

  document.querySelectorAll('.sidebar button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase() === module) btn.classList.add('active');
  });

  const items = await getItems(module);
  renderTable(module, items);
}

/************************************************************
 *          INICIALIZACIÓN SEGÚN ROL
 ************************************************************/
document.addEventListener('DOMContentLoaded', async () => {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('usuario')); } 
  catch(e){ localStorage.removeItem('usuario'); }

  if (!user) return window.location.href = "index.html";

  document.getElementById("userName").textContent = `Hola, ${user.Nombre || user.Email || 'Administrador'}`;

  await loadModule('comunicados');
});

/************************************************************
 *          EXPONER FUNCIONES AL GLOBAL
 ************************************************************/
window.login = login;
window.logout = logout;
window.loadModule = loadModule;
window.filterTable = filterTable;
window.uploadItem = uploadItem;
window.editItemHandler = editItemHandler;
window.deleteItemHandler = deleteItemHandler;
window.copyToClipboard = copyToClipboard;
