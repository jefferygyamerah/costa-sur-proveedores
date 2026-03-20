/**
 * Costa Sur Proveedores — Lightweight household identity
 *
 * Stores identity in sessionStorage. When a protected action (vote, review)
 * is attempted without identity, opens a compact modal to capture
 * comunidad + casa, then continues the original action.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'costasur_identity';

  function getIdentity() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var id = JSON.parse(raw);
      if (id && id.comunidad && id.casa) return id;
      return null;
    } catch (_) {
      return null;
    }
  }

  function setIdentity(identity) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  }

  function clearIdentity() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Ensure identity exists before running callback.
   * If identity is missing, opens modal. On success, calls callback(identity).
   */
  function requireIdentity(callback) {
    var id = getIdentity();
    if (id) {
      callback(id);
      return;
    }
    showIdentityModal(callback);
  }

  // ------------------------------------------------------------------
  // Identity modal
  // ------------------------------------------------------------------

  var modalEl = null;

  function showIdentityModal(callback) {
    if (modalEl) modalEl.remove();

    var overlay = document.createElement('div');
    overlay.className = 'identity-overlay';
    overlay.innerHTML =
      '<div class="identity-modal">' +
        '<div class="identity-header">' +
          '<div class="identity-title">Identifica tu hogar</div>' +
          '<button class="identity-close" aria-label="Cerrar">\u2715</button>' +
        '</div>' +
        '<p class="identity-desc">Usamos esta informaci\u00f3n para registrar recomendaciones por hogar.</p>' +
        '<div class="form-group">' +
          '<label class="form-label">Residencial <span class="req">*</span></label>' +
          '<select class="form-select" id="id-comunidad">' +
            '<option value="">Seleccionar...</option>' +
            '<option value="Villa Valencia">Villa Valencia</option>' +
            '<option value="Costa Esmeralda">Costa Esmeralda</option>' +
            '<option value="El Doral">El Doral</option>' +
            '<option value="Costa Mare">Costa Mare</option>' +
            '<option value="Sunset Coast">Sunset Coast</option>' +
            '<option value="Villa Sur">Villa Sur</option>' +
            '<option value="Costa Sur Village">Costa Sur Village</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">N\u00famero de casa <span class="req">*</span></label>' +
          '<input type="text" class="form-input" id="id-casa" placeholder="Ej. 104"/>' +
        '</div>' +
        '<button class="btn-submit" id="id-submit">Continuar</button>' +
      '</div>';

    document.body.appendChild(overlay);
    modalEl = overlay;

    // Focus first field
    setTimeout(function () {
      var sel = document.getElementById('id-comunidad');
      if (sel) sel.focus();
    }, 50);

    // Close
    overlay.querySelector('.identity-close').addEventListener('click', function () {
      overlay.remove();
      modalEl = null;
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.remove();
        modalEl = null;
      }
    });

    // Submit
    document.getElementById('id-submit').addEventListener('click', function () {
      var comunidad = document.getElementById('id-comunidad').value;
      var casa = (document.getElementById('id-casa').value || '').trim();
      if (!comunidad || !casa) {
        alert('Completa ambos campos.');
        return;
      }
      var identity = { comunidad: comunidad, casa: casa };
      setIdentity(identity);
      overlay.remove();
      modalEl = null;
      callback(identity);
    });
  }

  window.CostaSurAuth = {
    getIdentity: getIdentity,
    setIdentity: setIdentity,
    clearIdentity: clearIdentity,
    requireIdentity: requireIdentity
  };
})();
