const API_URL = "https://script.google.com/macros/s/AKfycbzual47SlXlozqzIsnJsBVBUg39OCKKDHyaDJMajV_YGUOi5cjKltZWkrmbC4-k4wn4sg/exec";

async function login(usuario, contrasena) {
  try {
    const response = await fetch(`${API_URL}?action=login&usuario=${encodeURIComponent(usuario)}&contrasena=${encodeURIComponent(contrasena)}`);
    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Usuario o contraseña incorrecta");
      return;
    }

    // Normalizamos el TipoUsuario para evitar errores de espacio o mayúsculas
    const tipo = result.usuario.TipoUsuario.trim().toLowerCase();

    switch(tipo) {
      case "superadmin":
        localStorage.setItem('usuario', JSON.stringify(result.usuario));
        window.location.href = "superadmin.html";
        break;
      case "admin":
        localStorage.setItem('usuario', JSON.stringify(result.usuario));
        window.location.href = "admin.html";
        break;
      case "usuario":
        localStorage.setItem('usuario', JSON.stringify(result.usuario));
        window.location.href = "usuario.html";
        break;
      default:
        alert("Tipo de usuario no válido");
    }

  } catch (error) {
    console.error("Error al conectar con la Web App:", error);
    alert("No se pudo conectar con el servidor. Intente más tarde.");
  }
}

// Captura del formulario
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if(form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const usuario = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value.trim();
      login(usuario, contrasena);
    });
  }
});
