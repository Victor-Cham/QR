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
  const resp = await fetch(`${API_URL}?action=getItems&tipo=${tipo}`);
  const data = await resp.json();
  if(!data.success) throw new Error(data.message || "Error al obtener datos");
  return data.items;
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
  const resp = await fetch(`${API_URL}?action=getStats`);
  const data = await resp.json();
  if(!data.success) throw new Error("No se pudieron cargar las estadísticas");
  return data;
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

  // Inicialización segura según sesión
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

  try {
    if(tipo === "admin") {
      const comunicados = await getItems("comunicados");
      const documentos = await getItems("documentos");
      const anexos = await getItems("anexos");
      console.log("Comunicados:", comunicados);
      console.log("Documentos:", documentos);
      console.log("Anexos:", anexos);
      // TODO: renderizar tablas en admin.html
    } else if(tipo === "superadmin") {
      const stats = await getStats();
      console.log("Dashboard stats:", stats);
      // TODO: renderizar gráficos en superadmin.html
    } else if(tipo === "usuario") {
      const documentos = await getItems("documentos");
      const anexos = await getItems("anexos");
      console.log("Documentos:", documentos);
      console.log("Anexos:", anexos);
      // TODO: vista solo lectura en usuario.html
    }
  } catch (error) {
    console.error("Error al inicializar la página:", error);
    alert("Error al cargar los datos. Intente recargar la página.");
  }
});


