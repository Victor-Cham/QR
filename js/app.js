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

  try {
    const response = await fetch(`${API_URL}?action=login&usuario=${encodeURIComponent(usuario)}&contrasena=${encodeURIComponent(contrasena)}`);
    const result = await response.json();

    if (!result.success) {
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
  const tbody = document.getElementById(`${tipo}Table`).querySelector("tbody");
  tbody.innerHTML = "";

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
      <td>
        <button onclick="editItem('${tipo}', '${item[idKey]}')">Editar</button>
        <button onclick="deleteItemHandler('${tipo}', '${item[idKey]}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterTable(tipo) {
  const input = document.getElementById(`search${capitalize(tipo)}`);
  const filter = input.value.toLowerCase();
  const rows = document.getElementById(`${tipo}Table`).querySelectorAll("tbody tr");

  rows.forEach(row => {
    const nombre = row.cells[1].innerText.toLowerCase();
    row.style.display = nombre.includes(filter) ? "" : "none";
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/************************************************************
 *                  CRUD HANDLERS
 ************************************************************/
async function addItem(event, tipo) {
  event.preventDefault();
  const form = event.target;
  const nombre = form.nombre.value.trim();
  const tipoDocumento = form.tipoDocumento.value.trim();
  const link = form.link.value.trim();

  if(!nombre || !tipoDocumento || !link) return;

  try {
    await createItem(tipo, nombre, tipoDocumento, link);
    form.reset();
    await loadModule(tipo);
  } catch(err) {
    alert("Error al agregar item: " + err.message);
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
async function loadModule(tipo) {
  const items = await getItems(tipo);
  renderTable(tipo, items);
}

/************************************************************
 *          INICIALIZACIÓN SEGÚN ROL
 ************************************************************/
document.addEventListener('DOMContentLoaded', async () => {
  let user = null;
  try {
    const usuarioStr = localStorage.getItem('usuario');
    if(usuarioStr) user = JSON.parse(usuarioStr);
  } catch(e) {
    console.error("Error parseando sesión:", e);
    localStorage.removeItem('usuario');
  }

  if(!user) return;

  const tipoUsuario = user.TipoUsuario?.trim().toLowerCase() || "";

  // Solo inicializar si es admin
  if(tipoUsuario === "admin") {
    // Cargar por defecto Comunicados
    await loadModule('comunicados');
  }
});
