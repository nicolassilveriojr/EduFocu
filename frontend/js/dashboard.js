// ============================================
// DEMO DATA (used when API is unavailable)
// ============================================
const DEMO_ALUNOS = [
  { id: 1, nome: "Ana Silva", matricula: "482910-5", foto_path: null, sala: "Sala 101", sala_id: 1, turno: "Manhã", turno_id: 1, ocorrencias: 3, tempo_desatencao: 45, indice_atencao: 85 },
  { id: 2, nome: "Bruno Costa", matricula: "193048-2", foto_path: null, sala: "Sala 101", sala_id: 1, turno: "Manhã", turno_id: 1, ocorrencias: 7, tempo_desatencao: 120, indice_atencao: 65 },
  { id: 3, nome: "Mariana Souza", matricula: "748291-0", foto_path: null, sala: "Sala 102", sala_id: 2, turno: "Manhã", turno_id: 1, ocorrencias: 1, tempo_desatencao: 15, indice_atencao: 95 },
  { id: 4, nome: "Lucas Lima", matricula: "351940-7", foto_path: null, sala: "Sala 102", sala_id: 2, turno: "Tarde", turno_id: 2, ocorrencias: 5, tempo_desatencao: 90, indice_atencao: 75 },
  { id: 5, nome: "Carlos Mendes", matricula: "502837-1", foto_path: null, sala: "Sala 101", sala_id: 1, turno: "Tarde", turno_id: 2, ocorrencias: 10, tempo_desatencao: 200, indice_atencao: 50 },
  { id: 6, nome: "Fernanda Rocha", matricula: "619043-8", foto_path: null, sala: "Sala 103", sala_id: 3, turno: "Manhã", turno_id: 1, ocorrencias: 2, tempo_desatencao: 30, indice_atencao: 90 },
  { id: 7, nome: "Gabriel Santos", matricula: "384729-6", foto_path: null, sala: "Sala 103", sala_id: 3, turno: "Tarde", turno_id: 2, ocorrencias: 8, tempo_desatencao: 150, indice_atencao: 60 },
  { id: 8, nome: "Helena Oliveira", matricula: "726150-3", foto_path: null, sala: "Sala 102", sala_id: 2, turno: "Manhã", turno_id: 1, ocorrencias: 0, tempo_desatencao: 0, indice_atencao: 100 },
  { id: 9, nome: "Igor Almeida", matricula: "158493-2", foto_path: null, sala: "Sala 101", sala_id: 1, turno: "Manhã", turno_id: 1, ocorrencias: 4, tempo_desatencao: 60, indice_atencao: 80 },
  { id: 10, nome: "Julia Ferreira", matricula: "903267-5", foto_path: null, sala: "Sala 103", sala_id: 3, turno: "Tarde", turno_id: 2, ocorrencias: 6, tempo_desatencao: 110, indice_atencao: 70 },
  { id: 11, nome: "Kevin Ribeiro", matricula: "417382-9", foto_path: null, sala: "Sala 102", sala_id: 2, turno: "Tarde", turno_id: 2, ocorrencias: 12, tempo_desatencao: 240, indice_atencao: 40 },
  { id: 12, nome: "Larissa Pereira", matricula: "830514-7", foto_path: null, sala: "Sala 101", sala_id: 1, turno: "Tarde", turno_id: 2, ocorrencias: 1, tempo_desatencao: 10, indice_atencao: 95 },
];

const DEMO_SALAS = [
  { id: 1, nome: "Sala 101", total_alunos: 4 },
  { id: 2, nome: "Sala 102", total_alunos: 4 },
  { id: 3, nome: "Sala 103", total_alunos: 4 },
];

const DEMO_TURNOS = [
  { id: 1, nome: "Manhã" },
  { id: 2, nome: "Tarde" },
];

// ============================================
// STATE
// ============================================
let allAlunos = [];
let allSalas = [];
let allTurnos = [];
let charts = {};
let currentSort = { key: "nome", dir: "asc" };

