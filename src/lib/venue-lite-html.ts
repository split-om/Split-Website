export function venueLiteHtml(venue: { slug: string; name: string; area: string }) {
  const slug = JSON.stringify(venue.slug);
  const name = JSON.stringify(venue.name);
  const area = JSON.stringify(venue.area || "");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#7C3AED" />
  <title>${escapeHtml(venue.name)} · Split staff</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; background: #f3f1f6; color: #111; }
    header { background: #fff; padding: 12px 16px; border-bottom: 1px solid #e7e5ea; display: flex; justify-content: space-between; align-items: center; }
    h1 { font-size: 18px; margin: 0; }
    .sub { color: #6b6572; font-size: 12px; }
    .wrap { padding: 16px; max-width: 720px; margin: 0 auto; }
    input, button { font: inherit; }
    input { width: 100%; padding: 12px; border: 1px solid #d8d4dc; border-radius: 14px; margin-top: 6px; }
    label { display: block; font-weight: 700; font-size: 14px; margin-top: 12px; }
    .btn { width: 100%; border: 0; border-radius: 999px; padding: 14px; font-weight: 800; margin-top: 12px; }
    .primary { background: #7C3AED; color: #fff; }
    .dark { background: #111; color: #fff; }
    .ghost { background: transparent; color: #6b6572; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .tile { background: #fff; border: 1px solid #e7e5ea; border-radius: 18px; padding: 14px; text-align: left; }
    .tile.open { border-color: #7C3AED; }
    .tile.paid { background: #ecfdf5; }
    .err { color: #b91c1c; font-weight: 700; }
    .ok { color: #047857; font-weight: 700; }
    .card { background: #fff; border-radius: 18px; padding: 16px; }
    .row { display: flex; justify-content: space-between; margin: 6px 0; }
    .muted { color: #6b6572; font-size: 13px; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
(function () {
  var slug = ${slug};
  var venueName = ${name};
  var venueArea = ${area};
  var tokenKey = "split-staff-token:" + slug;
  var token = "";
  var me = null;
  var selected = null;
  var snap = { tables: {}, checks: {}, sessions: {} };
  var note = "";
  var err = "";

  function $(id) { return document.getElementById(id); }
  function omr(b) {
    b = Math.round(Number(b) || 0);
    var n = Math.abs(b);
    var w = Math.floor(n / 1000);
    var f = String(n % 1000);
    while (f.length < 3) f = "0" + f;
    return (b < 0 ? "-" : "") + w + "." + f;
  }
  function codeFor(num) { return slug + "-" + num; }
  function tableList() {
    var keys = Object.keys(snap.tables || {});
    keys.sort(function (a, b) {
      return String(snap.tables[a].table).localeCompare(String(snap.tables[b].table), undefined, { numeric: true });
    });
    return keys;
  }

  function request(url, opts) {
    opts = opts || {};
    return fetch(url, opts).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || "Request failed");
        return data;
      });
    });
  }

  function renderLogin() {
    document.getElementById("app").innerHTML =
      '<div class="wrap"><div class="card">' +
      '<div class="sub">STAFF · SUNMI</div>' +
      "<h1>" + venueName + "</h1>" +
      '<p class="muted">Simple staff page for this tablet.</p>' +
      (err ? '<p class="err">' + err + "</p>" : "") +
      '<label>Your name<input id="name" autocomplete="username" /></label>' +
      '<label>Password<input id="password" type="password" autocomplete="current-password" /></label>' +
      '<button class="btn primary" id="go">Sign in</button>' +
      "</div></div>";
    $("go").onclick = function () {
      err = "";
      request("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          slug: slug,
          name: $("name").value,
          password: $("password").value
        })
      }).then(function (data) {
        token = data.token;
        me = data.user;
        try { sessionStorage.setItem(tokenKey, token); } catch (e) {}
        load();
      }).catch(function (e) {
        err = e.message || "Wrong name or password.";
        renderLogin();
      });
    };
  }

  function statusOf(meta, check) {
    if (meta && meta.paidBaisa > 0 && meta.remaining <= 0) return "paid";
    if (check && check.items && check.items.length) return "open";
    return "empty";
  }

  function renderFloor() {
    var keys = tableList();
    var html = '<header><div><h1>' + venueName + '</h1><div class="sub">' +
      (me && me.name ? me.name : "Staff") + " · " + venueArea +
      '</div></div><button class="btn ghost" id="out" style="width:auto;padding:8px 12px">Sign out</button></header><div class="wrap">';
    if (note) html += '<p class="ok">' + note + "</p>";
    if (err) html += '<p class="err">' + err + "</p>";
    html += '<div class="grid">';
    for (var i = 0; i < keys.length; i++) {
      var c = keys[i];
      var meta = snap.tables[c];
      var check = snap.checks[c];
      var st = statusOf(meta, check);
      html += '<button class="tile ' + st + '" data-code="' + c + '">' +
        '<div class="sub">' + st.toUpperCase() + "</div>" +
        '<div style="font-size:28px;font-weight:800">' + meta.table + "</div>" +
        '<div class="muted">' + (st === "empty" ? "Free" : "OMR " + omr(meta.remaining || meta.food || 0)) + "</div>" +
        "</button>";
    }
    html += "</div></div>";
    $("app").innerHTML = html;
    $("out").onclick = signOut;
    var tiles = document.getElementsByClassName("tile");
    for (var t = 0; t < tiles.length; t++) {
      tiles[t].onclick = function () {
        selected = this.getAttribute("data-code");
        renderTable();
      };
    }
  }

  function renderTable() {
    var meta = snap.tables[selected] || { table: "?", remaining: 0, food: 0 };
    var bill = snap.checks[selected];
    var session = (snap.sessions || {})[selected];
    var html = '<header><button class="btn ghost" id="back" style="width:auto;padding:8px 12px">← Tables</button><h1>Table ' +
      meta.table + "</h1><span></span></header><div class='wrap'><div class='card'>";
    if (note) html += '<p class="ok">' + note + "</p>";
    if (err) html += '<p class="err">' + err + "</p>";
    if (!bill || !bill.items || !bill.items.length) {
      html += '<p class="muted">No open bill. Guest orders on the table QR.</p>';
    } else {
      for (var i = 0; i < bill.items.length; i++) {
        var it = bill.items[i];
        html += '<div class="row"><span>' + it.qty + "× " + it.name + "</span><span>" + omr((it.unitBaisa || 0) * (it.qty || 0)) + "</span></div>";
      }
      html += '<div class="row"><span class="muted">Remaining</span><strong>OMR ' + omr(meta.remaining) + "</strong></div>";
      html += '<button class="btn primary" id="print">Print receipt</button>';
      if (meta.remaining > 0) {
        html += '<button class="btn dark" id="pos">Pay the rest on bank POS · OMR ' + omr(meta.remaining) + "</button>";
      }
    }
    html += "</div></div>";
    $("app").innerHTML = html;
    $("back").onclick = function () { selected = null; note = ""; err = ""; renderFloor(); };
    var printBtn = $("print");
    if (printBtn) printBtn.onclick = function () { printReceipt(bill, session); };
    var posBtn = $("pos");
    if (posBtn) posBtn.onclick = function () {
      if (!window.confirm("Take OMR " + omr(meta.remaining) + " on the bank POS, then confirm only if approved.")) return;
      request("/api/till", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pos", slug: slug, table: String(meta.table) })
      }).then(function () {
        note = "Paid on bank POS. Table " + meta.table + " is cleared.";
        if (bill) printReceipt(bill, session);
        selected = null;
        load();
      }).catch(function (e) {
        err = e.message || "Could not mark paid.";
        renderTable();
      });
    };
  }

  function printReceipt(bill, session) {
    if (!bill) return;
    var items = "";
    for (var i = 0; i < (bill.items || []).length; i++) {
      var it = bill.items[i];
      items += '<div class="row"><span>' + it.qty + "x " + it.name + "</span><span>" + omr((it.unitBaisa || 0) * (it.qty || 0)) + "</span></div>";
    }
    var w = window.open("", "split-receipt", "width=320,height=600");
    if (!w) {
      err = "Allow pop-ups to print.";
      renderTable();
      return;
    }
    w.document.write("<html><head><title>Receipt</title><style>body{font:12px monospace;width:54mm}@page{size:58mm auto;margin:2mm}.row{display:flex;justify-content:space-between}h1,p{text-align:center}</style></head><body>");
    w.document.write("<h1>SPLIT</h1><p>" + venueName + "<br/>Table " + bill.table + "</p>" + items);
    w.document.write('<div class="row"><span>REMAINING</span><span>' + omr((snap.tables[selected] || {}).remaining || 0) + "</span></div>");
    w.document.write("<p>Thank you</p></body></html>");
    w.document.close();
    w.focus();
    w.print();
  }

  function signOut() {
    token = "";
    me = null;
    try { sessionStorage.removeItem(tokenKey); } catch (e) {}
    renderLogin();
  }

  function load() {
    Promise.all([
      request("/api/till?venue=" + encodeURIComponent(slug)),
      request("/api/sync?venue=" + encodeURIComponent(slug))
    ]).then(function (parts) {
      snap.checks = parts[0].checks || {};
      snap.tables = parts[0].tables || {};
      snap.sessions = parts[1].sessions || {};
      err = "";
      if (selected) renderTable();
      else renderFloor();
    }).catch(function (e) {
      err = e.message || "Could not load tables.";
      renderFloor();
    });
  }

  try { token = sessionStorage.getItem(tokenKey) || ""; } catch (e) { token = ""; }
  if (token) {
    request("/api/staff?token=" + encodeURIComponent(token)).then(function (data) {
      me = data.me;
      load();
      setInterval(function () { if (me) load(); }, 4000);
    }).catch(function () {
      signOut();
    });
  } else {
    renderLogin();
  }
})();
  </script>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
