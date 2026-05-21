/* ============================================================
   ANATOMIA HUMANA NORMAL - FCM-UNL
   app.js — vanilla JS, JSONBin storage
   ============================================================ */

var JSONBIN_BIN_ID  = "6a0e21ca6877513b27a633ed";
var JSONBIN_API_KEY = "$2a$10$6c0dZOH07xqt.KdlmrNBgeR5v89c1ip3gDlbbBIZTQwXgxDgp7J/u";
var JSONBIN_URL     = "https://api.jsonbin.io/v3/b/" + JSONBIN_BIN_ID;

// =============================================================
// AREAS (corregidas sin prefijos, Obstetricia = solo Bases)
// =============================================================

var AREAS = {
  Medicina: {
    "1er Año": [
      "Crecimiento y Desarrollo",
      "Nutricion"
    ],
    "2do Año": [
      "Sexualidad, Genero y Reproduccion",
      "Trabajo y Tiempo Libre",
      "Ser Humano y su Medio"
    ]
  },
  Obstetricia: {
    "Ciclo Unico": [
      "Bases"
    ]
  }
};

var DOCENTES = [
  "Brenda",
  "Damian Soria",
  "Derian Enria",
  "Francisco Hadad",
  "Hugo Peralta",
  "Joaquin Rudolf",
  "Jonas Paniagua",
  "Mariano Pauloni",
  "Maximiliano Echevarria",
  "Ricardo Escowich"
];

var SAMPLE_DATA = [
  {
    id: "1", nombre: "Osteologia del Miembro Superior", tipo: "Seminario",
    carrera: "Medicina", anio: "1er Año", area: "Crecimiento y Desarrollo",
    fecha: "2025-08-12", fechaFin: "", hora: "10:00",
    docentes: ["Ricardo Escowich"], estado: "Pendiente", notas: ""
  },
  {
    id: "2", nombre: "Nutricion y Metabolismo", tipo: "Taller",
    carrera: "Medicina", anio: "1er Año", area: "Nutricion",
    fecha: "2025-08-15", fechaFin: "2025-08-16", hora: "08:30",
    docentes: ["Maximiliano Echevarria"], estado: "Pendiente", notas: "Taller de dos dias"
  },
  {
    id: "3", nombre: "Anatomia del Sistema Reproductor", tipo: "Seminario",
    carrera: "Medicina", anio: "2do Año", area: "Sexualidad, Genero y Reproduccion",
    fecha: "2025-08-18", fechaFin: "", hora: "14:00",
    docentes: ["Damian Soria", "Derian Enria"], estado: "En curso", notas: ""
  },
  {
    id: "4", nombre: "Ergonomia Laboral", tipo: "Taller",
    carrera: "Medicina", anio: "2do Año", area: "Trabajo y Tiempo Libre",
    fecha: "2025-07-30", fechaFin: "", hora: "09:00",
    docentes: ["Todos"], estado: "Finalizado", notas: ""
  },
  {
    id: "5", nombre: "Pelvis Femenina", tipo: "Seminario",
    carrera: "Obstetricia", anio: "Ciclo Unico", area: "Bases",
    fecha: "2025-08-20", fechaFin: "", hora: "08:00",
    docentes: ["Brenda", "Jonas Paniagua"], estado: "Pendiente", notas: ""
  }
];

// =============================================================
// ESTADO
// =============================================================

var activities   = [];
var editMode     = false;
var currentView  = "dashboard";
var calYear      = new Date().getFullYear();
var calMonth     = new Date().getMonth();
var dashFilter   = "all";
var searchQuery  = "";

// =============================================================
// INIT / CLOUD
// =============================================================

function init() {
  updateAreaFilter();
  showLoadingOverlay(true);
  loadFromCloud();
}

function loadFromCloud() {
  fetch(JSONBIN_URL + "/latest", { headers: { "X-Master-Key": JSONBIN_API_KEY } })
  .then(function(res) { return res.json(); })
  .then(function(json) {
    var data = json.record;
    if (Array.isArray(data) && data.length > 0 && !data[0].init) {
      // Migrar registros viejos que no tienen fechaFin o docentes como array
      activities = data.map(migrate);
    } else {
      activities = JSON.parse(JSON.stringify(SAMPLE_DATA));
    }
    showLoadingOverlay(false);
    renderAll();
  })
  .catch(function() {
    var saved = localStorage.getItem("anatomia_fcm_data");
    activities = saved ? JSON.parse(saved).map(migrate) : JSON.parse(JSON.stringify(SAMPLE_DATA));
    showLoadingOverlay(false);
    renderAll();
    showToast("Sin conexion. Usando datos locales.");
  });
}