// ============================================
// SIDEBAR
// ============================================
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function toggleMenu() {
  sidebar.classList.toggle("active");
  sidebarOverlay.classList.toggle("active");
}

menuToggle.addEventListener("click", toggleMenu);
sidebarOverlay.addEventListener("click", toggleMenu);

// ============================================
// DATE
// ============================================
function setCurrentDate() {
  const el = document.getElementById("currentDate");
  if (!el) return;
  const now = new Date();
  const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  el.textContent = now.toLocaleDateString("pt-BR", opts);
}
setCurrentDate();

// ============================================
// API FETCH
// ============================================
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`Falha ao buscar ${url}:`, e.message);
    return null;
  }
}

async function loadData() {
  const [alunos, salas, turnos] = await Promise.all([
    fetchJSON("/api/alunos"),
    fetchJSON("/api/salas"),
    fetchJSON("/api/turnos"),
  ]);

  allAlunos = alunos || DEMO_ALUNOS;
  allSalas = salas || DEMO_SALAS;
  allTurnos = turnos || DEMO_TURNOS;

  populateFilters();
  updateKPIs();
  renderTable();
  renderRooms();
  renderCharts();

  const badge = document.getElementById("notifBadge");
  const totalWithHighOcc = allAlunos.filter((a) => a.ocorrencias >= 5).length;
  if (badge) {
    badge.textContent = totalWithHighOcc;
    badge.style.display = totalWithHighOcc > 0 ? "flex" : "none";
  }
}

// ============================================
// KPIs
// ============================================
function updateKPIs() {
  const total = allAlunos.length;
  const avgIndice =
    total > 0
      ? Math.round(allAlunos.reduce((s, a) => s + a.indice_atencao, 0) / total)
      : 0;
  const totalOcorr = allAlunos.reduce((s, a) => s + (a.ocorrencias || 0), 0);
  const totalTempo = allAlunos.reduce((s, a) => s + (a.tempo_desatencao || 0), 0);

  document.getElementById("totalAlunos").textContent = total;
  document.getElementById("indiceMedio").textContent = avgIndice + "%";
  document.getElementById("totalOcorrencias").textContent = totalOcorr;
  document.getElementById("tempoDesatencao").textContent = formatTempo(totalTempo);
}

function formatTempo(segundos) {
  if (segundos < 60) return segundos + "s";
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;
  if (min < 60) return `${min}m ${sec}s`;
  const hrs = Math.floor(min / 60);
  const minR = min % 60;
  return `${hrs}h ${minR}m`;
}

// ============================================
// FILTERS
// ============================================
function populateFilters() {
  const salaSelect = document.getElementById("filterSala");
  const turnoSelect = document.getElementById("filterTurno");

  allSalas.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.nome;
    salaSelect.appendChild(opt);
  });

  allTurnos.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.nome;
    turnoSelect.appendChild(opt);
  });
}

document.getElementById("filterSala").addEventListener("change", renderTable);
document.getElementById("filterTurno").addEventListener("change", renderTable);

function getFilteredAlunos() {
  let alunos = [...allAlunos];
  const salaVal = document.getElementById("filterSala").value;
  const turnoVal = document.getElementById("filterTurno").value;
  const searchVal = document.getElementById("searchInput").value.toLowerCase().trim();

  if (salaVal) alunos = alunos.filter((a) => String(a.sala_id) === salaVal);
  if (turnoVal) alunos = alunos.filter((a) => String(a.turno_id) === turnoVal);
  if (searchVal) {
    alunos = alunos.filter(
      (a) =>
        a.nome.toLowerCase().includes(searchVal) ||
        a.matricula.toLowerCase().includes(searchVal)
    );
  }

  const { key, dir } = currentSort;
  alunos.sort((a, b) => {
    let va = a[key] ?? "";
    let vb = b[key] ?? "";
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });

  return alunos;
}

