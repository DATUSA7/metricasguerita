import "./style.css";

// IMPORTANTE:
// Conserva aquí las siete URLs reales que ya utilizas.
const charts = [
  {
    title: "Crecimiento de suscriptores",
    description: "Evolución de la comunidad del canal.",
    url: "https://graficatop10.datusa777.workers.dev/"
  },
  {
    title: "Rendimiento de videos",
    description: "Análisis visual del contenido publicado.",
    url: "https://graficatop10menos.datusa777.workers.dev/"
  }
];

const metricDefinitions = [
  {
    key: "subscribers",
    label: "Suscriptores",
    description: "Tamaño de la comunidad",
    icon: "↗"
  },
  {
    key: "videos",
    label: "Videos publicados",
    description: "Contenido del canal",
    icon: "▣"
  },
  {
    key: "views",
    label: "Visualizaciones",
    description: "Alcance acumulado",
    icon: "◉"
  },
  {
    key: "likes",
    label: "Likes",
    description: "Interacciones positivas",
    icon: "♡"
  },
  {
    key: "comments",
    label: "Comentarios",
    description: "Conversaciones generadas",
    icon: "☰"
  },
  {
  key: "avgViews",
  label: "Promedio de vistas por video",
  description: "Alcance medio histórico",
  icon: "◉",
  decimals: 0,
  suffix: ""
},
{
  key: "avgLikes",
  label: "Promedio de likes por video",
  description: "Likes medios por publicación",
  icon: "♡",
  decimals: 0,
  suffix: ""
},
{
  key: "avgComments",
  label: "Promedio de comentarios por video",
  description: "Comentarios medios por publicación",
  icon: "☰",
  decimals: 1,
  suffix: ""
},
{
  key: "totalInteractions",
  label: "Interacciones totales",
  description: "Likes y comentarios acumulados",
  icon: "↗",
  decimals: 0,
  suffix: ""
},
{
  key: "interactionRate",
  label: "Tasa histórica de interacción",
  description: "Interacciones por visualización",
  icon: "%",
  decimals: 2,
  suffix: "%"
}
];

const $ = (selector) => document.querySelector(selector);

const metricsGrid = $("#metrics-grid");
const chartsContainer = $("#charts-container");
const socialLinks = $("#social-links");

const numberFormat = new Intl.NumberFormat("es-MX");


const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
});

// Interpreta una fecha ISO como fecha de calendario UTC,
// evitando que cambie al día anterior por la zona horaria.
function formatReportDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return dateFormatter.format(date);
}

function renderReportMeta(report) {
  const updatedElement = document.querySelector("#last-updated");
  const periodElement = document.querySelector("#analysis-period");

  const updatedDate = formatReportDate(report?.lastUpdated);
  const startDate = formatReportDate(report?.period?.start);
  const endDate = formatReportDate(report?.period?.end);

  if (updatedDate) {
    updatedElement.textContent = updatedDate;
    updatedElement.dateTime = report.lastUpdated;
  } else {
    updatedElement.textContent = "Fecha no disponible";
    updatedElement.removeAttribute("datetime");
  }

  if (startDate && endDate) {
    periodElement.textContent =
      `${startDate} — ${endDate}`;
  } else {
    periodElement.textContent = "Periodo no disponible";
  }
}


let reportData = null;
let activeFrame = null;
let activeChartId = null;
let pendingChartId = null;
let animationFrameId = null;
let pageIsLeaving = false;

const chartVisibility = new Map();

// --------------------------------------------------
// 1. CARGAR DATOS LOCALES
// --------------------------------------------------