// Migra registros viejos al nuevo formato
function migrate(a) {
  if (!a.fechaFin) a.fechaFin = "";
  if (!Array.isArray(a.docentes)) {
    a.docentes = a.docentes ? a.docentes.split(",").map(function(d){ return d.trim(); }) : [];
  }
  return a;
}

function save() {
  localStorage.setItem("anatomia_fcm_data", JSON.stringify(activities));
  fetch(JSONBIN_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Key": JSONBIN_API_KEY },
    body: JSON.stringify(activities)
  }).catch(function() { showToast("Sin conexion. Cambio guardado localmente."); });
}

function showLoadingOverlay(show) {
  var el = document.getElementById("loadingOverlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "loadingOverlay";
    el.setAttribute("style",
      "position:fixed;inset:0;background:rgba(247,244,239,.9);" +
      "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
      "z-index:999;font-family:DM Sans,sans-serif;gap:14px;");
    el.innerHTML =
      "<div style='width:36px;height:36px;border:3px solid #e0dbd3;" +
      "border-top-color:#1a2744;border-radius:50%;animation:spin .7s linear infinite'></div>" +
      "<div style='color:#6b6660;font-size:14px'>Cargando datos...</div>" +
      "<style>@keyframes spin{to{transform:rotate(360deg)}}</style>";
    document.body.appendChild(el);
  }
  el.style.display = show ? "flex" : "none";
}

// =============================================================
// HELPERS
// =============================================================

function statusClass(estado) {
  if (estado === "Finalizado") return "s-fin";
  if (estado === "En curso")   return "s-enc";
  return "s-pend";
}

function typeBadgeClass(tipo) {
  if (tipo === "Seminario")   return "type-sem";
  if (tipo === "Taller")      return "type-tal";
  if (tipo === "Optativo I")  return "type-opt1";
  if (tipo === "Optativo II") return "type-opt2";
  if (tipo === "Final")       return "type-fin";
  return "type-sem";
}

function typeShort(tipo) {
  if (tipo === "Seminario")   return "SEM";
  if (tipo === "Taller")      return "TAL";
  if (tipo === "Optativo I")  return "OPT1";
  if (tipo === "Optativo II") return "OPT2";
  if (tipo === "Final")       return "FIN";
  return tipo.substring(0,3).toUpperCase();
}

function formatDate(str) {
  if (!str) return "";
  var p = str.split("-");
  var months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return parseInt(p[2]) + " " + months[parseInt(p[1])-1] + " " + p[0];
}

function formatDateRange(a) {
  if (a.fechaFin && a.fechaFin !== a.fecha && a.fechaFin !== "") {
    return formatDate(a.fecha) + " — " + formatDate(a.fechaFin);
  }
  return formatDate(a.fecha) + (a.hora ? " " + a.hora : "");
}

function docentesStr(a) {
  if (!a.docentes || !a.docentes.length) return "—";
  if (a.docentes.indexOf("Todos") > -1) return "Todos";
  return a.docentes.join(", ");
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  var today = new Date(); today.setHours(0,0,0,0);
  var d = new Date(dateStr + "T00:00:00");
  var diff = Math.round((d - today) / 86400000);
  return diff;
}

function emptyState(msg) {
  return "<div class='empty-state'><p>" + msg + "</p></div>";
}

function activeActivities() {
  return activities.filter(function(a){ return a.estado !== "Finalizado"; });
}
function archivedActivities() {
  return activities.filter(function(a){ return a.estado === "Finalizado"; });
}

// =============================================================
// NAVEGACION
// =============================================================

