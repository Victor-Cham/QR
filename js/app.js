const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzt77BLIMnAJYsrsAKAF2zm5A6HDorPXV4c7FcXm97PpbYCMZX2xT29LTZojfhX2tU7VA/exec";

let allItems = [];
let currentModule = "comunicados"; // Valor inicial

// Cargar registros de un módulo
async function loadModule(module) {
  if (!module) {
    console.error("No se ha definido el módulo a cargar");
    return;
  }
  currentModule = module;

  try {
    const res = await fetch(`${SCRIPT_URL}?action=getItems&tipo=${encodeURIComponent(module)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Error al cargar datos");

    allItems = data.items || [];
    renderTable(allItems);
  } catch (err) {
    alert("Error cargando módulo: " + err.message);
    console.error(err);
  }
}

// Renderizar tabla en #moduleContainer
function renderTable(items) {
  const container = document.getElementById("moduleContainer");
  if (!items.length) {
    container.innerHTML = "<p>No hay registros para mostrar.</p>";
    return;
  }

  let html = `<table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Nombre</th>
        <th>Tipo</th>
        <th>Archivo</th>
        <th>QR</th>
        <th>Usuario</th>
        <th>Fecha</th>
        <th>Visitas</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>`;

  items.forEach(item => {
    html += `<tr>
      <td>${item.ID || ""}</td>
      <td>${item.Nombre || ""}</td>
      <td>${item.TipoDocumento || ""}</td>
      <td><a href="${item.Link || "#"}" target="_blank">Ver archivo</a></td>
      <td><a href="${item.QR || "#"}" target="_blank">QR</a></td>
      <td>${item.Usuario || ""}</td>
      <td>${item.Fecha || ""}</td>
      <td>${item.Visitas || 0}</td>
      <td>
        <button class="crud-btn edit" onclick="editItem('${item.ID}')">Editar</button>
        <button class="crud-btn delete" onclick="deleteItem('${item.ID}')">Eliminar</button>
      </td>
    </tr>`;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

// Filtrar tabla por nombre
function filterTable() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allItems.filter(item => (item.Nombre || "").toLowerCase().includes(query));
  renderTable(filtered);
}

// Subir un nuevo registro
async function uploadItem(module, nombre, tipoDocumento, archivo) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      const base64Data = reader.result.split(",")[1];

      const formData = new FormData();
      formData.append("action", "uploadItem");
      formData.append("tipo", module);
      formData.append("nombre", nombre);
      formData.append("tipoDocumento", tipoDocumento);
      formData.append("usuario", JSON.parse(localStorage.getItem("usuario")).Nombre || "");
      formData.append("archivo", base64Data);
      formData.append("nombreArchivo", archivo.name);
      formData.append("mimeType", archivo.type);

      try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
        const data = await res.json();
        if (!data.success) return reject(new Error(data.message || "Error subiendo archivo"));
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = err => reject(err);
    reader.readAsDataURL(archivo);
  });
}

// Eliminar registro
async function deleteItem(id) {
  if (!confirm("¿Desea eliminar este registro?")) return;
  const formData = new FormData();
  formData.append("action", "deleteItem");
  formData.append("id", id);
  formData.append("tipo", currentModule);

  try {
    const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Error eliminando registro");
    await loadModule(currentModule);
  } catch (err) {
    alert("Error al eliminar: " + err.message);
  }
}

// Editar registro (solo nombre y tipo)
function editItem(id) {
  const item = allItems.find(i => i.ID === id);
  if (!item) return alert("Registro no encontrado");

  const newNombre = prompt("Nuevo nombre:", item.Nombre || "");
  if (newNombre === null) return;

  const newTipo = prompt("Nuevo tipo:", item.TipoDocumento || "");
  if (newTipo === null) return;

  const formData = new FormData();
  formData.append("action", "updateItem");
  formData.append("id", id);
  formData.append("tipo", currentModule);
  formData.append("nombre", newNombre.trim());
  formData.append("tipoDocumento", newTipo.trim());

  fetch(SCRIPT_URL, { method: "POST", body: formData })
    .then(res => res.json())
    .then(data => {
      if (!data.success) throw new Error(data.message || "Error actualizando registro");
      loadModule(currentModule);
    })
    .catch(err => alert("Error editando registro: " + err.message));
}

// Cerrar sesión
function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}