async function loadReport() {
  try {
    const response = await fetch("/api/metrics", {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(
        data.error || "La API no pudo devolver las métricas."
      );
    }

    // La API proporciona los datos actualizados del canal.
    reportData = {
      ...data,
      channel: {
        ...(data.channel || {})
      },
      report: data.report || null,
      metrics: data.metrics || {}
    };

    // Mantener la descripción y la imagen si existen
    // en el archivo local anterior.
    try {
      const localResponse = await fetch("/metrics.json", {
        cache: "no-cache"
      });

      if (localResponse.ok) {
        const localData = await localResponse.json();

        reportData.channel = {
          ...(localData.channel || {}),
          ...(reportData.channel || {})
        };

        reportData.socials = localData.socials || [];
      }
    } catch (localError) {
      console.warn(
        "No se pudieron cargar los datos descriptivos locales:",
        localError
      );
    }

    renderHero(reportData.channel);
    renderReportMeta(reportData.report);
    renderMetrics(reportData.metrics);
    renderSocials(reportData.socials || []);
  } catch (error) {
    console.error("No se pudieron cargar las métricas de /api/metrics:", error);

    metricsGrid.replaceChildren();

    const message = document.createElement("p");
    message.className = "error-message";
    message.textContent =
      "No fue posible cargar las métricas del canal.";

    metricsGrid.appendChild(message);
  }
}


// --------------------------------------------------
// 2. HERO
// --------------------------------------------------

function renderHero(channel) {
  $("#channel-name").textContent =
    channel.name || "Canal de YouTube";

  $("#channel-handle").textContent =
    channel.handle || "";

  $("#channel-description").textContent =
    channel.description || "";

  const image = $("#channel-image");

  image.alt = `Imagen de ${channel.name || "el canal"}`;

  if (channel.image) {
    image.src = channel.image;
  }
}

// --------------------------------------------------
// 3. TARJETAS DE MÉTRICAS
// --------------------------------------------------

function renderMetrics(metrics) {
// calculo del segundo bloque de métricas
const videos = Number(metrics?.videos) || 0;
const views = Number(metrics?.views) || 0;
const likes = Number(metrics?.likes) || 0;
const comments = Number(metrics?.comments) || 0;

const calculatedMetrics = {
  ...metrics,

  avgViews: videos > 0 ? views / videos : 0,
  avgLikes: videos > 0 ? likes / videos : 0,
  avgComments: videos > 0 ? comments / videos : 0,

  totalInteractions: likes + comments,

  interactionRate:
    views > 0
      ? ((likes + comments) / views) * 100
      : 0
};

  metricsGrid.replaceChildren();

  for (const [index, definition] of metricDefinitions.entries()) {
    // const value = Number(metrics?.[definition.key]);
    const value = Number(calculatedMetrics[definition.key]);

    const card = document.createElement("article");
    card.className = "metric-card";
    card.style.setProperty("--card-index", index);

    const top = document.createElement("div");
    top.className = "metric-card-top";

    const label = document.createElement("span");
    label.className = "metric-label";
    label.textContent = definition.label;

    const icon = document.createElement("span");
    icon.className = "metric-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = definition.icon;

    const number = document.createElement("p");
    number.className = "metric-value";
    number.dataset.decimals = String(definition.decimals ?? 0);
      number.dataset.suffix = definition.suffix ?? "";
    number.dataset.target =
      Number.isFinite(value) ? String(value) : "0";
      number.dataset.decimals = String(definition.decimals ?? 0);
// number.dataset.suffix = definition.suffix ?? "";
    number.textContent = "0";
    number.setAttribute("aria-label", definition.label);

    const description = document.createElement("p");
    description.className = "metric-description";
    description.textContent = definition.description;

    top.append(label, icon);
    card.append(top, number, description);
    metricsGrid.appendChild(card);
  }

  observeMetricCards();
}

// --------------------------------------------------
// 4. ANIMACIÓN DE CONTADORES
// --------------------------------------------------

let metricObserver;

function observeMetricCards() {
  metricObserver?.disconnect();

  const cards = document.querySelectorAll(".metric-card");

  metricObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const card = entry.target;
        metricObserver.unobserve(card);

        const number = card.querySelector(".metric-value");
        animateCounter(number);
      }
    },
    { threshold: 0.35 }
  );

  cards.forEach((card) => metricObserver.observe(card));
}

function animateCounter(element) {
  const target = Number(element.dataset.target);

  if (!Number.isFinite(target) || target <= 0) {
    element.textContent = numberFormat.format(0);
    return;
  }

  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);

    // Curva de desaceleración suave.
    const eased = 1 - Math.pow(1 - progress, 4);

    const current = Math.round(target * eased);
    element.textContent = numberFormat.format(current);

    if (progress < 1 && !pageIsLeaving) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = numberFormat.format(target);
    }
  }

  requestAnimationFrame(tick);
}

// --------------------------------------------------
// 5. REDES SOCIALES
// --------------------------------------------------

const socialLabels = {
  YouTube: "YT",
  Instagram: "IG",
  TikTok: "TK",
  Facebook: "FB"
};

function renderSocials(socials = []) {
  socialLinks.replaceChildren();

  for (const social of socials.slice(0, 4)) {
    // Aceptar exclusivamente URLs HTTP y HTTPS.
    let parsedUrl;

    try {
      parsedUrl = new URL(social.url);
    } catch {
      continue;
    }

    if (!["https:", "http:"].includes(parsedUrl.protocol)) {
      continue;
    }

    const link = document.createElement("a");

    link.className = "social-link";
    link.href = parsedUrl.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute(
      "aria-label",
      `Visitar ${social.name}`
    );

    const abbreviation = document.createElement("span");
    abbreviation.className = "social-abbreviation";
    abbreviation.textContent =
      socialLabels[social.name] || social.name.slice(0, 2).toUpperCase();

    const name = document.createElement("span");
    name.textContent = social.name;

    const arrow = document.createElement("span");
    arrow.className = "social-arrow";
    arrow.textContent = "↗";
    arrow.setAttribute("aria-hidden", "true");

    link.append(abbreviation, name, arrow);
    socialLinks.appendChild(link);
  }
}

