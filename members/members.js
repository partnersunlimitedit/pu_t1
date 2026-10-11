/* ============================================================
   Partners Unlimited — Members area logic (FAKE / TEST)
   - Fake login (any credentials) using sessionStorage
   - Directory rendering with search + region/tier filters
   - Member portal (own profile) rendering
   - Admin panel (table, stats, region distribution) rendering
   - Role switching & logout
   No backend. For testing purposes only.
   ============================================================ */
(function () {
  "use strict";

  var SESSION_KEY = "pu_demo_session";
  var members = window.PU_MEMBERS || [];

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function initials(name) {
    return String(name || "?").split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
  }
  function tierClass(t) {
    return t === "Tier 1" ? "tier-1" : t === "Tier 2" ? "tier-2" : "tier-3";
  }
  function fmtDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
    catch (e) { return null; }
  }
  function setSession(s) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

  /* ---------- banner on every members page ---------- */
  function injectBanner() {
    if ($(".demo-banner")) return;
    var b = el("div", "demo-banner",
      "<b>TEST DATA</b> — This is a fake members area for layout/demo purposes only. Do not trust any data here. " +
      "<a href=\"../index.html\">Back to public site</a>");
    document.body.insertBefore(b, document.body.firstChild);
    document.body.classList.add("has-demo-banner");
  }

  /* ---------- LOGIN ---------- */
  function initLogin() {
    var form = $("#loginForm");
    if (!form) return;
    // Already logged in? Bounce to the right page.
    var s = getSession();
    if (s) {
      location.href = s.role === "admin" ? "admin-panel.html" : "member-portal.html";
      return;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("#email").value.trim();
      var pass = $("#password").value;
      var role = $("#role").value;
      var errBox = $("#authErr");
      errBox.classList.remove("show");
      if (!email || !pass) {
        errBox.textContent = "Please enter both an email and a password.";
        errBox.classList.add("show");
        return;
      }
      // Pick the matching demo account, or fall back to a sensible member.
      var account = null;
      (window.PU_DEMO_ACCOUNTS || []).forEach(function (a) {
        if (a.email.toLowerCase() === email.toLowerCase()) account = a;
      });
      var memberId = account ? account.memberId : null;
      var resolvedRole = role || (account ? account.role : "member");
      if (resolvedRole === "member" && !memberId) memberId = members[0] ? members[0].id : null;
      setSession({ email: email, role: resolvedRole, memberId: memberId, at: Date.now() });
      location.href = resolvedRole === "admin" ? "admin-panel.html" : "member-portal.html";
    });
  }

  /* ---------- GUARD for protected pages ---------- */
  function requireAuth(needRole) {
    var s = getSession();
    if (!s) { location.href = "login.html"; return null; }
    if (needRole && s.role !== needRole) {
      // Wrong role — bounce to their own area.
      location.href = s.role === "admin" ? "admin-panel.html" : "member-portal.html";
      return null;
    }
    return s;
  }

  /* ---------- Top bar (portal & admin) ---------- */
  function renderTopbar(session, opts) {
    var box = $("#topbar");
    if (!box) return;
    var displayEmail = session.email;
    var roleLabel = session.role === "admin" ? "Administrator" : "Member";
    var name = roleLabel;
    if (session.role === "member") {
      var m = membersById()[session.memberId];
      if (m) name = m.contact + " · " + m.company;
    } else {
      name = "Regional Director";
    }
    box.innerHTML =
      '<div class="member-topbar-inner">' +
        '<div class="who">' +
          '<div class="avatar">' + initials(name.split(" ")[0]) + '</div>' +
          '<div>' +
            '<div class="who-name">' + esc(name) + '</div>' +
            '<div class="who-role">' + esc(displayEmail) + '</div>' +
          '</div>' +
          '<span class="role-pill">' + esc(roleLabel) + '</span>' +
        '</div>' +
        '<div class="actions">' +
          (opts && opts.switchable ? roleSwitchHtml(session) : '') +
          '<a class="link-back" href="member-directory.html">Directory</a>' +
          '<button class="btn-logout" id="logoutBtn">Log out</button>' +
        '</div>' +
      '</div>';
    var lo = $("#logoutBtn");
    if (lo) lo.addEventListener("click", function () { clearSession(); location.href = "login.html"; });
    var sw = $("#roleSwitch");
    if (sw) sw.addEventListener("change", function () {
      var newRole = sw.value;
      var newMemberId = newRole === "admin" ? null : (members[0] ? members[0].id : null);
      setSession({ email: session.email, role: newRole, memberId: newMemberId, at: Date.now() });
      location.href = newRole === "admin" ? "admin-panel.html" : "member-portal.html";
    });
  }
  function roleSwitchHtml(session) {
    var opts = '<option value="admin"' + (session.role === "admin" ? " selected" : "") + '>Admin view</option>' +
               '<option value="member"' + (session.role === "member" ? " selected" : "") + '>Member view</option>';
    return '<select class="dir-filters-select" id="roleSwitch" style="font-size:.85rem;font-weight:600;background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:100px;padding:7px 14px">' + opts + '</select>';
  }

  function membersById() {
    var map = {};
    members.forEach(function (m) { map[m.id] = m; });
    return map;
  }

  /* ---------- DIRECTORY ---------- */
  function initDirectory() {
    var grid = $("#dirGrid");
    if (!grid) return;
    var search = $("#dirSearch");
    var regionSel = $("#fRegion");
    var tierSel = $("#fTier");
    var meta = $("#dirMeta");
    var clearBtn = $("#dirClear");

    var regions = unique(members, "region");
    var tiers = ["Tier 1", "Tier 2", "Tier 3"];
    fillSelect(regionSel, regions, "All regions");
    fillSelect(tierSel, tiers, "All tiers");

    function apply() {
      var q = (search.value || "").toLowerCase().trim();
      var reg = regionSel.value;
      var tier = tierSel.value;
      var out = members.filter(function (m) {
        if (reg && m.region !== reg) return false;
        if (tier && m.tier !== tier) return false;
        if (q) {
          var hay = (m.company + " " + m.contact + " " + m.country + " " + m.city + " " + m.region + " " + m.services.join(" ") + " " + m.specializations + " " + m.id).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
      renderCards(out);
      meta.innerHTML = 'Showing <b>' + out.length + '</b> of <b>' + members.length + '</b> members' +
        (q ? ' for &ldquo;' + esc(q) + '&rdquo;' : '');
    }

    function renderCards(list) {
      grid.innerHTML = "";
      if (!list.length) {
        grid.appendChild(el("div", "empty-state",
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg>' +
          '<h3>No members match your filters</h3><p>Try clearing the search or selecting "All regions".</p>'));
        return;
      }
      list.forEach(function (m) {
        var svcHtml = m.services.map(function (s) { return '<span class="svc">' + esc(s) + '</span>'; }).join("");
        var dpCls = m.debtProtection === "Active" ? "dp-active" : "dp-review";
        var card = el("div", "mcard",
          '<div class="mcard-head">' +
            '<div class="mcard-av">' + initials(m.contact) + '</div>' +
            '<div>' +
              '<div class="mcard-co">' + esc(m.company) + '<span class="mcard-id">' + esc(m.id) + '</span></div>' +
              '<div class="mcard-loc"><b>' + esc(m.city) + '</b>, ' + esc(m.country) + ' · ' + esc(m.region) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="mcard-svc">' + svcHtml + '</div>' +
          '<div class="mcard-spec">' + esc(m.specializations) + '</div>' +
          '<div class="mcard-foot">' +
            '<span class="tier-badge ' + tierClass(m.tier) + '">' + esc(m.tier) + '</span>' +
            '<span class="dp-badge ' + dpCls + '"><span class="dot"></span>' + esc(m.debtProtection) + '</span>' +
          '</div>');
        grid.appendChild(card);
      });
    }

    search.addEventListener("input", apply);
    regionSel.addEventListener("change", apply);
    tierSel.addEventListener("change", apply);
    clearBtn.addEventListener("click", function () {
      search.value = ""; regionSel.value = ""; tierSel.value = ""; apply();
    });
    apply();
  }

  function fillSelect(sel, arr, allLabel) {
    if (!sel) return;
    sel.innerHTML = '<option value="">' + esc(allLabel) + '</option>' +
      arr.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join("");
  }
  function unique(arr, key) {
    var seen = {}, out = [];
    arr.forEach(function (o) { var v = o[key]; if (!seen[v]) { seen[v] = 1; out.push(v); } });
    return out;
  }

  /* ---------- MEMBER PORTAL ---------- */
  function initPortal() {
    if (!$("#welcomeName")) return; // only on the portal page
    var session = requireAuth("member");
    if (!session) return;
    var m = membersById()[session.memberId] || members[0];
    if (!m) return;
    renderTopbar(session, { switchable: true });

    $("#welcomeName").textContent = m.contact;
    $("#welcomeCompany").textContent = m.company + " — " + m.city + ", " + m.country;

    // metrics
    var avgShared = avg(members, "sharedBusiness");
    var avgScore = avg(members, "evalScore");
    setHTML("#metricScore", '<div class="m-lbl">Evaluation score</div>' +
      '<div class="m-val ' + scoreClass(m.evalScore) + '">' + m.evalScore + '<span style="font-size:1rem;color:var(--muted)">/100</span></div>' +
      '<div class="m-sub">Network avg ' + Math.round(avgScore) + '</div>' +
      '<div class="score-bar"><i style="width:' + m.evalScore + '%"></i></div>');
    setHTML("#metricShared", '<div class="m-lbl">Shared business</div>' +
      '<div class="m-val ' + goalClass(m.sharedBusiness) + '">' + m.sharedBusiness + '%</div>' +
      '<div class="m-sub">Network goal 60%</div>' +
      '<div class="goal-track"><div class="gt-bar"><i style="width:' + m.sharedBusiness + '%"></i><span class="gt-mark"></span></div></div>');
    setHTML("#metricTier", '<div class="m-lbl">Membership tier</div>' +
      '<div class="m-val" style="font-size:1.4rem"><span class="tier-badge ' + tierClass(m.tier) + '" style="font-size:.85rem">' + esc(m.tier) + '</span></div>' +
      '<div class="m-sub">' + esc(m.country) + ' market</div>');
    setHTML("#metricDebt", '<div class="m-lbl">Debt protection</div>' +
      '<div class="m-val ' + (m.debtProtection === "Active" ? "good" : "warn") + '">' + esc(m.debtProtection) + '</div>' +
      '<div class="m-sub">Non-disputed invoice cover</div>');
    setHTML("#metricVsAvg", '<div class="m-lbl">vs. network avg</div>' +
      '<div class="m-val ' + (m.sharedBusiness >= avgShared ? "good" : "warn") + '">' + (m.sharedBusiness >= avgShared ? "+" : "") + (m.sharedBusiness - Math.round(avgShared)) + '%</div>' +
      '<div class="m-sub">Shared-business vs ' + Math.round(avgShared) + '% avg</div>');
    setHTML("#metricJoined", '<div class="m-lbl">Member since</div>' +
      '<div class="m-val" style="font-size:1.3rem">' + fmtDate(m.joined) + '</div>' +
      '<div class="m-sub">' + esc(m.id) + '</div>');

    // profile blocks
    var kvCore =
      kv("Company", m.company) + kv("Member ID", m.id) +
      kv("Contact person", m.contact) + kv("Role", m.role) +
      kv("Email", '<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>') + kv("Phone", esc(m.phone)) +
      kv("Country", m.country) + kv("City", m.city) +
      kv("Region", m.region) + kv("Established", String(m.established));
    setHTML("#kvCore", kvCore);

    var kvBiz =
      kv("Services", m.services.join(", ")) + kv("Specializations", m.specializations) +
      kv("Ports / airports", m.ports) + kv("Year established", String(m.established));
    setHTML("#kvBiz", kvBiz);

    var kvStatus =
      kv("Membership tier", '<span class="tier-badge ' + tierClass(m.tier) + '">' + esc(m.tier) + '</span>') +
      kv("Join date", fmtDate(m.joined)) +
      kv("Evaluation score", m.evalScore + " / 100") +
      kv("Shared-business %", m.sharedBusiness + "%") +
      kv("Debt protection", '<span class="dp-badge ' + (m.debtProtection === "Active" ? "dp-active" : "dp-review") + '"><span class="dot"></span>' + esc(m.debtProtection) + '</span>');
    setHTML("#kvStatus", kvStatus);
  }
  function kv(k, v) {
    return '<div><div class="k">' + esc(k) + '</div><div class="v">' + (v == null ? "—" : v) + '</div></div>';
  }
  function setHTML(sel, html) { var n = $(sel); if (n) n.innerHTML = html; }
  function avg(arr, key) {
    var s = 0; arr.forEach(function (o) { s += o[key]; }); return s / arr.length;
  }
  function scoreClass(v) { return v >= 90 ? "good" : v >= 80 ? "" : "warn"; }
  function goalClass(v) { return v >= 60 ? "good" : v >= 50 ? "" : "warn"; }

  /* ---------- ADMIN PANEL ---------- */
  function initAdmin() {
    if (!$("#statTotal")) return; // only on the admin page
    var session = requireAuth("admin");
    if (!session) return;
    renderTopbar(session, { switchable: true });

    // stats
    var total = members.length;
    var byRegion = countBy(members, "region");
    var byTier = countBy(members, "tier");
    var activeDp = members.filter(function (m) { return m.debtProtection === "Active"; }).length;
    var reviewDp = total - activeDp;
    var avgScore = Math.round(avg(members, "evalScore"));
    var avgShared = Math.round(avg(members, "sharedBusiness"));
    var lowPerf = members.filter(function (m) { return m.evalScore < 80; }).length;

    setHTML("#statTotal", '<div class="m-lbl">Total members</div><div class="m-val">' + total + '</div><div class="m-sub">' + Object.keys(byRegion).length + ' regions</div>');
    setHTML("#statScore", '<div class="m-lbl">Avg evaluation</div><div class="m-val good">' + avgScore + '<span style="font-size:1rem;color:var(--muted)">/100</span></div><div class="m-sub">' + lowPerf + ' below 80</div>');
    setHTML("#statShared", '<div class="m-lbl">Avg shared business</div><div class="m-val ' + (avgShared >= 60 ? "good" : "warn") + '">' + avgShared + '%</div><div class="m-sub">Goal 60%</div>');
    setHTML("#statDebt", '<div class="m-lbl">Debt protection</div><div class="m-val good">' + activeDp + ' active</div><div class="m-sub">' + reviewDp + ' under review</div>');

    // region distribution
    var maxR = Math.max.apply(null, Object.keys(byRegion).map(function (k) { return byRegion[k]; }));
    var rdHtml = Object.keys(byRegion).sort(function (a, b) { return byRegion[b] - byRegion[a]; }).map(function (r) {
      var c = byRegion[r];
      return '<div class="rd-row"><div class="rd-head"><b>' + esc(r) + '</b><span>' + c + ' members</span></div>' +
        '<div class="rd-bar"><i style="width:' + (c / maxR * 100) + '%"></i></div></div>';
    }).join("");
    setHTML("#regionDist", rdHtml);

    // tier breakdown
    var tierHtml = ["Tier 1", "Tier 2", "Tier 3"].map(function (t) {
      var c = byTier[t] || 0;
      return '<div class="rd-row"><div class="rd-head"><b>' + esc(t) + '</b><span>' + c + ' members</span></div>' +
        '<div class="rd-bar"><i style="width:' + (c / total * 100) + '%"></i></div></div>';
    }).join("");
    setHTML("#tierDist", tierHtml);

    // table
    var search = $("#adminSearch");
    var regionSel = $("#adminRegion");
    fillSelect(regionSel, Object.keys(byRegion), "All regions");
    var tbody = $("#adminBody");

    function apply() {
      var q = (search.value || "").toLowerCase().trim();
      var reg = regionSel.value;
      var out = members.filter(function (m) {
        if (reg && m.region !== reg) return false;
        if (q) {
          var hay = (m.company + " " + m.contact + " " + m.country + " " + m.city + " " + m.id + " " + m.tier).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
      tbody.innerHTML = "";
      out.forEach(function (m) {
        var tr = el("tr", null,
          '<td class="co-cell">' + esc(m.company) + '<small>' + esc(m.id) + '</small></td>' +
          '<td>' + esc(m.contact) + '<br><span style="font-size:.78rem;color:var(--muted)">' + esc(m.role) + '</span></td>' +
          '<td>' + esc(m.city) + '<br><span style="font-size:.78rem;color:var(--muted)">' + esc(m.country) + '</span></td>' +
          '<td>' + esc(m.region) + '</td>' +
          '<td><span class="tier-badge ' + tierClass(m.tier) + '">' + esc(m.tier) + '</span></td>' +
          '<td class="score-cell">' + m.evalScore + '<span class="mini-bar"><i style="width:' + m.evalScore + '%"></i></span></td>' +
          '<td>' + m.sharedBusiness + '%</td>' +
          '<td><span class="dp-badge ' + (m.debtProtection === "Active" ? "dp-active" : "dp-review") + '"><span class="dot"></span>' + esc(m.debtProtection) + '</span></td>' +
          '<td><button class="row-act" data-id="' + esc(m.id) + '">View</button></td>');
        tbody.appendChild(tr);
      });
      $("#adminCount").textContent = out.length + ' of ' + total + ' members';
    }
    search.addEventListener("input", apply);
    regionSel.addEventListener("change", apply);
    apply();

    // detail popup
    tbody.addEventListener("click", function (e) {
      var btn = e.target.closest(".row-act");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var m = membersById()[id];
      if (!m) return;
      var html =
        '<div class="detail-card">' +
          '<button class="detail-close" id="detailClose">&times;</button>' +
          '<h3>' + esc(m.company) + '</h3>' +
          '<div class="detail-id">' + esc(m.id) + ' · ' + esc(m.region) + '</div>' +
          '<div class="kv-list">' +
            kv("Contact", m.contact) + kv("Role", m.role) +
            kv("Email", '<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>') + kv("Phone", m.phone) +
            kv("Country", m.country) + kv("City", m.city) +
            kv("Established", String(m.established)) + kv("Joined", fmtDate(m.joined)) +
            kv("Tier", '<span class="tier-badge ' + tierClass(m.tier) + '">' + esc(m.tier) + '</span>') +
            kv("Evaluation", m.evalScore + " / 100") +
            kv("Shared business", m.sharedBusiness + "%") +
            kv("Debt protection", '<span class="dp-badge ' + (m.debtProtection === "Active" ? "dp-active" : "dp-review") + '"><span class="dot"></span>' + esc(m.debtProtection) + '</span>') +
            kv("Services", m.services.join(", ")) +
            '<div style="grid-column:1/-1"><div class="k">Specializations</div><div class="v">' + esc(m.specializations) + '</div></div>' +
            '<div style="grid-column:1/-1"><div class="k">Ports / airports</div><div class="v">' + esc(m.ports) + '</div></div>' +
          '</div>' +
        '</div>';
      var pop = $("#detailPop");
      pop.innerHTML = html;
      pop.classList.add("show");
      $("#detailClose").addEventListener("click", function () { pop.classList.remove("show"); pop.innerHTML = ""; });
      pop.addEventListener("click", function (ev) { if (ev.target === pop) { pop.classList.remove("show"); pop.innerHTML = ""; } }, { once: true });
    });
  }
  function countBy(arr, key) {
    var o = {}; arr.forEach(function (m) { o[m[key]] = (o[m[key]] || 0) + 1; }); return o;
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    injectBanner();
    initLogin();
    initDirectory();
    initPortal();
    initAdmin();
  });
})();
