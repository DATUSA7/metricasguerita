
import { obtenerDatosYouTube } from "../_lib/apps-script.js";

export async function onRequestGet({ env }) {
  try {
    const datos = await obtenerDatosYouTube(env);

    return Response.json(
      {
        ok: true,
        videos: Array.isArray(datos.top10)
          ? datos.top10
          : []
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60"
        }
      }
    );
  } catch (error) {
    console.error("Error en /api/top10:", error);

    return Response.json(
      {
        ok: false,
        error: "No se pudo consultar el TOP 10."
      },
      { status: 502 }
    );
  }
}
