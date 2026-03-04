cat > /workspaces/test0403/static/app.js <<'EOF'
console.log("✅ JS partito (test click)");

const app = document.querySelector("#app");
app.innerHTML = `
  <div style="padding:20px;font-family:Arial">
    <h1>Test JS</h1>
    <button id="filterBtn">Filtrar</button>
    <div id="out" style="margin-top:10px"></div>
  </div>
`;

document.querySelector("#filterBtn").addEventListener("click", () => {
  console.log("👆 click Filtrar");
  document.querySelector("#out").textContent = "CLICK OK " + new Date().toLocaleTimeString();
});
EOF