// ============================================
// TABLE
// ============================================
function renderTable() {
  const tbody = document.getElementById("alunosBody");
  const empty = document.getElementById("tableEmpty");
  const alunos = getFilteredAlunos();

  if (alunos.length === 0) {
    tbody.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  tbody.innerHTML = alunos
    .map((a) => {
      const initials = getInitials(a.nome);
      const fotoHtml = a.foto_path
        ? `<img src="${a.foto_path}" alt="${a.nome}" class="table-aluno-photo" />`
        : `<div class="table-aluno-placeholder">${initials}</div>`;

      const indiceBadge = getIndiceBadge(a.indice_atencao);

      return `<tr>
        <td>
          <div class="table-aluno">
            ${fotoHtml}
            <span>${a.nome}</span>
          </div>
        </td>
        <td>${a.matricula}</td>
        <td><span class="badge badge-blue">${a.sala || "--"}</span></td>
        <td>${a.turno || "--"}</td>
        <td>${a.ocorrencias}</td>
        <td>${formatTempo(a.tempo_desatencao)}</td>
        <td>${indiceBadge}</td>
      </tr>`;
    })
    .join("");
}

function getInitials(name) {
  return name
    .split(" ")
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getIndiceBadge(indice) {
  if (indice >= 80) return `<span class="badge badge-green">${indice}%</span>`;
  if (indice >= 50) return `<span class="badge badge-amber">${indice}%</span>`;
  return `<span class="badge badge-red">${indice}%</span>`;
}

// Table sorting
document.querySelectorAll(".data-table th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (currentSort.key === key) {
      currentSort.dir = currentSort.dir === "asc" ? "desc" : "asc";
    } else {
      currentSort = { key, dir: "asc" };
    }
    renderTable();
  });
});

// Search
document.getElementById("searchInput").addEventListener("input", () => {
  renderTable();
  updateCharts();
});

// ============================================
// ROOMS
// ============================================
function renderRooms() {
  const grid = document.getElementById("roomsGrid");
  const maxStudents = Math.max(...allSalas.map((s) => s.total_alunos), 1);

  grid.innerHTML = allSalas
    .map((s) => {
      const pct = (s.total_alunos / maxStudents) * 100;
      const barColor =
        s.total_alunos >= 5 ? "var(--red)" : s.total_alunos >= 3 ? "var(--amber)" : "var(--green)";

      const salaAlunos = allAlunos.filter((a) => a.sala_id === s.id);
      const avgIndice =
        salaAlunos.length > 0
          ? Math.round(salaAlunos.reduce((sum, a) => sum + a.indice_atencao, 0) / salaAlunos.length)
          : 0;

      return `<div class="room-card">
        <div class="room-card-header">
          <span class="room-name">${s.nome}</span>
          <span class="room-students">${s.total_alunos} alunos</span>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.75rem; color:var(--gray-500);">
          <span>Índice médio: <strong style="color:var(--gray-800)">${avgIndice}%</strong></span>
        </div>
        <div class="room-bar">
          <div class="room-bar-fill" style="width:${pct}%; background-color:${barColor};"></div>
        </div>
      </div>`;
    })
    .join("");
}

// ============================================
// CHARTS
// ============================================
function renderCharts() {
  renderAttentionChart();
  renderDistributionChart();
  renderOcorrenciasChart();
  renderSalasChart();
}

function updateCharts() {
  Object.values(charts).forEach((c) => c.destroy());
  charts = {};
  renderCharts();
}

// Chart defaults
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.color = "#6b7280";

function renderAttentionChart() {
  const ctx = document.getElementById("attentionChart");
  if (!ctx) return;

  const alunos = getFilteredAlunos().slice(0, 12);
  const labels = alunos.map((a) => a.nome.split(" ")[0]);
  const data = alunos.map((a) => a.indice_atencao);
  const colors = data.map((v) =>
    v >= 80 ? "#059669" : v >= 50 ? "#d97706" : "#dc2626"
  );

  charts.attention = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Índice de Atenção (%)",
          data,
          backgroundColor: colors.map((c) => c + "33"),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1f2937",
          titleColor: "#ffffff",
          bodyColor: "#d1d5db",
          borderColor: "#374151",
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          callbacks: {
            label: (c) => `Índice: ${c.raw}%`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: "#f3f4f6" },
          ticks: { callback: (v) => v + "%" },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
}

