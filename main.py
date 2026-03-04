from pathlib import Path
from fastapi import FastAPI, Query
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Storico Fatture")
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

INVOICES = [
    {"id":"A260355","vendor":"DBL","type":"Factura","status":"Digitalizado","docDate":"2026-02-18","uploadDate":"2026-02-25","amount":149.34,"payStatus":"Vencido"},
    {"id":"A260270","vendor":"DBL","type":"Factura","status":"Digitalizado","docDate":"2026-02-08","uploadDate":"2026-02-12","amount":404.84,"payStatus":"Vencido"},
    {"id":"B100011","vendor":"ACME","type":"Factura","status":"Requieren revisión","docDate":"2026-02-20","uploadDate":"2026-02-20","amount":99.90,"payStatus":"Pendiente"},
    {"id":"C777001","vendor":"FooBar SL","type":"Factura","status":"Rechazados","docDate":"2026-01-28","uploadDate":"2026-02-01","amount":871.75,"payStatus":"Pagado"},
]

HTML_PAGE = """
<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Documentos</title>
    <link rel="stylesheet" href="/static/style.css" />
  </head>
  <body>
    <div id="app"></div>
    <script src="/static/app.js"></script>
  </body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
def home():
    return HTML_PAGE

def filter_sort(rows, q, status, pay_status, from_date, to_date, sort, sort_dir):
    out = list(rows)

    qn = (q or "").strip().lower()
    if qn:
        out = [r for r in out if any(qn in str(r.get(k,"")).lower() for k in ["id","vendor","type","status","payStatus"])]

    if status != "ALL":
        out = [r for r in out if r.get("status") == status]
    if pay_status != "ALL":
        out = [r for r in out if r.get("payStatus") == pay_status]

    # range su uploadDate (YYYY-MM-DD)
    if from_date:
        out = [r for r in out if str(r.get("uploadDate","")) >= from_date]
    if to_date:
        out = [r for r in out if str(r.get("uploadDate","")) <= to_date]

    reverse = (sort_dir != "asc")
    if sort == "amount":
        out.sort(key=lambda r: float(r.get("amount", 0) or 0), reverse=reverse)
    else:
        out.sort(key=lambda r: str(r.get(sort, "") or ""), reverse=reverse)

    return out

@app.get("/api/invoices")
def list_invoices(
    q: str = Query(default=""),
    status: str = Query(default="ALL"),
    payStatus: str = Query(default="ALL"),
    fromDate: str = Query(default=""),
    toDate: str = Query(default=""),
    sort: str = Query(default="uploadDate"),
    sortDir: str = Query(default="desc"),
):
    rows = filter_sort(INVOICES, q, status, payStatus, fromDate, toDate, sort, sortDir)
    return JSONResponse({"rows": rows, "total": len(rows)})

@app.get("/api/invoices.csv")
def export_csv(
    q: str = Query(default=""),
    status: str = Query(default="ALL"),
    payStatus: str = Query(default="ALL"),
    fromDate: str = Query(default=""),
    toDate: str = Query(default=""),
    sort: str = Query(default="uploadDate"),
    sortDir: str = Query(default="desc"),
    cols: str = Query(default="id,vendor,type,status,docDate,uploadDate,amount,payStatus"),
):
    rows = filter_sort(INVOICES, q, status, payStatus, fromDate, toDate, sort, sortDir)
    col_keys = [c.strip() for c in cols.split(",") if c.strip()]

    header_map = {
        "id": "N.ro Documento",
        "vendor": "Proveedor",
        "type": "Tipo",
        "status": "Estado",
        "docDate": "Fecha documento",
        "uploadDate": "Fecha subida",
        "amount": "Importe",
        "payStatus": "Estado pago",
    }

    def esc(v):
        s = "" if v is None else str(v)
        return '"' + s.replace('"', '""') + '"'

    lines = []
    lines.append(",".join(esc(header_map.get(k, k)) for k in col_keys))
    for r in rows:
        lines.append(",".join(esc(r.get(k, "")) for k in col_keys))

    csv = "\n".join(lines)
    return Response(
        content=csv.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="storico_fatture.csv"'},
    )
