/**
 * Costa Sur Proveedores — Submission form logic
 */
(function () {
  'use strict';

  async function populateCommunities() {
    var communities = await window.CostaSurDB.fetchCommunities();
    var select = document.getElementById('sug-comunidad');
    if (!select) return;
    for (var i = 0; i < communities.length; i++) {
      var opt = document.createElement('option');
      opt.value = communities[i].slug;
      opt.textContent = communities[i].name;
      select.appendChild(opt);
    }
  }

  function submitSuggest() {
    var nombre = (document.getElementById('sug-nombre').value || '').trim();
    var categoria = document.getElementById('sug-categoria').value;
    var servicio = (document.getElementById('sug-servicio').value || '').trim();
    var telefono = (document.getElementById('sug-telefono').value || '').trim();
    var comunidad = document.getElementById('sug-comunidad').value;
    var casa = (document.getElementById('sug-casa').value || '').trim();

    if (!nombre || !categoria || !servicio || !telefono || !comunidad || !casa) {
      alert('Por favor completa los campos obligatorios (*).');
      return;
    }

    var btn = document.querySelector('.btn-submit');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    var provider = {
      name: nombre,
      category: categoria,
      service: servicio,
      phone: telefono,
      email: (document.getElementById('sug-correo').value || '').trim() || null
    };

    var recommendation = {
      community: comunidad,
      house_number: casa,
      name: (document.getElementById('sug-recomendador').value || '').trim() || null,
      comment: (document.getElementById('sug-comentario').value || '').trim() || null
    };

    window.CostaSurDB.submitProvider(provider, recommendation).then(function (result) {
      if (result.ok) {
        showSuccess();
      } else {
        alert('Error: ' + (result.error || 'Intenta de nuevo.'));
        btn.disabled = false;
        btn.textContent = 'Enviar recomendacion \u2192';
      }
    });
  }

  function showSuccess() {
    document.getElementById('suggestForm').style.display = 'none';
    document.getElementById('suggestSuccess').classList.add('show');
  }

  function resetForm() {
    var fields = ['sug-nombre', 'sug-categoria', 'sug-servicio', 'sug-telefono',
                  'sug-correo', 'sug-comunidad', 'sug-casa', 'sug-recomendador', 'sug-comentario'];
    for (var i = 0; i < fields.length; i++) {
      var el = document.getElementById(fields[i]);
      if (el) el.value = '';
    }
    document.getElementById('suggestForm').style.display = '';
    document.getElementById('suggestSuccess').classList.remove('show');
    var btn = document.querySelector('.btn-submit');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Enviar recomendacion \u2192';
    }
  }

  window._submitSuggest = submitSuggest;
  window._resetForm = resetForm;

  document.addEventListener('DOMContentLoaded', function () {
    populateCommunities();
  });
})();