function setView(viewId) {
  var views = document.querySelectorAll(".view");
  for (var i = 0; i < views.length; i++) views[i].classList.remove("active");
  var target = document.getElementById("view-" + viewId);
  if (target) target.classList.add("active");
  currentView = viewId;

  var navIds = ["dashboard","calendario","actividades","docentes"];
  for (var i = 0; i < navIds.length; i++) {
    var el = document.getElementById("nav-"  + navIds[i]); if (el) el.classList.remove("active");
    var em = document.getElementById("mnav-" + navIds[i]); if (em) em.classList.remove("active");
  }
  var al = document.getElementById("nav-"  + viewId); if (al) al.classList.add("active");
  var am = document.getElementById("mnav-" + viewId); if (am) am.classList.add("active");

  renderAll();
}

function toggleDropdown() {
  var dd = document.getElementById("navDropdown");
  if (dd) dd.classList.toggle("open");
}
function closeDropdown() {
  var dd = document.getElementById("navDropdown");
  if (dd) dd.classList.remove("open");
}
document.addEventListener("click", function(e) {
  var dd = document.getElementById("navDropdown");
  if (dd && !dd.contains(e.target)) dd.classList.remove("open");
});

function toggleMobileMenu() {
  var menu = document.getElementById("mobileMenu");
  var ov   = document.getElementById("mobileOverlay");
  if (!menu) return;
  var open = menu.classList.contains("open");
  if (open) { menu.classList.remove("open"); ov.classList.remove("active"); }
  else      { menu.classList.add("open");    ov.classList.add("active"); }
}
function closeMobileMenu() {
  var menu = document.getElementById("mobileMenu");
  var ov   = document.getElementById("mobileOverlay");
  if (menu) menu.classList.remove("open");
  if (ov)   ov.classList.remove("active");
}

// =============================================================
// MODO EDICION
// =============================================================

function toggleMode() {
  editMode = !editMode;
  var modeBtn       = document.getElementById("modeBtn");
  var modeIcon      = document.getElementById("modeIcon");
  var modeLabel     = document.getElementById("modeLabel");
  var addBtn        = document.getElementById("addBtn");
  var mobileModeBtn = document.getElementById("mobileModeBtn");
  var mobileAddBtn  = document.getElementById("mobileAddBtn");
  var actHeader     = document.getElementById("actionsHeader");

  if (editMode) {
    if (modeBtn)       modeBtn.classList.add("edit-mode");
    if (modeIcon)      modeIcon.textContent  = "✏️";
    if (modeLabel)     modeLabel.textContent = "Edicion";
    if (addBtn)        addBtn.style.display  = "flex";
    if (mobileModeBtn) { mobileModeBtn.textContent = "✏️ Modo Edicion"; mobileModeBtn.classList.add("edit-mode"); }
    if (mobileAddBtn)  mobileAddBtn.style.display  = "flex";
    if (actHeader)     actHeader.style.display = "";
    showToast("Modo Edicion activado");
  } else {
    if (modeBtn)       modeBtn.classList.remove("edit-mode");
    if (modeIcon)      modeIcon.textContent  = "👁";
    if (modeLabel)     modeLabel.textContent = "Vista";
    if (addBtn)        addBtn.style.display  = "none";
    if (mobileModeBtn) { mobileModeBtn.textContent = "👁 Modo Vista"; mobileModeBtn.classList.remove("edit-mode"); }
    if (mobileAddBtn)  mobileAddBtn.style.display  = "none";
    if (actHeader)     actHeader.style.display = "none";
    showToast("Modo Vista activado");
  }
  renderAll();
}

// =============================================================
// RENDER PRINCIPAL
// =============================================================

function renderAll() {
  // stats ocultos (mantener compatibilidad)
  var tot = document.getElementById("statTotal"); if (tot) tot.textContent = activities.length;
  var fin = document.getElementById("statFin");   if (fin) fin.textContent = archivedActivities().length;
  var pen = document.getElementById("statPend");  if (pen) pen.textContent = activeActivities().filter(function(a){ return a.estado==="Pendiente"; }).length;
  var enc = document.getElementById("statEnc");   if (enc) enc.textContent = activeActivities().filter(function(a){ return a.estado==="En curso"; }).length;

  if (currentView === "dashboard")   renderDashboard();
  if (currentView === "actividades") renderActividades();
  if (currentView === "archivados")  renderArchivados();
  if (currentView === "calendario")  renderCalendar();
  if (currentView === "docentes")    renderDocentes();
  if (currentView === "medicina")    renderCareer("Medicina",    "medicinaContent");
  if (currentView === "obstetricia") renderCareer("Obstetricia", "obstetriciaContent");
}

