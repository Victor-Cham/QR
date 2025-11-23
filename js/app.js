/************************************************************
 * FRONTEND APP.JS
 ************************************************************/

const API_URL = "TU_URL_DE_WEB_APP"; // Reemplaza con la URL de tu Web App de Google Apps Script

let currentModule = "comunicados";

/********** LOGIN / SESIÓN **********/
document.addEventListener("DOMContentLoaded", () => {
  const userStr = localStorage.getItem("usuario");
  if (!userStr) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(userStr);
  document.getElementById("userName").textContent = `Hola, ${user.Nombre || user.Email || "Administrador"}`;
  loadModule(currentModule);
});

function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}

/********** FUNCIONES CRUD **********/
async function fetchGET(params) {
  const url = new URL(API_URL);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  const res = await fetch(url);
  return res.json();
}

async function fetchPOST(data) {
  const formData = new FormData();
  Object.keys(data).forEach(key => formData.append(key, data[key]));
  const res = await fetch(API_URL, { method: "POST", body: formData });
  return res.json();
}

/********** LOGIN FORM HANDLER **********/
async function handleLogin(usuario, contrasena) {
  const res = await fetchGET({ action: "login", usuario, contrasena });
  if (res.success) {
    localStorage.setItem("usuario", JSON.stringify(res.usuario));
    switch (res.usuario.TipoUsuario.toLowerCase()) {
      case "superadmin": window.location.href = "superadmin.html"; break;
      case "admin": window.location.href = "admin.html"; break;
      case "usuario": window.location.href = "usuario.html"; break;
    }
  } else {
    throw new Error(res.message);
  }
}

/********** CARGA DE MÓDULOS **********/
async function loadModule(mod) {
  currentModule = mod;
  const container = document.getElementById("moduleContainer");
  container.innerHTML = "<p>Cargando...</p>";
  
  try {
    const res = await fetchGET({ action: "getItems", tipo: mod });
    if (!res.success) throw new Error(res.message);

    const items = res.items;
    if (!items.length) {
      container.innerHTML = "<p>No hay registros.</p>";
      return;
    }

    let tableHTML = `<table>
      <thead><tr>${Object.keys(items[0]).map(k => `<th>${k}</th>`).join("")}<th>Acciones</th></tr></thead>
      <tbody>
      ${items.map(item => `
        <tr>
          ${Object.keys(item).map(k => `<td>${item[k]}</td>`).join("")}
          <td>
            <button class="crud-btn edit" onclick='editItem("${currentModule}", "${item.ID}")'>Editar</button>
            <button class="crud-btn delete" onclick='deleteItem("${currentModule}", "${item.ID}")'>Eliminar</button>
          </td>
        </tr>`).join("")}
      </tbody>
    </table>`;

    container.innerHTML = tableHTML;

  } catch(err) {
    container.innerHTML = `<p style="color:red;">Error cargando registros: ${err.message}</p>`;
  }
}

/********** AGREGAR REGISTRO **********/
async function uploadItem(mod, nombre, tipoDocumento, archivo) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async function(e) {
      const base64 = btoa(e.target.result);
      const usuario = JSON.parse(localStorage.getItem("usuario")).Nombre || "Anonimo";
      const data = {
        action: "uploadItem",
        tipo: mod,
        nombre,
        tipoDocumento,
        archivo: base64,
        nombreArchivo: archivo.name,
        mimeType: archivo.type,
        usuario
      };

      try {
        const res = await fetchPOST(data);
        if (!res.success) reject(new Error(res.message));
        else resolve(res);
      } catch(err) { reject(err); }
    };

    reader.readAsBinaryString(archivo);
  });
}

/********** EDITAR / ELIMINAR **********/
async function editItem(mod, id) {
  const nuevoNombre = prompt("Ingrese el nuevo nombre:");
  if (!nuevoNombre) return;
  const nuevoTipo = prompt("Ingrese el nuevo tipo:");
  if (!nuevoTipo) return;

  try {
    const res = await fetchPOST({ action: "updateItem", tipo: mod, id, nombre: nuevoNombre, tipoDocumento: nuevoTipo });
    if (!res.success) throw new Error(res.message);
    alert("Registro actualizado");
    loadModule(mod);
  } catch(err) { alert("Error: " + err.message); }
}

async function deleteItem(mod, id) {
  if (!confirm("¿Desea eliminar este registro?")) return;
  try {
    const res = await fetchPOST({ action: "deleteItem", tipo: mod, id });
    if (!res.success) throw new Error(res.message);
    alert("Registro eliminado");
    loadModule(mod);
  } catch(err) { alert("Error: " + err.message); }
}

/********** FILTRADO DE TABLA **********/
function filterTable() {
  const filter = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#moduleContainer tbody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  });
}
