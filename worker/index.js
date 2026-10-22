
import { obtenerDatosYouTube } from "../functions/_lib/apps-script.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ruta = url.pathname;

    // Las rutas API se procesan en este Worker.
    if (ruta === "/api/metrics" || ruta === "/api/top10") {
      if (request.method !== "GET") {
        return Response.json(
          { ok: false, error: "Método no permitido." },
          {
            status: 405,
            headers: { Allow: "GET" }
          }
        );
      }

      try {
        const datos = await obtenerDatosYouTube(env);

        const resultado =
          ruta === "/api/metrics"
            ? {
                ok: true,
                channel: datos.channel,
                report: datos.report,
                metrics: datos.metrics
              }
            : {
                ok: true,
                videos: Array.isArray(datos.top10)
                  ? datos.top10
                  : []
              };

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

    // El resto de las rutas se sirve desde los archivos de la landing.
    return env.ASSETS.fetch(request);
  }
};
