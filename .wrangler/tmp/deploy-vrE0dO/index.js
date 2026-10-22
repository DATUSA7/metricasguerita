var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/_lib/apps-script.js
async function obtenerDatosYouTube(env) {
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
      `Apps Script respondi\xF3 con HTTP ${respuesta.status}.`
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
__name(obtenerDatosYouTube, "obtenerDatosYouTube");

// worker/index.js
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ruta = url.pathname;
    const rutasAPI = [
      "/api/metrics",
      "/api/top10",
      "/api/top10menos"
    ];
    if (rutasAPI.includes(ruta)) {
      if (request.method !== "GET") {
        return Response.json(
          { ok: false, error: "M\xE9todo no permitido." },
          {
            status: 405,
            headers: { Allow: "GET" }
          }
        );
      }
      try {
        const datos = await obtenerDatosYouTube(env);
        let resultado;
        if (ruta === "/api/metrics") {
          resultado = {
            ok: true,
            channel: datos.channel,
            report: datos.report,
            metrics: datos.metrics
          };
        } else if (ruta === "/api/top10") {
          resultado = {
            ok: true,
            videos: Array.isArray(datos.top10) ? datos.top10 : []
          };
        } else {
          resultado = {
            ok: true,
            videos: Array.isArray(datos.top10menos) ? datos.top10menos : []
          };
        }
        return Response.json(resultado, {
          headers: {
            "Cache-Control": "public, max-age=60"
          }
        });
      } catch (error) {
        console.error(`Error en ${ruta}:`, error);
        return Response.json(
          {
            ok: false,
            error: "No se pudieron consultar los datos."
          },
          { status: 502 }
        );
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
