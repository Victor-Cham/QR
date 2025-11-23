/************************************************************
 *          URL DE LA WEB APP (Google Apps Script)
 ************************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbzt77BLIMnAJYsrsAKAF2zm5A6HDorPXV4c7FcXm97PpbYCMZX2xT29LTZojfhX2tU7VA/exec";

/************************************************************
 *                  LOGIN
 ************************************************************/
async function login(usuario, contrasena) {
  if(!usuario || !contrasena) {
    alert("Debe ingresar usuario y contraseña");
    return;
  }

  console.log("Intento de login:", usuario);

  try {
    const response = await fetch(`${API_URL}?action=login&usuario=${encodeURIComponent(usuario)}&contrasena=${encodeURIComponent(contrasena)}`);
    const result = await response.json();

    if(!result.success) {
      alert(result.message || "Usuario o contraseña incorrecta");
      return;
    }

    localStorage.setItem('usuario', JSON.stringify(result.usuario));

    const tipo = result.usuario.TipoUsuario.trim().toLowerCase();
    switch(tipo) {
      case "superadmin": window.location.href = "superadmin.html"; break;
      case "admin": window.location.href = "admin.html"; break;
      case "usuario": window.location.href = "usuario.html"; break;
      default: alert("Tipo de usuario no válido");
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
    if(!data.success) return [];
    return data.items || [];
  } catch(err) {
    console.error("Error al obtener items:", err);
    return [];
  }
}

async function createItem(tipo, nombre, tipoDocumento, link) {
  const usuario = JSON.parse(localStorage.getItem('usuario') || "{}").DNI || "";
  const body = new URLSearchParams({ action: "createItem", tipo, nombre, tipoDocumento, link, usuario });
  const resp = await fetch(API_URL, { method: "POST", body });
  const data = await resp.json();
  if(!data.success) throw new Error(data.message || "Error al crear item");
  return data.id;
}

async function updateItem(tipo, id, nombre, tipoDocumento, link) {
  const body = new URLSearchParams({ action: "updateItem", tipo, id, nombre, tipoDocumento, link });
  const resp = await fetch(API_URL, { method: "POST", body });
  const data = await resp.json();
  if(!data.success) throw new Error(data.message || "Error al actualizar item");
  return true;
}

async function deleteItem(tipo, id) {
  const body = new URLSearchParams({ action: "deleteItem", tipo, id });
  const resp = await fetch(API_URL, { method: "POST", body });
  const data = await resp.json();
  if(!data.success) throw new Error(data.message || "Error al eliminar item");
  return true;
}

/************************************************************
 *                  RENDER TABLAS Y FILTROS
 ************************************************************/
function renderTable(tipo, items) {
  const container = document.getElementById('moduleContainer');
  if(!container) return;

  if(items.length === 0) {
    container.innerHTML = "<p>No hay registros.</p>";
    return;
  }

  let html = `<table id="${tipo}Table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Link</th>
                    <th>QR</th>
                    <th>Usuario</th>
                    <th>Fecha</th>
                    <th>Visitas</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                </tbody>
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
      <td><a href="${item.Link}" target="_blank">Ver</a></td>
      <td><a href="${item["QR Online"]}" target="_blank">QR</a></td>
      <td>${item["Usuario Crea"]}</td>
      <td>${item["Fecha Creado"]}</td>
      <td>${item.VisitasTotales}</td>
      <td>
        <button class="crud-btn edit" onclick="editItem('${tipo}', '${item[idKey]}')">Editar</button>
        <button class="crud-btn delete" onclick="deleteItemHandler('${tipo}', '${item[idKey]}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterTable() {
  const input = document.getElementById('searchInput');
  const query = input.value.toLowerCase();
  const rows = document.querySelectorAll("#moduleContainer table tbody tr");

  rows.forEach(row => {
    const nombre = row.cells[1].innerText.toLowerCase();
    row.style.display = nombre.includes(query) ? "" : "none";
  });
}

/************************************************************
 *                  CRUD HANDLERS
 ************************************************************/
async function addItem() {
  const nombre = prompt("Ingrese nombre:");
  const tipoDocumento = prompt("Ingrese tipo:");
  const link = prompt("Ingrese link:");

  if(nombre && tipoDocumento && link) {
    try {
      await createItem(currentModule, nombre, tipoDocumento, link);
      alert("Registro agregado correctamente");
      await loadModule(currentModule);
    } catch(err) {
      alert("Error al agregar item: " + err.message);
    }
  }
}

async function editItem(tipo, id) {
  const nombre = prompt("Ingrese nuevo nombre:");
  const tipoDocumento = prompt("Ingrese nuevo tipo:");
  const link = prompt("Ingrese nuevo link:");

  if(nombre && tipoDocumento && link) {
    try {
      await updateItem(tipo, id, nombre, tipoDocumento, link);
      await loadModule(tipo);
    } catch(err) {
      alert("Error al actualizar: " + err.message);
    }
  }
}

async function deleteItemHandler(tipo, id) {
  if(confirm("¿Desea eliminar este registro?")) {
    try {
      await deleteItem(tipo, id);
      await loadModule(tipo);
    } catch(err) {
      alert("Error al eliminar: " + err.message);
    }
  }
}

/************************************************************
 *                  CARGA DE MÓDULOS
 ************************************************************/
let currentModule = 'comunicados';
async function loadModule(module) {
  currentModule = module;

  document.querySelectorAll('.sidebar button').forEach(btn => {
    btn.classList.remove('active');
    if(btn.textContent.toLowerCase() === module) btn.classList.add('active');
  });

  const items = await getItems(module);
  renderTable(module, items);
}

/************************************************************
 *          INICIALIZACIÓN SEGÚN ROL
 ************************************************************/
document.addEventListener('DOMContentLoaded', async () => {
  // Validar sesión
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('usuario'));
  } catch(e) {
    localStorage.removeItem('usuario');
  }

  if(!user) return;

  document.getElementById("userName").textContent = `Hola, ${user.Nombre || user.Email || 'Administrador'}`;

  const tipo = user.TipoUsuario?.trim().toLowerCase() || "";

  if(tipo === "admin") {
    await loadModule('comunicados');
  }
});

/************************************************************
 *          EXPONER FUNCIONES AL GLOBAL
 ************************************************************/
window.login = login;
window.logout = logout;
window.getItems = getItems;
window.createItem = createItem;
window.updateItem = updateItem;
window.deleteItemHandler = deleteItemHandler;
window.addItem = addItem;
window.editItem = editItem;
window.loadModule = loadModule;
window.filterTable = filterTable;