// =============================================================
// DASHBOARD
// =============================================================

function filterDash(val, el) {
  dashFilter = val;
  var chips = document.querySelectorAll("#dashFilterChips .chip");
  for (var i = 0; i < chips.length; i++) chips[i].classList.remove("active");
  el.classList.add("active");
  renderDashboard();
}

function renderDashboard() {
  var list = activeActivities();
  if (dashFilter !== "all") list = list.filter(function(a){ return a.carrera === dashFilter; });
  if (searchQuery) list = list.filter(function(a){
    return a.nombre.toLowerCase().indexOf(searchQuery) > -1 ||
           docentesStr(a).toLowerCase().indexOf(searchQuery) > -1 ||
           a.area.toLowerCase().indexOf(searchQuery) > -1;
  });
  list.sort(function(a,b){ return a.fecha.localeCompare(b.fecha); });

  var el = document.getElementById("dashList");
  if (!list.length) { el.innerHTML = emptyState("No hay actividades proximas"); return; }
  var html = "";
  for (var i = 0; i < list.length; i++) html += activityItem(list[i]);
  el.innerHTML = html;
}

function activityItem(a) {
  return "<div class='activity-item'>" +
    "<div class='act-type-badge " + typeBadgeClass(a.tipo) + "'>" + typeShort(a.tipo) + "</div>" +
    "<div class='act-info'>" +
      "<div class='act-name'>" + a.nombre + "</div>" +
      "<div class='act-meta'>" +
        "<span>📅 " + formatDateRange(a) + "</span>" +
        (docentesStr(a) !== "—" ? "<span>👤 " + docentesStr(a) + "</span>" : "") +
      "</div>" +
      "<div class='act-meta' style='margin-top:3px'>" +
        "<span class='area-tag " + (a.carrera==="Medicina"?"career-tag-med":"career-tag-obs") + "'>" + a.carrera + "</span>" +
        "<span style='margin-left:6px;color:var(--gray4)'>" + a.area + "</span>" +
      "</div>" +
    "</div>" +
    "<div class='act-right'>" +
      "<span class='status-badge " + statusClass(a.estado) + "'>" + a.estado + "</span>" +
      "<span style='font-size:11px;color:var(--gray3)'>" + a.anio + "</span>" +
    "</div>" +
  "</div>";
}

// =============================================================
// ARCHIVADOS
// =============================================================

function renderArchivados() {
  var list = archivedActivities();
  list.sort(function(a,b){ return b.fecha.localeCompare(a.fecha); });
  var el = document.getElementById("archivedList");
  if (!list.length) { el.innerHTML = emptyState("No hay actividades archivadas"); return; }
  var html = "";
  for (var i = 0; i < list.length; i++) html += activityItem(list[i]);
  el.innerHTML = html;
}

// =============================================================
// TABLA ACTIVIDADES
// =============================================================

function updateAreaFilter() {
  var sel = document.getElementById("filterArea");
  if (!sel) return;
  var allAreas = [];
  var carreras = Object.keys(AREAS);
  for (var c = 0; c < carreras.length; c++) {
    var years = AREAS[carreras[c]];
    var anios = Object.keys(years);
    for (var y = 0; y < anios.length; y++) {
      var areaList = years[anios[y]];
      for (var a = 0; a < areaList.length; a++) {
        if (allAreas.indexOf(areaList[a]) === -1) allAreas.push(areaList[a]);
      }
    }
  }
  var opts = "<option value=''>Todas las areas</option>";
  for (var i = 0; i < allAreas.length; i++) opts += "<option value='" + allAreas[i] + "'>" + allAreas[i] + "</option>";
  sel.innerHTML = opts;
}

