
import { obtenerDatosYouTube } from "../_lib/apps-script.js";

export async function onRequestGet({ env }) {
  try {
    const datos = await obtenerDatosYouTube(env);

    return Response.json(
      {
        ok: true,
        channel: datos.channel,
        report: datos.report,
        metrics: datos.metrics
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60"
        }
      }
    );
  } catch (error) {
    console.error("Error en /api/metrics:", error);

    return Response.json(
      {
        ok: false,
        error: "No se pudieron consultar las métricas."
      },
      { status: 502 }
    );
  }
}