function renderDistributionChart() {
  const ctx = document.getElementById("distributionChart");
  if (!ctx) return;

  const alta = allAlunos.filter((a) => a.indice_atencao >= 80).length;
  const media = allAlunos.filter((a) => a.indice_atencao >= 50 && a.indice_atencao < 80).length;
  const baixa = allAlunos.filter((a) => a.indice_atencao < 50).length;

  charts.distribution = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Alta (≥80%)", "Média (50-79%)", "Baixa (<50%)"],
      datasets: [
        {
          data: [alta, media, baixa],
          backgroundColor: ["#059669", "#d97706", "#dc2626"],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1f2937",
          titleColor: "#ffffff",
          bodyColor: "#d1d5db",
          borderColor: "#374151",
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          callbacks: {
            label: (c) => `${c.label}: ${c.raw} aluno(s)`,
          },
        },
      },
    },
  });

  const legendEl = document.getElementById("distributionLegend");
  legendEl.innerHTML = [
    { color: "#059669", label: `Alta: ${alta}` },
    { color: "#d97706", label: `Média: ${media}` },
    { color: "#dc2626", label: `Baixa: ${baixa}` },
  ]
    .map(
      (l) =>
        `<div class="legend-item"><span class="legend-dot" style="background-color:${l.color}"></span>${l.label}</div>`
    )
    .join("");
}

function renderOcorrenciasChart() {
  const ctx = document.getElementById("ocorrenciasChart");
  if (!ctx) return;

  const sorted = [...allAlunos]
    .filter((a) => a.ocorrencias > 0)
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .slice(0, 8);

  charts.ocorrencias = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sorted.map((a) => a.nome.split(" ")[0]),
      datasets: [
        {
          label: "Ocorrências",
          data: sorted.map((a) => a.ocorrencias),
          backgroundColor: "#dc262633",
          borderColor: "#dc2626",
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1f2937",
          titleColor: "#ffffff",
          bodyColor: "#d1d5db",
          borderColor: "#374151",
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#f3f4f6" },
          ticks: { stepSize: 1 },
        },
        y: {
          grid: { display: false },
        },
      },
    },
  });
}

function renderSalasChart() {
  const ctx = document.getElementById("salasChart");
  if (!ctx) return;

  const salaData = allSalas.map((s) => {
    const alunos = allAlunos.filter((a) => a.sala_id === s.id);
    const avg = alunos.length > 0 ? Math.round(alunos.reduce((sum, a) => sum + a.indice_atencao, 0) / alunos.length) : 0;
    return { nome: s.nome, media: avg, total: s.total_alunos };
  });

  charts.salas = new Chart(ctx, {
    type: "bar",
    data: {
      labels: salaData.map((s) => s.nome),
      datasets: [
        {
          label: "Índice Médio (%)",
          data: salaData.map((s) => s.media),
          backgroundColor: ["#2563eb33", "#7c3aed33", "#05966933"],
          borderColor: ["#2563eb", "#7c3aed", "#059669"],
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1f2937",
          titleColor: "#ffffff",
          bodyColor: "#d1d5db",
          borderColor: "#374151",
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          callbacks: {
            label: (c) => {
              const sala = salaData[c.dataIndex];
              return [`Índice: ${c.raw}%`, `${sala.total} alunos`];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: "#f3f4f6" },
          ticks: { callback: (v) => v + "%" },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
}

// ============================================
// EXPORT CSV
// ============================================
document.getElementById("exportBtn").addEventListener("click", () => {
  const alunos = getFilteredAlunos();
  if (alunos.length === 0) return;

  const headers = ["Aluno", "Matrícula", "Sala", "Turno", "Ocorrências", "Tempo Desatenção (s)", "Índice Atenção (%)"];
  const rows = alunos.map((a) => [a.nome, a.matricula, a.sala || "", a.turno || "", a.ocorrencias, a.tempo_desatencao, a.indice_atencao]);

  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `edufoco_alunos_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

// ============================================
// INIT
// ============================================
loadData();
