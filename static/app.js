cat > static/app.js <<'EOF'
const app = document.querySelector("#app");
app.innerHTML = `
  <div class="container">
    <div class="h1">Documentos</div>

    <div class="toolbar">
      <div class="search">🔎 <input placeholder="Buscar..." /></div>
      <div>
        <button class="btn">Ordenar por: <b>Fecha subida</b></button>
        <button class="btn">Filtrar</button>
        <button class="btn">Exportar</button>
        <button class="btn primary">＋ Nuevo gasto</button>
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
        <tbody id="rows"></tbody>
      </table>
    </div>

    <div class="footer">Se vedi questa pagina, static funziona ✅</div>
  </div>
`;

(async () => {
  const res = await fetch("/api/invoices");
  const data = await res.json();
  const rows = data.rows || [];
  document.querySelector("#rows").innerHTML = rows.map(r => `
    <tr>
      <td>${r.id}</td><td>${r.vendor}</td><td>${r.type}</td><td>${r.status}</td>
      <td>${r.docDate}</td><td>${r.uploadDate}</td><td>${r.amount}</td><td>${r.payStatus}</td>
    </tr>
  `).join("");
})();
EOF