function renderActividades() {
  var fc = document.getElementById("filterCarrera").value;
  var fa = document.getElementById("filterArea").value;
  var ft = document.getElementById("filterTipo").value;
  var fe = document.getElementById("filterEstado").value;
  var list = activeActivities().filter(function(a) {
    return (!fc || a.carrera === fc) &&
           (!fa || a.area === fa) &&
           (!ft || a.tipo === ft) &&
           (!fe || a.estado === fe) &&
           (!searchQuery || a.nombre.toLowerCase().indexOf(searchQuery) > -1 ||
            docentesStr(a).toLowerCase().indexOf(searchQuery) > -1);
  });
  list.sort(function(a,b){ return a.fecha.localeCompare(b.fecha); });

  var actHeader = document.getElementById("actionsHeader");
  if (actHeader) actHeader.style.display = editMode ? "" : "none";

  var tbody = document.getElementById("actividadesBody");
  if (!list.length) {
    tbody.innerHTML = "<tr><td colspan='7' style='text-align:center;padding:40px;color:var(--gray3)'>No hay actividades</td></tr>";
    return;
  }
  var html = "";
  for (var i = 0; i < list.length; i++) {
    var a = list[i];
    html += "<tr>" +
      "<td style='font-weight:500;color:var(--navy)'>" + a.nombre + "</td>" +
      "<td><span class='status-badge " + typeBadgeClass(a.tipo) + "' style='font-size:11px'>" + a.tipo + "</span></td>" +
      "<td><span class='area-tag " + (a.carrera==="Medicina"?"career-tag-med":"career-tag-obs") + "'>" + a.carrera + "</span>" +
        "<div style='font-size:11px;color:var(--gray3);margin-top:3px'>" + a.anio + " · " + a.area + "</div></td>" +
      "<td style='white-space:nowrap'>" + formatDateRange(a) + "</td>" +
      "<td style='color:var(--gray4)'>" + docentesStr(a) + "</td>" +
      "<td><span class='status-badge " + statusClass(a.estado) + "'>" + a.estado + "</span></td>" +
      (editMode ?
        "<td><div class='action-btns'>" +
          "<button class='btn-icon' onclick='editActivity(\"" + a.id + "\")'>✏️</button>" +
          "<button class='btn-icon del' onclick='deleteActivity(\"" + a.id + "\")'>🗑️</button>" +
        "</div></td>" : "") +
    "</tr>";
  }
  tbody.innerHTML = html;
}

// =============================================================
// CALENDARIO
// =============================================================

function renderCalendar() {
  var months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  document.getElementById("calTitle").textContent = months[calMonth] + " " + calYear;
  var grid = document.getElementById("calGrid");
  var days = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
  var html = "";
  for (var d = 0; d < days.length; d++) html += "<div class='cal-day-name'>" + days[d] + "</div>";

  var first     = new Date(calYear, calMonth, 1).getDay();
  var totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  var today     = new Date();

  for (var i = 0; i < first; i++) html += "<div class='cal-day empty'></div>";

  for (var d = 1; d <= totalDays; d++) {
    var mm = String(calMonth+1).padStart(2,"0");
    var dd = String(d).padStart(2,"0");
    var dateStr = calYear + "-" + mm + "-" + dd;
    var isToday = d===today.getDate() && calMonth===today.getMonth() && calYear===today.getFullYear();

    // Mostrar actividades activas que caen en este dia (rango multidia incluido)
    var dayActs = activeActivities().filter(function(a){
      if (a.fechaFin && a.fechaFin > a.fecha) {
        return dateStr >= a.fecha && dateStr <= a.fechaFin;
      }
      return a.fecha === dateStr;
    });

    html += "<div class='cal-day" + (isToday?" today":"") + "'>";
    html += "<div class='cal-num'>" + d + "</div>";
    for (var j = 0; j < Math.min(dayActs.length, 3); j++) {
      var a = dayActs[j];
      var cls = a.carrera==="Medicina" ? "ev-med" : "ev-obs";
      html += "<div class='cal-event " + cls + "'>" + a.nombre + "</div>";
    }
    if (dayActs.length > 3) html += "<div style='font-size:10px;color:var(--gray3)'>+" + (dayActs.length-3) + " mas</div>";
    html += "</div>";
  }

  var remaining = (7 - ((first + totalDays) % 7)) % 7;
  for (var i = 0; i < remaining; i++) html += "<div class='cal-day empty'></div>";
  grid.innerHTML = html;
}

function calPrev() { calMonth--; if (calMonth<0){ calMonth=11; calYear--; } renderCalendar(); }
function calNext() { calMonth++; if (calMonth>11){ calMonth=0;  calYear++; } renderCalendar(); }

// =============================================================
// DOCENTES
// =============================================================

