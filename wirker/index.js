
import { obtenerDatosYouTube } from "../functions/_lib/apps-script.js";

export default {
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
          { ok: false, error: "Método no permitido." },
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
            videos: Array.isArray(datos.top10)
              ? datos.top10
              : []
          };
        } else {
          resultado = {
            ok: true,
            videos: Array.isArray(datos.top10menos)
              ? datos.top10menos
              : []
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
