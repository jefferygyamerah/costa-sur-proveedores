/**
 * Costa Sur Proveedores — Directory logic
 * Renders provider cards with voting, star ratings, and detail modal
 * with reviews and review submission.
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

  var providers = [];
  var currentCat = 'all';

  // Infer category from servicio text when categoria is missing
  var CAT_KEYWORDS = [
    { cat: 'aires', words: ['aire', 'a/c', 'acondicionado', 'clima'] },
    { cat: 'catering', words: ['catering', 'comida', 'fiesta', 'evento'] },
    { cat: 'jardineria', words: ['jardin', 'jardiner'] },
    { cat: 'linea-blanca', words: ['lavadora', 'secadora', 'linea blanca', 'línea blanca', 'electrodom'] },
    { cat: 'plomeria', words: ['plomer', 'plomero'] },
    { cat: 'fumigacion', words: ['fumiga'] },
    { cat: 'techo', words: ['techo', 'canal', 'gotera'] },
    { cat: 'solar', words: ['solar', 'panel'] },
    { cat: 'vidrios', words: ['vidrio', 'aluminio', 'ventana'] },
    { cat: 'general', words: ['pintura', 'alba', 'constructor', 'general', 'acarreo', 'reparaci'] }
  ];

  function guessCategory(servicio) {
    var s = (servicio || '').toLowerCase();
    for (var i = 0; i < CAT_KEYWORDS.length; i++) {
      for (var j = 0; j < CAT_KEYWORDS[i].words.length; j++) {
        if (s.indexOf(CAT_KEYWORDS[i].words[j]) !== -1) return CAT_KEYWORDS[i].cat;
      }
    }
    return 'general';
  }

  function catInfo(cat) {
    return CATEGORIES[cat] || { icon: '\uD83D\uDD27', label: cat };
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  // ------------------------------------------------------------------
  // Stars helper
  // ------------------------------------------------------------------

  function starsHtml(rating, count) {
    if (!count) return '';
    var full = Math.floor(rating);
    var half = (rating - full) >= 0.3 ? 1 : 0;
    var empty = 5 - full - half;
    var s = '<span class="stars">';
    for (var i = 0; i < full; i++) s += '\u2605';
    if (half) s += '\u00BD';
    for (var j = 0; j < empty; j++) s += '<span class="star-empty">\u2605</span>';
    s += '</span>';
    s += '<span class="review-count">' + rating.toFixed(1) + ' (' + count + ')</span>';
    return s;
  }

  // ------------------------------------------------------------------
  // Vote widget HTML
  // ------------------------------------------------------------------

  function voteHtml(p) {
    var upClass = p.userVote === 1 ? ' vote-active' : '';
    var downClass = p.userVote === -1 ? ' vote-active' : '';
    return '<div class="vote-widget" data-pk="' + escapeHtml(p.providerKey) + '">' +
      '<button class="vote-btn vote-up' + upClass + '" data-dir="1" aria-label="Buena experiencia" title="Buena experiencia">\u25B2</button>' +
      '<span class="vote-score">' + (p.voteScore || 0) + '</span>' +
      '<button class="vote-btn vote-down' + downClass + '" data-dir="-1" aria-label="Mala experiencia" title="Mala experiencia">\u25BC</button>' +
    '</div>';
  }

  // ------------------------------------------------------------------
  // Card rendering
  // ------------------------------------------------------------------

  function renderCard(p) {
    var c = catInfo(p.categoria || p.category);
    var name = p.nombre || p.name;
    var service = p.servicio || p.service;
    var phone = p.telefono || p.phone;
    var email = p.correo || p.email;
    var pk = p.providerKey || p.id;

    var ratingLine = '';
    if (p.reviewCount > 0) {
      ratingLine = '<div class="card-rating">' + starsHtml(p.averageRating, p.reviewCount) + '</div>';
    }

    var recCount = p.recCount || (p.recommendations ? p.recommendations.length : 0);
    var trustLine = '';
    if (recCount > 0) {
      trustLine = '<span class="card-recs">' + recCount + ' rec.</span>';
    }

    return '<div class="provider-card" data-pk="' + escapeHtml(pk) + '">' +
      '<div class="card-body">' +
        voteHtml(p) +
        '<div class="card-content">' +
          '<div class="card-name">' + escapeHtml(name) + '</div>' +
          '<div class="card-category">' + c.icon + ' ' + escapeHtml(c.label) + '</div>' +
          '<div class="card-service">' + escapeHtml(service) + '</div>' +
          ratingLine +
          '<div class="card-meta">' +
            '<span class="card-phone">' + escapeHtml(phone) + '</span>' +
            trustLine +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card-footer">' +
        '<a class="btn-detail" data-pk="' + escapeHtml(pk) + '">Ver detalles</a>' +
        '<a class="btn-call" href="tel:' + phone.replace(/\D/g, '') + '" onclick="event.stopPropagation()">Llamar</a>' +
      '</div>' +
    '</div>';
  }

  // ------------------------------------------------------------------
  // Filters
  // ------------------------------------------------------------------

  function applyFilters() {
    var search = document.getElementById('searchInput').value.toLowerCase();
    var filtered = providers.filter(function (p) {
      var cat = p.categoria || p.category;
      var matchCat = currentCat === 'all' || cat === currentCat;
      var name = (p.nombre || p.name || '').toLowerCase();
      var service = (p.servicio || p.service || '').toLowerCase();
      var catLabel = catInfo(cat).label.toLowerCase();
      var matchSearch = !search ||
        name.indexOf(search) !== -1 ||
        service.indexOf(search) !== -1 ||
        catLabel.indexOf(search) !== -1;
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
      var cat = providers[i].categoria || providers[i].category;
      counts[cat] = (counts[cat] || 0) + 1;
    }
    var countEls = document.querySelectorAll('.cat-count[id]');
    for (var j = 0; j < countEls.length; j++) {
      var key = countEls[j].id.replace('cnt-', '');
      countEls[j].textContent = counts[key] || 0;
    }
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
    document.getElementById('gridTitle').textContent =
      cat === 'all' ? 'Todos los Proveedores' : (c ? c.label : 'Proveedores');
    applyFilters();
  }

  // ------------------------------------------------------------------
  // Voting
  // ------------------------------------------------------------------

  function findProvider(pk) {
    for (var i = 0; i < providers.length; i++) {
      var k = providers[i].providerKey || providers[i].id;
      if (k === pk) return providers[i];
    }
    return null;
  }

  function handleVoteClick(e) {
    var btn = e.target.closest('.vote-btn');
    if (!btn) return;
    e.stopPropagation();

    var widget = btn.closest('.vote-widget');
    var pk = widget.getAttribute('data-pk');
    var dir = Number(btn.getAttribute('data-dir'));
    var p = findProvider(pk);
    if (!p) return;

    window.CostaSurAuth.requireIdentity(function (identity) {
      var prevVote = p.userVote;
      var prevScore = p.voteScore || 0;

      // Toggle: if same vote, we still send it (backend overwrites)
      p.userVote = dir;
      p.voteScore = prevScore - (prevVote || 0) + dir;

      // Optimistic UI update
      updateVoteWidgets(pk, p);

      window.CostaSurDB.submitVote({
        providerKey: pk,
        comunidad: identity.comunidad,
        casa: identity.casa,
        voto: dir
      }).then(function (result) {
        if (result.ok) {
          if (result.voteScore !== undefined) p.voteScore = result.voteScore;
          if (result.userVote !== undefined) p.userVote = result.userVote;
        } else {
          // Revert
          p.userVote = prevVote;
          p.voteScore = prevScore;
        }
        updateVoteWidgets(pk, p);
      });
    });
  }

  function updateVoteWidgets(pk, p) {
    var widgets = document.querySelectorAll('.vote-widget[data-pk="' + pk + '"]');
    for (var i = 0; i < widgets.length; i++) {
      var w = widgets[i];
      w.querySelector('.vote-score').textContent = p.voteScore || 0;
      var up = w.querySelector('.vote-up');
      var down = w.querySelector('.vote-down');
      up.classList.toggle('vote-active', p.userVote === 1);
      down.classList.toggle('vote-active', p.userVote === -1);
    }
  }

  // ------------------------------------------------------------------
  // Detail modal
  // ------------------------------------------------------------------

  function openDetail(pk) {
    var p = findProvider(pk);
    if (!p) return;

    var c = catInfo(p.categoria || p.category);
    var name = p.nombre || p.name;
    var service = p.servicio || p.service;
    var phone = p.telefono || p.phone;
    var email = p.correo || p.email;
    var recs = p.recommendations || [];

    // Reviews section
    var reviewsHtml = '';
    if (p.reviews && p.reviews.length > 0) {
      reviewsHtml = '<div class="detail-reviews"><div class="detail-section-title">Rese\u00f1as</div>';
      for (var r = 0; r < p.reviews.length; r++) {
        var rev = p.reviews[r];
        var revStars = '';
        for (var s = 0; s < 5; s++) {
          revStars += s < rev.estrellas ? '\u2605' : '<span class="star-empty">\u2605</span>';
        }
        reviewsHtml += '<div class="review-item">' +
          '<div class="review-header">' +
            '<span class="review-author">' + escapeHtml(rev.nombreReviewer) + '</span>' +
            '<span class="review-stars">' + revStars + '</span>' +
          '</div>' +
          '<p class="review-text">' + escapeHtml(rev.texto) + '</p>' +
        '</div>';
      }
      reviewsHtml += '</div>';
    } else {
      reviewsHtml = '<div class="detail-reviews">' +
        '<div class="detail-section-title">Rese\u00f1as</div>' +
        '<p class="review-empty">A\u00fan no hay rese\u00f1as aprobadas.</p>' +
      '</div>';
    }

    // Recommendations
    var recsHtml = '';
    if (recs.length > 0) {
      recsHtml = '<div class="detail-recs"><div class="detail-section-title">Recomendaciones</div>';
      for (var j = 0; j < recs.length; j++) {
        recsHtml += '<div class="rec-item">' +
          '<span class="rec-community">' + escapeHtml(recs[j].community) + '</span>' +
          '<span class="rec-house">Casa ' + escapeHtml(recs[j].house_number) + '</span>' +
        '</div>';
      }
      recsHtml += '</div>';
    }

    // Rating line
    var ratingLine = '';
    if (p.reviewCount > 0) {
      ratingLine = '<div class="detail-rating">' + starsHtml(p.averageRating, p.reviewCount) + '</div>';
    }

    document.getElementById('detailContent').innerHTML =
      '<div class="detail-header">' +
        '<div class="detail-info">' +
          '<div class="detail-name">' + escapeHtml(name) + '</div>' +
          '<div class="detail-cat">' + c.icon + ' ' + escapeHtml(c.label) + '</div>' +
          ratingLine +
        '</div>' +
        '<button class="detail-close" onclick="window._closeDetail()">\u2715</button>' +
      '</div>' +
      '<div class="detail-body">' +
        '<div class="detail-row"><span class="detail-label">Servicio</span><span class="detail-val">' + escapeHtml(service) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Tel\u00e9fono</span><span class="detail-val">' + escapeHtml(phone) + '</span></div>' +
        (email ? '<div class="detail-row"><span class="detail-label">Correo</span><span class="detail-val">' + escapeHtml(email) + '</span></div>' : '') +
      '</div>' +
      '<div class="detail-vote">' + voteHtml(p) + '</div>' +
      recsHtml +
      reviewsHtml +
      '<button class="btn-write-review" id="btnWriteReview">Escribir rese\u00f1a</button>' +
      '<div class="review-form" id="reviewForm" style="display:none">' +
        '<div class="detail-section-title">Tu rese\u00f1a</div>' +
        '<div class="star-picker" id="starPicker">' +
          '<span class="star-pick" data-val="1">\u2605</span>' +
          '<span class="star-pick" data-val="2">\u2605</span>' +
          '<span class="star-pick" data-val="3">\u2605</span>' +
          '<span class="star-pick" data-val="4">\u2605</span>' +
          '<span class="star-pick" data-val="5">\u2605</span>' +
        '</div>' +
        '<textarea class="form-textarea" id="reviewText" placeholder="Tu experiencia con este proveedor..." maxlength="500"></textarea>' +
        '<p class="review-note">La rese\u00f1a ser\u00e1 visible una vez aprobada.</p>' +
        '<button class="btn-submit-review" id="btnSubmitReview">Enviar rese\u00f1a</button>' +
      '</div>' +
      '<div class="detail-actions">' +
        '<a class="btn-call-detail" href="tel:' + phone.replace(/\D/g, '') + '">Llamar</a>' +
        (email ? '<a class="btn-email-detail" href="mailto:' + escapeHtml(email) + '">Correo</a>' : '') +
      '</div>';

    document.getElementById('detailModal').classList.add('open');

    // Wire up review form
    setupReviewForm(pk);
  }

  function closeDetail() {
    document.getElementById('detailModal').classList.remove('open');
  }

  // ------------------------------------------------------------------
  // Review form inside detail modal
  // ------------------------------------------------------------------

  function setupReviewForm(pk) {
    var selectedStars = 0;

    // Toggle form
    var btnShow = document.getElementById('btnWriteReview');
    var form = document.getElementById('reviewForm');
    if (btnShow) {
      btnShow.addEventListener('click', function () {
        window.CostaSurAuth.requireIdentity(function () {
          form.style.display = '';
          btnShow.style.display = 'none';
        });
      });
    }

    // Star picker
    var picker = document.getElementById('starPicker');
    if (picker) {
      var stars = picker.querySelectorAll('.star-pick');
      for (var i = 0; i < stars.length; i++) {
        stars[i].addEventListener('click', function () {
          selectedStars = Number(this.getAttribute('data-val'));
          var all = picker.querySelectorAll('.star-pick');
          for (var j = 0; j < all.length; j++) {
            all[j].classList.toggle('star-selected', Number(all[j].getAttribute('data-val')) <= selectedStars);
          }
        });
      }
    }

    // Submit
    var btnSubmit = document.getElementById('btnSubmitReview');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', function () {
        var texto = (document.getElementById('reviewText').value || '').trim();
        if (!selectedStars) { alert('Selecciona las estrellas.'); return; }
        if (!texto) { alert('Escribe tu rese\u00f1a.'); return; }
        if (texto.length > 500) { alert('M\u00e1ximo 500 caracteres.'); return; }

        var identity = window.CostaSurAuth.getIdentity();
        if (!identity) return;

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando...';

        window.CostaSurDB.submitReview({
          providerKey: pk,
          comunidad: identity.comunidad,
          casa: identity.casa,
          nombre: 'Casa ' + identity.casa,
          estrellas: selectedStars,
          texto: texto
        }).then(function (result) {
          if (result.ok) {
            form.innerHTML = '<p class="review-success">Rese\u00f1a enviada. Ser\u00e1 visible una vez aprobada.</p>';
          } else {
            alert('Error: ' + (result.error || 'Intenta de nuevo.'));
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Enviar rese\u00f1a';
          }
        });
      });
    }
  }

  // ------------------------------------------------------------------
  // Event setup
  // ------------------------------------------------------------------

  function setupCardClicks() {
    var grid = document.getElementById('providerGrid');
    if (!grid) return;

    grid.addEventListener('click', function (e) {
      // Vote buttons handled separately
      if (e.target.closest('.vote-btn')) return;

      // Detail button
      var detailBtn = e.target.closest('.btn-detail');
      if (detailBtn) {
        e.preventDefault();
        openDetail(detailBtn.getAttribute('data-pk'));
        return;
      }

      // Card click (but not on links)
      var card = e.target.closest('.provider-card');
      if (card && !e.target.closest('a')) {
        openDetail(card.getAttribute('data-pk'));
      }
    });

    // Vote delegation
    grid.addEventListener('click', handleVoteClick);
  }

  function setupModalBackdrops() {
    var detail = document.getElementById('detailModal');
    if (detail) {
      detail.addEventListener('click', function (e) {
        if (e.target === detail) closeDetail();
      });
      // Vote clicks inside modal
      detail.addEventListener('click', handleVoteClick);
    }
  }

  function setupSearch() {
    var input = document.getElementById('searchInput');
    if (!input) return;
    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(applyFilters, 150);
    });
  }

  function setupSidebarToggle() {
    var btn = document.getElementById('sidebarToggle');
    var panel = document.getElementById('sidebarPanel');
    if (!btn || !panel) return;
    // Start expanded on desktop
    if (window.innerWidth > 768) panel.classList.remove('collapsed');
    btn.addEventListener('click', function () {
      panel.classList.toggle('collapsed');
      btn.classList.toggle('open');
    });
  }

  window._filterCat = filterCat;
  window._closeDetail = closeDetail;

  function normalizeCategories(list) {
    for (var n = 0; n < list.length; n++) {
      var cat = list[n].categoria || list[n].category || '';
      if (!cat) {
        list[n].categoria = guessCategory(list[n].servicio || list[n].service);
      }
    }
    return list;
  }

  function renderInitial(list) {
    providers = normalizeCategories(list || []);
    // Clear skeleton-grid class so real cards use the normal layout.
    var grid = document.getElementById('providerGrid');
    if (grid) grid.classList.remove('skeleton-grid');
    applyFilters();
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupCardClicks();
    setupModalBackdrops();
    setupSearch();
    setupSidebarToggle();

    // 1. Instant paint from localStorage cache (if available).
    if (window.__providersCache && window.__providersCache.length) {
      renderInitial(window.__providersCache.slice());
    }

    // 2. Live refresh from the prefetched network request.
    var identity = window.CostaSurAuth ? window.CostaSurAuth.getIdentity() : null;
    window.CostaSurDB.fetchProviders(identity).then(function (fresh) {
      if (fresh && fresh.length) renderInitial(fresh);
    });
  });
})();
