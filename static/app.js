console.log("✅ app.js caricato (versione con dropdown)"); // <— se non lo vedi in console, stai ancora usando cache/vecchio file

const app = document.querySelector("#app");

const columns = [
  { key: "id", label: "N.ro Documento" },
  { key: "vendor", label: "Proveedor" },
  { key: "type", label: "Tipo" },
  { key: "status", label: "Estado" },
  { key: "docDate", label: "Fecha documento" },
  { key: "uploadDate", label: "Fecha subida" },
  { key: "amount", label: "Importe" },
  { key: "payStatus", label: "Estado pago" },
];

const state = {
  q: "",
  sort: "uploadDate",
  sortDir: "desc",
  status: "ALL",
  payStatus: "ALL",
  from: "",
  to: "",
  visibleCols: Object.fromEntries(columns.map(c => [c.key, true])),
  rows: [],
};

boot();

async function boot() {
  closeMenusOnOutsideClick();
  await load();
  render();
}

async function load() {
  const params = new URLSearchParams({
    q: state.q,
    status: state.status,
    payStatus: state.payStatus,
    fromDate: state.from,
    toDate: state.to,
    sort: state.sort,
    sortDir: state.sortDir,
  });

  const res = await fetch(`/api/invoices?${params.toString()}`);
  const data = await res.json();
  state.rows = data.rows || [];
}

