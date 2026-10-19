
export async function obtenerDatosYouTube(env) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_TOKEN) {
    throw new Error("Falta configurar la URL o el token de Apps Script.");
  }

  const respuesta = await fetch(env.APPS_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8"
    },
    body: JSON.stringify({
      token: env.APPS_SCRIPT_TOKEN
    }),
    redirect: "follow"
  });

  if (!respuesta.ok) {
    throw new Error(
      `Apps Script respondió con HTTP ${respuesta.status}.`
    );
  }

  const datos = await respuesta.json();

  if (!datos.ok) {
    throw new Error(
      datos.error || "Apps Script no pudo devolver los datos."
    );
  }

  return datos;
}
