/**
 * Costa Sur Proveedores — Directory logic
 */
(function () {
  'use strict';

  var CATEGORIES = {
    'aires':       { icon: '\u2744\uFE0F', label: 'Aires Acondicionados' },
    'catering':    { icon: '\uD83C\uDF7D\uFE0F', label: 'Catering / Eventos' },
    'jardineria':  { icon: '\uD83C\uDF3F', label: 'Jardiner\u00eda' },
    'linea-blanca':{ icon: '\uD83E\uDEE7', label: 'L\u00ednea Blanca' },
    'plomeria':    { icon: '\uD83D\uDEB0', label: 'Plomer\u00eda' },
    'general':     { icon: '\uD83D\uDD28', label: 'Trabajos Generales' },
    'fumigacion':  { icon: '\uD83E\uDEB2', label: 'Fumigaci\u00f3n' },
    'techo':       { icon: '\uD83C\uDFE0', label: 'Techo y Canales' },
    'solar':       { icon: '\u2600\uFE0F', label: 'Paneles Solares' },
    'vidrios':     { icon: '\uD83E\uDE9F', label: 'Vidrios y Aluminio' }
  };

  var COMMUNITY_NAMES = {
    'villa-valencia': 'Villa Valencia',
    'woodlands': 'Woodlands',
    'caminos-del-sur': 'Caminos del Sur',
    'green-village': 'Green Village',
    'panama-pacifico': 'Panama Pacifico',
    'brisas-del-golf': 'Brisas del Golf',
    'otro': 'Otra'
  };

  var providers = [];
  var currentCat = 'all';

  function catInfo(cat) {
    return CATEGORIES[cat] || { icon: '\uD83D\uDD27', label: cat };
  }

  function communityName(slug) {
    return COMMUNITY_NAMES[slug] || slug;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function trustLabel(p) {
    if (p.recCount === 0) return '';
    var parts = p.recCount + ' recomendaci\u00f3n' + (p.recCount > 1 ? 'es' : '');
    if (p.communityCount > 1) {
      parts += ' de ' + p.communityCount + ' comunidades';
    }
    return parts;
  }

  function renderCard(p) {
    var c = catInfo(p.category);
    var trust = trustLabel(p);
    return '<div class="provider-card" data-id="' + escapeHtml(p.id) + '">' +
      '<div class="card-top">' +
        '<div class="card-avatar">' + c.icon + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div class="card-name">' + escapeHtml(p.name) + '</div>' +
          '<div class="card-service">' + c.icon + ' ' + escapeHtml(c.label) + '</div>' +
          (trust ? '<div class="badge-trust">\u2713 ' + escapeHtml(trust) + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="card-info">' +
        '<div class="info-row"><span class="info-icon">\uD83D\uDD27</span><span style="font-size:0.78rem;line-height:1.4">' + escapeHtml(p.service) + '</span></div>' +
        '<div class="info-row"><span class="info-icon">\uD83D\uDCDE</span><strong>' + escapeHtml(p.phone) + '</strong></div>' +
        (p.email ? '<div class="info-row"><span class="info-icon">\u2709\uFE0F</span><span style="font-size:0.76rem;word-break:break-all">' + escapeHtml(p.email) + '</span></div>' : '') +
      '</div>' +
      '<div class="card-actions">' +
        '<a class="btn-call" href="tel:' + p.phone.replace(/\D/g, '') + '" onclick="event.stopPropagation()">\uD83D\uDCDE Llamar</a>' +
        (p.email ? '<a class="btn-email" href="mailto:' + escapeHtml(p.email) + '" onclick="event.stopPropagation()" title="Enviar correo">\u2709\uFE0F</a>' : '') +
      '</div>' +
    '</div>';
  }

  function applyFilters() {
    var search = document.getElementById('searchInput').value.toLowerCase();
    var filtered = providers.filter(function (p) {
      var matchCat = currentCat === 'all' || p.category === currentCat;
      var matchSearch = !search ||
        p.name.toLowerCase().indexOf(search) !== -1 ||
        p.service.toLowerCase().indexOf(search) !== -1 ||
        catInfo(p.category).label.toLowerCase().indexOf(search) !== -1;
      return matchCat && matchSearch;
    });

    var grid = document.getElementById('providerGrid');
    if (filtered.length) {
      grid.innerHTML = filtered.map(renderCard).join('');
    } else {
      grid.innerHTML = '<div class="empty-state">' +
        '<div class="empty-icon">\uD83D\uDD0D</div>' +
        '<h3>Sin resultados</h3><p>Intenta con otra b\u00fasqueda.</p></div>';
    }
    document.getElementById('gridCount').textContent =
      filtered.length + ' proveedor' + (filtered.length !== 1 ? 'es' : '');

    updateCategoryCounts();
  }

  function updateCategoryCounts() {
    var counts = { all: providers.length };
    for (var i = 0; i < providers.length; i++) {
      var cat = providers[i].category;
      counts[cat] = (counts[cat] || 0) + 1;
    }
    var countEls = document.querySelectorAll('.cat-count[id]');
    for (var j = 0; j < countEls.length; j++) {
      var key = countEls[j].id.replace('cnt-', '');
      countEls[j].textContent = counts[key] || 0;
    }
    // Update hero stats
    var statTotal = document.getElementById('statTotal');
    if (statTotal) statTotal.textContent = providers.length;
    var statCommunities = document.getElementById('statCommunities');
    if (statCommunities) {
      var allCommunities = {};
      for (var k = 0; k < providers.length; k++) {
        var recs = providers[k].recommendations || [];
        for (var m = 0; m < recs.length; m++) {
          allCommunities[recs[m].community] = true;
        }
      }
      statCommunities.textContent = Object.keys(allCommunities).length;
    }
  }

  function filterCat(cat, btn) {
    currentCat = cat;
    var btns = document.querySelectorAll('.cat-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    btn.classList.add('active');

    var c = CATEGORIES[cat];
    document.getElementById('gridTitle').textContent = cat === 'all' ? 'Todos los Proveedores' : (c ? c.label : 'Proveedores');
    applyFilters();
  }

  function openDetail(id) {
    var p = null;
    for (var i = 0; i < providers.length; i++) {
      if (providers[i].id === id || providers[i].id === String(id)) { p = providers[i]; break; }
    }
    if (!p) return;

    var c = catInfo(p.category);
    var trust = trustLabel(p);
    var recs = p.recommendations || [];

    var recsHtml = '';
    if (recs.length > 0) {
      recsHtml = '<div class="detail-recs"><div class="detail-recs-title">Recomendaciones</div>';
      for (var j = 0; j < recs.length; j++) {
        var r = recs[j];
        recsHtml += '<div class="rec-item">' +
          '<span>\uD83C\uDFE1</span>' +
          '<span class="rec-community">' + escapeHtml(communityName(r.community)) + '</span>' +
          '<span class="rec-house">Casa ' + escapeHtml(r.house_number) + '</span>' +
        '</div>';
      }
      recsHtml += '</div>';
    }

    document.getElementById('detailContent').innerHTML =
      '<div class="detail-header">' +
        '<div style="display:flex;gap:0.75rem;align-items:flex-start;flex:1">' +
          '<div class="detail-avatar">' + c.icon + '</div>' +
          '<div>' +
            '<div class="detail-name">' + escapeHtml(p.name) + '</div>' +
            '<div class="card-service" style="margin-bottom:0.4rem">' + c.icon + ' ' + escapeHtml(c.label) + '</div>' +
            (trust ? '<div class="badge-trust">\u2713 ' + escapeHtml(trust) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<button onclick="window._closeDetail()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-light);flex-shrink:0">\u2715</button>' +
      '</div>' +
      '<hr class="detail-divider"/>' +
      '<div class="detail-row"><span class="detail-label">\uD83D\uDD27 Servicio</span><span class="detail-val">' + escapeHtml(p.service) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">\uD83D\uDCDE Tel\u00e9fono</span><span class="detail-val">' + escapeHtml(p.phone) + '</span></div>' +
      (p.email ? '<div class="detail-row"><span class="detail-label">\u2709\uFE0F Correo</span><span class="detail-val" style="word-break:break-all">' + escapeHtml(p.email) + '</span></div>' : '') +
      recsHtml +
      '<div class="detail-actions">' +
        '<a class="btn-call" href="tel:' + p.phone.replace(/\D/g, '') + '" style="flex:1">\uD83D\uDCDE Llamar ahora</a>' +
        (p.email ? '<a class="btn-email" href="mailto:' + escapeHtml(p.email) + '" style="padding:0.55rem 1rem;font-size:0.82rem;font-weight:600;display:flex;align-items:center;gap:0.35rem">\u2709\uFE0F Correo</a>' : '') +
      '</div>';

    document.getElementById('detailModal').classList.add('open');
  }

  function closeDetail() {
    document.getElementById('detailModal').classList.remove('open');
  }

  // Event delegation for card clicks
  function setupCardClicks() {
    var grid = document.getElementById('providerGrid');
    if (!grid) return;
    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.provider-card');
      if (!card) return;
      if (e.target.closest('a')) return;
      openDetail(card.getAttribute('data-id'));
    });
  }

  // Close modals on backdrop click
  function setupModalBackdrops() {
    var detail = document.getElementById('detailModal');
    if (detail) {
      detail.addEventListener('click', function (e) {
        if (e.target === detail) closeDetail();
      });
    }
  }

  // Search debounce
  function setupSearch() {
    var input = document.getElementById('searchInput');
    if (!input) return;
    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(applyFilters, 150);
    });
  }

  window._filterCat = filterCat;
  window._closeDetail = closeDetail;

  document.addEventListener('DOMContentLoaded', async function () {
    providers = await window.CostaSurDB.fetchProviders();
    applyFilters();
    setupCardClicks();
    setupModalBackdrops();
    setupSearch();
  });
})();
