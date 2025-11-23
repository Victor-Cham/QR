/************************************************************
 *          URL DE LA WEB APP (Google Apps Script)
 ************************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbzual47SlXlozqzIsnJsBVBUg39OCKKDHyaDJMajV_YGUOi5cjKltZWkrmbC4-k4wn4sg/exec";

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
 *                  DASHBOARD SUPERADMIN
 ************************************************************/
async function getStats() {
  try {
    const resp = await fetch(`${API_URL}?action=getStats`);
    const data = await resp.json();
    return data.success ? data : {usuarios:0, comunicados:0, documentos:0, anexos:0};
  } catch(err) {
    console.error("Error al obtener estadísticas:", err);
    return {usuarios:0, comunicados:0, documentos:0, anexos:0};
  }
}

/************************************************************
 *          INICIALIZACIÓN SEGÚN ROL
 ************************************************************/
document.addEventListener('DOMContentLoaded', async () => {
  // Captura del login
  const form = document.getElementById('loginForm');
  if(form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const usuario = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value.trim();
      login(usuario, contrasena);
    });
  }

  // Inicialización según sesión
  let user = null;
  try {
    const usuarioStr = localStorage.getItem('usuario');
    if(usuarioStr) user = JSON.parse(usuarioStr);
  } catch(e) {
    console.error("Error parseando sesión:", e);
    localStorage.removeItem('usuario');
  }

  if(!user) return; // Si no hay sesión, se queda en login

  const tipo = user.TipoUsuario?.trim().toLowerCase() || "";

  // Solo inicializar dashboard si existen elementos de la página
  try {
    if(tipo === "admin" && document.querySelector("#adminDashboard")) {
      const comunicados = await getItems("comunicados");
      const documentos = await getItems("documentos");
      const anexos = await getItems("anexos");
      console.log("Comunicados:", comunicados);
      console.log("Documentos:", documentos);
      console.log("Anexos:", anexos);
    } else if(tipo === "superadmin" && document.querySelector("#superAdminDashboard")) {
      const stats = await getStats();
      console.log("Dashboard stats:", stats);
    } else if(tipo === "usuario" && document.querySelector("#usuarioDashboard")) {
      const documentos = await getItems("documentos");
      const anexos = await getItems("anexos");
      console.log("Documentos:", documentos);
      console.log("Anexos:", anexos);
    }
  } catch (error) {
    console.error("Error al inicializar la página:", error);
    alert("Error al cargar los datos. Intente recargar la página.");
  }
});