function renderDocentes() {
  var el = document.getElementById("docentesContent");
  var today = new Date(); today.setHours(0,0,0,0);
  var html = "";

  for (var di = 0; di < DOCENTES.length; di++) {
    var nombre = DOCENTES[di];

    // Actividades donde figura este docente (o "Todos")
    var myActs = activeActivities().filter(function(a){
      return a.docentes && (a.docentes.indexOf(nombre) > -1 || a.docentes.indexOf("Todos") > -1);
    });

    // Proxima actividad
    var upcoming = myActs.filter(function(a){
      var diff = daysUntil(a.fecha);
      return diff !== null && diff >= 0;
    });
    upcoming.sort(function(a,b){ return a.fecha.localeCompare(b.fecha); });
    var next = upcoming.length ? upcoming[0] : null;

    var countLabel = myActs.length === 0 ? "Sin actividades asignadas" :
                     myActs.length === 1 ? "1 actividad" :
                     myActs.length + " actividades";

    var nextLabel = "";
    if (next) {
      var diff = daysUntil(next.fecha);
      if (diff === 0) nextLabel = "Hoy: " + next.nombre;
      else if (diff === 1) nextLabel = "Manana: " + next.nombre;
      else nextLabel = "En " + diff + " dias: " + next.nombre;
    } else {
      nextLabel = "Sin proximas actividades";
    }

    html += "<div class='docente-card'>" +
      "<div class='docente-avatar'>" + nombre.charAt(0).toUpperCase() + "</div>" +
      "<div class='docente-info'>" +
        "<div class='docente-nombre'>" + nombre + "</div>" +
        "<div class='docente-count'>" + countLabel + "</div>" +
        "<div class='docente-next" + (next ? " has-next" : "") + "'>" + nextLabel + "</div>" +
        (myActs.length > 0 ?
          "<div class='docente-acts'>" +
          myActs.slice(0,3).map(function(a){
            return "<span class='area-tag'>" + a.nombre + "</span>";
          }).join(" ") +
          (myActs.length > 3 ? "<span class='area-tag'>+" + (myActs.length-3) + " mas</span>" : "") +
          "</div>" : "") +
      "</div>" +
    "</div>";
  }

  el.innerHTML = html || emptyState("Sin docentes");
}

// =============================================================
// VISTA CARRERA
// =============================================================

function renderCareer(carrera, containerId) {
  var el = document.getElementById(containerId);
  var areasByYear = AREAS[carrera];
  var html = "";
  var anios = Object.keys(areasByYear);
  for (var y = 0; y < anios.length; y++) {
    var anio = anios[y];
    var areas = areasByYear[anio];
    html += "<div class='year-section'><div class='year-title'>" + anio + "</div>";
    for (var a = 0; a < areas.length; a++) {
      var area = areas[a];
      var acts = activeActivities().filter(function(x){ return x.carrera===carrera && x.area===area; });
      acts.sort(function(a,b){ return a.fecha.localeCompare(b.fecha); });
      html += "<div class='area-subtitle'>" + area + "</div>";
      if (!acts.length) {
        html += "<div style='color:var(--gray3);font-size:13px;padding:6px 0 16px'>Sin actividades registradas</div>";
      } else {
        html += "<div class='activity-list' style='margin-bottom:20px'>";
        for (var i = 0; i < acts.length; i++) html += activityItem(acts[i]);
        html += "</div>";
      }
    }
    html += "</div>";
  }
  el.innerHTML = html;
}

// =============================================================
// BUSQUEDA
// =============================================================

function handleSearch() {
  searchQuery = document.getElementById("searchInput").value.toLowerCase().trim();
  renderAll();
}

// =============================================================
// CRUD
// =============================================================

function updateAreaSelect() {
  var carrera = document.getElementById("fCarrera").value;
  var sel = document.getElementById("fArea");
  var areas = AREAS[carrera] || {};
  var opts = "";
  var anios = Object.keys(areas);
  for (var y = 0; y < anios.length; y++) {
    opts += "<optgroup label='" + anios[y] + "'>";
    var areaList = areas[anios[y]];
    for (var a = 0; a < areaList.length; a++) {
      opts += "<option value='" + areaList[a] + "'>" + areaList[a] + "</option>";
    }
    opts += "</optgroup>";
  }
  sel.innerHTML = opts;
}