// --------------------------------------------------
// 6. CREAR LAS SIETE SECCIONES DE GRÁFICAS
// --------------------------------------------------

function renderCharts() {
  const fragment = document.createDocumentFragment();

  charts.forEach((chart, index) => {
    const section = document.createElement("article");

    section.className = "chart-card";
    section.dataset.chartId = String(index + 1);

    const heading = document.createElement("div");
    heading.className = "chart-heading";

    const titleGroup = document.createElement("div");

    const number = document.createElement("span");
    number.className = "chart-number";
    number.textContent =
      `VISUALIZACIÓN ${String(index + 1).padStart(2, "0")}`;

    const title = document.createElement("h3");
    title.textContent = chart.title;

    const description = document.createElement("p");
    description.textContent = chart.description;

    const badge = document.createElement("span");
    badge.className = "chart-badge";
    badge.textContent = "INTERACTIVO";

    titleGroup.append(number, title, description);
    heading.append(titleGroup, badge);

    const frameContainer = document.createElement("div");
    frameContainer.className = "chart-frame";

    const placeholder = document.createElement("div");
    placeholder.className = "chart-placeholder";
    placeholder.textContent =
      "La gráfica se cargará cuando llegues a esta sección.";

    frameContainer.appendChild(placeholder);
    section.append(heading, frameContainer);

    chartVisibility.set(section, 0);
    fragment.appendChild(section);
  });

  chartsContainer.appendChild(fragment);
}

// --------------------------------------------------
// 7. GESTIÓN DEL CICLO DE VIDA DE LOS IFRAMES
// --------------------------------------------------

function unloadActiveChart() {
  // Cancelar una actualización pendiente.
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (!activeFrame) {
    activeChartId = null;
    return;
  }

  const oldFrame = activeFrame;

  // Limpiar las referencias antes de retirar el iframe.
  activeFrame = null;
  activeChartId = null;

  oldFrame.removeAttribute("src");
  oldFrame.remove();
}

function loadChart(index) {
  if (pageIsLeaving) return;

  const chart = charts[index];
  const section = [...chartVisibility.keys()].find(
    (item) => Number(item.dataset.chartId) === index + 1
  );

  if (!chart || !section) return;

  if (activeChartId === index + 1 && activeFrame) {
    return;
  }

  // Descargar la gráfica anterior antes de montar la nueva.
  unloadActiveChart();

  const container = section.querySelector(".chart-frame");
  const placeholder = container.querySelector(".chart-placeholder");

  const frame = document.createElement("iframe");

  frame.className = "chart-iframe";
  frame.title = chart.title;
  frame.loading = "eager";
  frame.allow = "fullscreen";
  frame.referrerPolicy = "strict-origin-when-cross-origin";

  placeholder.hidden = false;
  placeholder.textContent = `Cargando: ${chart.title}...`;

  frame.addEventListener("load", () => {
    if (activeFrame !== frame) return;

    placeholder.hidden = true;
  });

  frame.addEventListener("error", () => {
    if (activeFrame !== frame) return;

    placeholder.hidden = false;
    placeholder.textContent =
      "No se pudo cargar esta gráfica. Verifica su URL.";
  });

  activeFrame = frame;
  activeChartId = index + 1;

  container.appendChild(frame);
  frame.src = chart.url;
}

function updateActiveChart() {
  if (pageIsLeaving) return;

  let winner = null;
  let maxRatio = 0;

  for (const [section, ratio] of chartVisibility) {
    if (ratio > maxRatio) {
      winner = section;
      maxRatio = ratio;
    }
  }

  if (!winner || maxRatio <= 0) {
    pendingChartId = null;
    unloadActiveChart();
    return;
  }

  const nextId = Number(winner.dataset.chartId) - 1;

  if (nextId === activeChartId - 1) return;

  // Agrupar cambios del observer en un solo frame de navegador.
  pendingChartId = nextId;

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = requestAnimationFrame(() => {
    animationFrameId = null;

    if (pendingChartId === null || pageIsLeaving) return;

    const index = pendingChartId;
    pendingChartId = null;

    loadChart(index);
  });
}

const chartObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      chartVisibility.set(
        entry.target,
        entry.isIntersecting ? entry.intersectionRatio : 0
      );
    }

    updateActiveChart();
  },
  {
    root: null,
    rootMargin: "0px",
    threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
  }
);

renderCharts();

document.querySelectorAll(".chart-card").forEach((section) => {
  chartObserver.observe(section);
});

// --------------------------------------------------
// 8. LIMPIEZA AL SALIR DE LA PÁGINA
// --------------------------------------------------

window.addEventListener("pagehide", () => {
  pageIsLeaving = true;

  chartObserver.disconnect();
  metricObserver?.disconnect();

  chartVisibility.clear();

  unloadActiveChart();
});

// Inicializar datos.
loadReport();