function render() {
  app.innerHTML = `
    <div class="container">
      <div class="h1">Documentos</div>

      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search">
            🔎
            <input id="q" placeholder="Buscar..." value="${escapeHtml(state.q)}" />
          </div>

          <div class="dropdown">
            <button class="btn" id="sortBtn">
              Ordenar por: <b>${escapeHtml(labelForSort(state.sort))}</b> ▾
            </button>
            <div class="menu hide" id="sortMenu">
              <div class="menu-title">Ordenar por</div>
              ${["uploadDate","docDate","amount","id"].map(k => `
                <label>
                  <input type="radio" name="sort" value="${k}" ${state.sort===k?"checked":""} />
                  ${escapeHtml(labelForSort(k))}
                </label>
              `).join("")}
              <hr/>
              <label><input type="radio" name="sortDir" value="desc" ${state.sortDir==="desc"?"checked":""} /> Desc</label>
              <label><input type="radio" name="sortDir" value="asc" ${state.sortDir==="asc"?"checked":""} /> Asc</label>
            </div>
          </div>

          <div class="dropdown">
            <button class="btn" id="filterBtn">
              <span class="dot"></span> Filtrar ▾
            </button>
            <div class="menu hide" id="filterMenu">
              <div class="menu-title">Filtrar</div>

              <label>
                Estado:
                <select id="status">
                  ${["ALL","Digitalizado","Requieren revisión","Rechazados"].map(s => `
                    <option value="${s}" ${state.status===s?"selected":""}>${s}</option>
                  `).join("")}
                </select>
              </label>

              <label>
                Estado pago:
                <select id="payStatus">
                  ${["ALL","Vencido","Pagado","Pendiente"].map(s => `
                    <option value="${s}" ${state.payStatus===s?"selected":""}>${s}</option>
                  `).join("")}
                </select>
              </label>

              <label>
                Da:
                <input id="from" type="date" value="${escapeHtml(state.from)}" />
              </label>

              <label>
                A:
                <input id="to" type="date" value="${escapeHtml(state.to)}" />
              </label>
            </div>
          </div>
        </div>

        <div class="toolbar-right">
          <button class="btn" id="exportBtn">Exportar</button>

          <div class="dropdown">
            <button class="btn" id="colsBtn">Columnas ▾</button>
            <div class="menu hide" id="colsMenu">
              <div class="menu-title">Columnas</div>
              ${columns.map(c => `
                <label>
                  <input type="checkbox" data-col="${escapeHtml(c.key)}" ${state.visibleCols[c.key] ? "checked" : ""} />
                  ${escapeHtml(c.label)}
                </label>
              `).join("")}
            </div>
          </div>

          <button class="btn primary" id="newBtn">＋ Nuevo gasto</button>
        </div>
      </div>

      <div class="tablewrap">
        <table>
          <thead>
            <tr>
              ${visibleColumns().map(c => `<th>${escapeHtml(c.label)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${state.rows.map(r => renderRow(r)).join("") || `<tr><td colspan="${visibleColumns().length}" class="muted">Nessun documento</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="footer">Tip: clicca “Filtrar” → deve aprire un menu.</div>
    </div>
  `;

  bindToolbar();
}

function renderRow(r) {
  const cols = visibleColumns();
  return `
    <tr>
      ${cols.map(c => `<td>${renderCell(c.key, r[c.key])}</td>`).join("")}
    </tr>
  `;
}

function renderCell(key, value) {
  if (key === "amount") return `<span class="money">${formatMoney(value)}</span>`;
  if (key === "id") return `<code>${escapeHtml(value)}</code>`;
  return escapeHtml(value);
}

function bindToolbar() {
  // Debug click: deve stampare in console
  document.querySelector("#filterBtn")?.addEventListener("click", () => {
    console.log("👆 click Filtrar");
    toggleMenu("#filterMenu");
  });

  document.querySelector("#sortBtn")?.addEventListener("click", () => toggleMenu("#sortMenu"));
  document.querySelector("#colsBtn")?.addEventListener("click", () => toggleMenu("#colsMenu"));

  document.querySelector("#q")?.addEventListener("input", debounce(async (e) => {
    state.q = e.target.value;
    await load();
    render();
  }, 250));

  document.querySelectorAll("input[name='sort']").forEach(el =>
    el.addEventListener("change", async (e) => { state.sort = e.target.value; await load(); render(); })
  );
  document.querySelectorAll("input[name='sortDir']").forEach(el =>
    el.addEventListener("change", async (e) => { state.sortDir = e.target.value; await load(); render(); })
  );

  document.querySelector("#status")?.addEventListener("change", async (e) => { state.status = e.target.value; await load(); render(); });
  document.querySelector("#payStatus")?.addEventListener("change", async (e) => { state.payStatus = e.target.value; await load(); render(); });
  document.querySelector("#from")?.addEventListener("change", async (e) => { state.from = e.target.value; await load(); render(); });
  document.querySelector("#to")?.addEventListener("change", async (e) => { state.to = e.target.value; await load(); render(); });

  document.querySelectorAll("#colsMenu input[type='checkbox']").forEach(el => {
    el.addEventListener("change", (e) => {
      state.visibleCols[e.target.dataset.col] = e.target.checked;
      if (visibleColumns().length === 0) {
        state.visibleCols[e.target.dataset.col] = true;
        e.target.checked = true;
        alert("Devi lasciare almeno una colonna visibile.");
      }
      render();
    });
  });

  document.querySelector("#exportBtn")?.addEventListener("click", () => {
    const colKeys = visibleColumns().map(c => c.key).join(",");
    const params = new URLSearchParams({
      q: state.q,
      status: state.status,
      payStatus: state.payStatus,
      fromDate: state.from,
      toDate: state.to,
      sort: state.sort,
      sortDir: state.sortDir,
      cols: colKeys,
    });
    window.location.href = `/api/invoices.csv?${params.toString()}`;
  });

  document.querySelector("#newBtn")?.addEventListener("click", () => {
    alert("Qui apri un modal o una pagina di inserimento.");
  });
}

function visibleColumns() {
  return columns.filter(c => state.visibleCols[c.key]);
}

function labelForSort(k) {
  if (k === "uploadDate") return "Fecha subida";
  if (k === "docDate") return "Fecha documento";
  if (k === "amount") return "Importe";
  if (k === "id") return "N.ro Documento";
  return k;
}

function toggleMenu(sel) {
  const el = document.querySelector(sel);
  if (!el) return;
  el.classList.toggle("hide");
}

function closeMenusOnOutsideClick() {
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".menu").forEach(m => {
      const dd = m.closest(".dropdown");
      if (!dd) return;
      if (!dd.contains(e.target)) m.classList.add("hide");
    });
  });
}

function formatMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "";
  return v.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
