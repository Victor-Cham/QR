const API_URL = "https://script.google.com/macros/s/AKfycbzual47SlXlozqzIsnJsBVBUg39OCKKDHyaDJMajV_YGUOi5cjKltZWkrmbC4-k4wn4sg/exec";

// LOGIN REAL → Llama a action=login
async function login(usuario, contrasena) {
  try {
    const response = await fetch(`${API_URL}?action=login&usuario=${usuario}&contrasena=${contrasena}`);
    const data = await response.json();

    console.log("Respuesta del servidor:", data);

    if (!data.success) {
      alert("Usuario o contraseña incorrecta");
      return;
    }

    const tipo = data.usuario.TipoUsuario;

    if (tipo === "SuperAdmin") {
      window.location.href = "superadmin.html";
    } else if (tipo === "Admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "usuario.html";
    }

  } catch (error) {
    console.error("Error en login:", error);
    alert("No se pudo conectar con el servidor.");
  }
}

