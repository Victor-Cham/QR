const API_URL = "TU_WEB_APP_URL"; // reemplaza con la URL de tu Apps Script Web App

async function login(usuario, contrasena) {
  try {
    // Llamada a la Web App para obtener la lista de personas
    const response = await fetch(`${API_URL}?action=getPersonas`);
    const personas = await response.json();

    // Buscar usuario en la hoja
    const user = personas.find(
      p => (p.DNI === usuario || p.Email === usuario) && p.DOI === contrasena
    );

    if (user) {
      // Redirigir según TipoUsuario
      switch(user.TipoUsuario) {
        case 'SuperAdmin':
          window.location.href = 'superadmin.html';
          break;
        case 'Admin':
          window.location.href = 'admin.html';
          break;
        default:
          window.location.href = 'usuario.html';
      }
    } else {
      alert('Usuario o contraseña incorrecta');
    }

  } catch (error) {
    console.error('Error al conectar con la Web App:', error);
    alert('No se pudo conectar con el servidor. Intente más tarde.');
  }
}

// Captura del formulario de login
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const usuario = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value.trim();
      login(usuario, contrasena);
    });
  }
});

