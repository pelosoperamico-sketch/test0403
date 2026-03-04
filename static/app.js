const app = document.querySelector("#app");

const state = {
  q: "",
  status: "ALL",
  payStatus: "ALL",
  rows: [],
};

boot();

async function boot() {
  await load();
  render();
  closeMenusOnOutsideClick();
}

async function load() {
  const params = new URLSearchParams({
    q: state.q,
    status: state.status,
    payStatus: state.payStatus,
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
            🔎 <input id="q" placeholder="Buscar..." value="${escapeHtml(state.q)}" />
          </div>

          <div class="dropdown">
            <button class="btn" id="sortBtn">Ordenar por: <b>Fecha subida</b> ▾</button>
            <div class="menu hide" id="sortMenu">
              <div class="menu-title">Ordenar por</div>
              <label><input type="radio" name="sort" checked /> Fecha subida</label>
              <label><input type="radio" name="sort" /> Fecha documento</label>
              <label><input type="radio" name="sort" /> Importe</label>
              <div class="footer">Demo: solo UI</div>
            </div>
          </div>

          <div class="dropdown">
            <button class="btn" id="filterBtn"><span class="dot"></span>Filtrar ▾</button>
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

              <button class="btn" id="applyBtn">Aplicar</button>
            </div>
          </div>
        </div>

        <div class="toolbar-right">
          <button class="btn" id="exportBtn">Exportar</button>
          <div class="dropdown">
            <button class="btn" id="colsBtn">Columnas ▾</button>
            <div class="menu hide" id="colsMenu">
              <div class="menu-title">Columnas</div>
              <label><input type="checkbox" checked /> N.ro Documento</label>
              <label><input type="checkbox" checked /> Proveedor</label>
              <label><input type="checkbox" checked /> Tipo</label>
              <label><input type="checkbox" checked /> Estado</label>
              <div class="footer">Demo: solo UI</div>
            </div>
          </div>
          <button class="btn primary" id="newBtn">＋ Nuevo gasto</button>
        </div>
      </div>

      <div class="tablewrap">
        <table>
          <thead>
            <tr>
              <th>N.ro Documento</th><th>Proveedor</th><th>Tipo</th><th>Estado</th>
              <th>Fecha documento</th><th>Fecha subida</th><th>Importe</th><th>Estado pago</th>
            </tr>
          </thead>
          <tbody id="rows">
            ${state.rows.map(r => `
              <tr>
                <td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.vendor)}</td><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.status)}</td>
                <td>${escapeHtml(r.docDate)}</td><td>${escapeHtml(r.uploadDate)}</td><td>${escapeHtml(r.amount)}</td><td>${escapeHtml(r.payStatus)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="footer">Ora “Filtrar” apre un menu e “Aplicar” aggiorna i dati.</div>
    </div>
  `;

  bind();
}

function bind() {
  // search
  document.querySelector("#q").addEventListener("input", debounce(async (e) => {
    state.q = e.target.value;
    await load();
    render();
  }, 250));

  // open menus
  document.querySelector("#filterBtn").addEventListener("click", () => toggleMenu("filterMenu"));
  document.querySelector("#sortBtn").addEventListener("click", () => toggleMenu("sortMenu"));
  document.querySelector("#colsBtn").addEventListener("click", () => toggleMenu("colsMenu"));

  // apply filters
  document.querySelector("#applyBtn").addEventListener("click", async () => {
    state.status = document.querySelector("#status").value;
    state.payStatus = document.querySelector("#payStatus").value;
    await load();
    render();
  });

  // export demo
  document.querySelector("#exportBtn").addEventListener("click", () => {
    alert("Export: aggiungiamo /api/invoices.csv quando vuoi.");
  });

  // new demo
  document.querySelector("#newBtn").addEventListener("click", () => {
    alert("Nuevo gasto: qui apri form/modal.");
  });
}

function toggleMenu(id) {
  const el = document.getElementById(id);
  el.classList.toggle("hide");
}

function closeMenusOnOutsideClick() {
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".menu").forEach(m => {
      const dd = m.closest(".dropdown");
      if (!dd.contains(e.target)) m.classList.add("hide");
    });
  });
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}