function getAnioFromArea(carrera, area) {
  var years = AREAS[carrera] || {};
  var anios = Object.keys(years);
  for (var y = 0; y < anios.length; y++) {
    if (years[anios[y]].indexOf(area) > -1) return anios[y];
  }
  return "";
}

function openModal(id) {
  var overlay = document.getElementById("modalOverlay");
  overlay.classList.add("open");
  document.getElementById("editId").value = id || "";
  document.getElementById("modalTitle").textContent = id ? "Editar Actividad" : "Nueva Actividad";

  if (id) {
    var a = null;
    for (var i = 0; i < activities.length; i++) { if (activities[i].id === id) { a = activities[i]; break; } }
    if (a) {
      document.getElementById("fNombre").value  = a.nombre;
      document.getElementById("fTipo").value    = a.tipo;
      document.getElementById("fCarrera").value = a.carrera;
      updateAreaSelect();
      document.getElementById("fArea").value    = a.area;
      document.getElementById("fFecha").value   = a.fecha;
      document.getElementById("fFechaFin").value = a.fechaFin || "";
      document.getElementById("fHora").value    = a.hora || "";
      document.getElementById("fEstado").value  = a.estado;
      document.getElementById("fNotas").value   = a.notas || "";
      // Seleccionar docentes
      var sel = document.getElementById("fDocentes");
      var docArr = Array.isArray(a.docentes) ? a.docentes : [];
      for (var j = 0; j < sel.options.length; j++) {
        sel.options[j].selected = docArr.indexOf(sel.options[j].value) > -1;
      }
    }
  } else {
    document.getElementById("fNombre").value    = "";
    document.getElementById("fTipo").value      = "Seminario";
    document.getElementById("fCarrera").value   = "Medicina";
    updateAreaSelect();
    document.getElementById("fFecha").value     = "";
    document.getElementById("fFechaFin").value  = "";
    document.getElementById("fHora").value      = "";
    document.getElementById("fEstado").value    = "Pendiente";
    document.getElementById("fNotas").value     = "";
    var sel = document.getElementById("fDocentes");
    for (var j = 0; j < sel.options.length; j++) sel.options[j].selected = false;
  }
}

function saveActivity() {
  var nombre = document.getElementById("fNombre").value.trim();
  if (!nombre) { showToast("El nombre es obligatorio"); return; }

  var area    = document.getElementById("fArea").value;
  var carrera = document.getElementById("fCarrera").value;

  // Recoger docentes seleccionados
  var sel = document.getElementById("fDocentes");
  var docentes = [];
  for (var j = 0; j < sel.options.length; j++) {
    if (sel.options[j].selected) docentes.push(sel.options[j].value);
  }

  var data = {
    nombre:   nombre,
    tipo:     document.getElementById("fTipo").value,
    carrera:  carrera,
    anio:     getAnioFromArea(carrera, area),
    area:     area,
    fecha:    document.getElementById("fFecha").value,
    fechaFin: document.getElementById("fFechaFin").value,
    hora:     document.getElementById("fHora").value,
    estado:   document.getElementById("fEstado").value,
    docentes: docentes,
    notas:    document.getElementById("fNotas").value.trim()
  };

  var editId = document.getElementById("editId").value;
  if (editId) {
    for (var i = 0; i < activities.length; i++) {
      if (activities[i].id === editId) { activities[i] = Object.assign({}, activities[i], data); break; }
    }
    showToast("Actividad actualizada");
  } else {
    data.id = String(Date.now());
    activities.push(data);
    showToast("Actividad creada");
  }
  save();
  closeModal();
  renderAll();
}

function editActivity(id)   { openModal(id); }

function deleteActivity(id) {
  if (!confirm("Seguro que queres eliminar esta actividad?")) return;
  activities = activities.filter(function(a){ return a.id !== id; });
  save();
  renderAll();
  showToast("Actividad eliminada");
}

function closeModal() { document.getElementById("modalOverlay").classList.remove("open"); }
function closeModalOutside(e) { if (e.target === document.getElementById("modalOverlay")) closeModal(); }

// =============================================================
// TOAST
// =============================================================

function showToast(msg) {
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(function(){ t.classList.remove("show"); }, 2800);
}

// =============================================================
// ARRANCAR
// =============================================================
init();
