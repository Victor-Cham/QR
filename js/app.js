/************************************************************
 * CONFIGURACIÓN GENERAL
 ************************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbzt77BLIMnAJYsrsAKAF2zm5A6HDorPXV4c7FcXm97PpbYCMZX2xT29LTZojfhX2tU7VA/exec";

let currentModule = "comunicados";

/************************************************************
 * LOGIN
 ************************************************************/
async function login(usuario, contrasena) {
  try {
    if (!usuario || !contrasena) {
      alert("Debe ingresar usuario y contraseña");
      return;
    }

    const url = `${API_URL}?action=login&usuario=${encodeURIComponent(usuario)}&contrasena=${encodeURIComponent(contrasena)}`;

    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Usuario o contraseña incorrectos");
      return;
    }

    localStorage.setItem("usuario", JSON.stringify(result.usuario));

    const tipo = (result.usuario.TipoUsuario || "").trim().toLowerCase();

    switch (tipo) {
      case "superadmin": window.location.href = "superadmin.html"; break;
      case "admin": window.location.href = "admin.html"; break;
      case "usuario": window.location.href = "usuario.html"; break;
      default:
        alert("Tipo de usuario no válido");
        localStorage.removeItem("usuario");
    }

  } catch (error) {
    console.error("Error en login:", error);
    alert("No se pudo conectar con el servidor.");
  }
}

/************************************************************
 * LOGOUT
 ************************************************************/
function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}

/************************************************************
 * OBTENER ITEMS
 ************************************************************/
async function getItems(tipo) {
  try {
    const response = await fetch(`${API_URL}?action=getItems&tipo=${tipo}`);
    const data = await response.json();

    if (!data.success) {
      console.error("Error del servidor:", data);
      return [];
    }

    return data.items || [];

  } catch (error) {
    console.error("Error al obtener items:", error);
    return [];
  }
}

/************************************************************
 * SUBIR ARCHIVO + CREAR REGISTRO
 ************************************************************/
async function uploadItem(tipo, nombre, tipoDocumento, archivo) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}").DNI || "";

  const formData = new FormData();
  formData.append("action", "uploadItem");
  formData.append("tipo", tipo);
  formData.append("nombre", nombre);
  formData.append("tipoDocumento", tipoDocumento);
  formData.append("usuario", usuario);
  formData.append("archivo", archivo);
  formData.append("nombreArchivo", archivo.name);
  formData.append("mimeType", archivo.type);

  const response = await fetch(API_URL, { method: "POST", body: formData });
  const data = await response.json();

  if (!data.success) throw new Error(data.message || "Error al subir archivo");

  alert("Registro creado correctamente");
}

/************************************************************
 * ACTUALIZAR REGISTRO
 ************************************************************/
async function updateItem(tipo, id, nombre, tipoDocumento) {
  const body = new URLSearchParams({
    action: "updateItem",
    tipo, id, nombre, tipoDocumento
  });

  const response = await fetch(API_URL, { method: "POST", body });
  const data = await response.json();

  if (!data.success) throw new Error(data.message);
}

/************************************************************
 * ELIMINAR REGISTRO
 ************************************************************/
async function deleteItem(tipo, id) {
  const body = new URLSearchParams({ action: "deleteItem", tipo, id });

  const response = await fetch(API_URL, { method: "POST", body });
  const data = await response.json();

  if (!data.success) throw new Error(data.message);
}

/************************************************************
 * RENDER TABLA
 ************************************************************/
function renderTable(tipo, items) {
  const container = document.getElementById("moduleContainer");
  if (!container) return;

  if (!items.length) {
    container.innerHTML = "<p>No hay registros.</p>";
    return;
  }

  let html = `
    <table>
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
      <tbody>
  `;

  items.forEach(item => {
    let idKey = Object.keys(item).find(k => k.toLowerCase().includes("id"));

    html += `
      <tr>
        <td>${item[idKey]}</td>
        <td>${item.Nombre}</td>
        <td>${item.Tipo}</td>
        <td><a href="${item.Link}" target="_blank">Ver Archivo</a></td>
        <td><img src="${item["QR Online"]}" width="50" onclick="copyToClipboard('${item["QR Online"]}')"></td>
        <td>${item["Usuario Crea"]}</td>
        <td>${item["Fecha Creado"]}</td>
        <td>
          <button class="crud-btn edit" onclick="editItemHandler('${tipo}', '${item[idKey]}')">Editar</button>
          <button class="crud-btn delete" onclick="deleteItemHandler('${tipo}', '${item[idKey]}')">Eliminar</button>
        </td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

/************************************************************
 * FILTRO DE BÚSQUEDA
 ************************************************************/
function filterTable() {
  const input = document.getElementById("searchInput");
  const rows = document.querySelectorAll("#moduleContainer table tbody tr");

  const query = input.value.toLowerCase();

  rows.forEach(row => {
    const nombre = row.cells[1]?.innerText.toLowerCase();
    row.style.display = nombre.includes(query) ? "" : "none";
  });
}

/************************************************************
 * EDITAR
 ************************************************************/
async function editItemHandler(tipo, id) {
  const nombre = prompt("Nuevo nombre:");
  const tipoDocumento = prompt("Nuevo tipo:");

  if (!nombre || !tipoDocumento) return;

  await updateItem(tipo, id, nombre, tipoDocumento);
  loadModule(tipo);
}

/************************************************************
 * ELIMINAR
 ************************************************************/
async function deleteItemHandler(tipo, id) {
  if (!confirm("¿Eliminar este registro?")) return;

  await deleteItem(tipo, id);
  loadModule(tipo);
}

/************************************************************
 * COPIAR QR
 ************************************************************/
function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  alert("Enlace QR copiado");
}

/************************************************************
 * CARGAR MÓDULO
 ************************************************************/
async function loadModule(module) {
  currentModule = module;
  const items = await getItems(module);
  renderTable(module, items);
}

/************************************************************
 * EXPORTAR A GLOBAL
 ************************************************************/
window.login = login;
window.logout = logout;
window.uploadItem = uploadItem;
window.filterTable = filterTable;
window.loadModule = loadModule;
window.editItemHandler = editItemHandler;
window.deleteItemHandler = deleteItemHandler;
window.copyToClipboard = copyToClipboard;
