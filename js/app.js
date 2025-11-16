const API_URL = "https://script.google.com/macros/s/AKfycbzual47SlXlozqzIsnJsBVBUg39OCKKDHyaDJMajV_YGUOi5cjKltZWkrmbC4-k4wn4sg/exec";

async function login(usuario, contrasena) {
  try {
    // Llamada a la API para verificar credenciales
    const response = await fetch(`${API_URL}?action=login&usuario=${encodeURIComponent(usuario)}&contrasena=${encodeURIComponent(contrasena)}`);
    const result = await response.json();

    // Si el login falla, muestra el mensaje
    if (!result.success) {
      alert(result.message || "Error en el login");
      return;
    }

    // Guardar los datos del usuario en localStorage para futuras validaciones
    localStorage.setItem('usuario', JSON.stringify(result.usuario));

    // Redirigir según el tipo de usuario
    switch(result.usuario.TipoUsuario) {
      case "Super Admin":  // Asegúrate de que el tipo usuario tenga un espacio
        window.location.href = "superadmin.html";
        break;
      case "Admin":
        window.location.href = "admin.html";
        break;
      default:
        window.location.href = "usuario.html";
    }

  } catch (error) {
    console.error("Error al conectar con la Web App:", error);
    alert("No se pudo conectar con el servidor. Intente más tarde.");
  }
}

// Captura del formulario y envío del login
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
