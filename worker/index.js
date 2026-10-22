
import { obtenerDatosYouTube } from "../functions/_lib/apps-script.js";

const ORIGENES_PERMITIDOS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://graficatop10menos.datusa777.workers.dev"
];

function respuestaJSON(request, body, status = 200) {
  const origen = request.headers.get("Origin");
  const headers = {
    "Cache-Control": "no-cache"
  };

  if (origen && ORIGENES_PERMITIDOS.includes(origen)) {
    headers["Access-Control-Allow-Origin"] = origen;
    headers["Vary"] = "Origin";
  }

  return Response.json(body, { status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ruta = url.pathname;

    const rutasAPI = [
      "/api/metrics",
      "/api/top10",
      "/api/top10menos"
    ];

    if (!rutasAPI.includes(ruta)) {
      return env.ASSETS.fetch(request);
    }

    const origen = request.headers.get("Origin");

    if (
      origen &&
      !ORIGENES_PERMITIDOS.includes(origen)
    ) {
      return Response.json(
        { ok: false, error: "Origen no permitido." },
        { status: 403 }
      );
    }

    if (request.method === "OPTIONS") {
      const headers = {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
      };

      if (origen) {
        headers["Access-Control-Allow-Origin"] = origen;
        headers["Vary"] = "Origin";
      }

      return new Response(null, {
        status: 204,
        headers
      });
    }

    if (request.method !== "GET") {
      return respuestaJSON(
        request,
        { ok: false, error: "Método no permitido." },
        405
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

      return respuestaJSON(request, resultado);
    } catch (error) {
      console.error(`Error en ${ruta}:`, error);

      return respuestaJSON(
        request,
        {
          ok: false,
          error: "No se pudieron consultar los datos."
        },
        502
      );
    }
  }
};
