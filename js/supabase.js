/**
 * Costa Sur Proveedores — API client (Google Sheets backend)
 *
 * Despite the filename, this talks to Apps Script, not Supabase.
 * Kept for continuity with existing script references.
 */
(function () {
  'use strict';

  var cfg = window.COSTASUR_CONFIG || {};

  function isConfigured() {
    return cfg.APPS_SCRIPT_URL && cfg.APPS_SCRIPT_URL.indexOf('YOUR_') === -1;
  }

  // ---------------------------------------------------------------
  // Fetch providers (enriched with votes + reviews)
  // ---------------------------------------------------------------

  async function fetchProviders(identity) {
    if (!isConfigured()) return getDemoProviders();

    try {
      var url = cfg.APPS_SCRIPT_URL + '?action=providers';
      if (identity && identity.comunidad && identity.casa) {
        url += '&comunidad=' + encodeURIComponent(identity.comunidad);
        url += '&casa=' + encodeURIComponent(identity.casa);
      }
      var resp = await fetch(url);
      var json = await resp.json();

      if (json.success && json.data && json.data.providers) {
        return json.data.providers;
      }
      // Legacy format fallback
      if (json.providers) return json.providers;

      console.warn('Unexpected response shape, using demo data');
      return getDemoProviders();
    } catch (err) {
      console.error('Fetch providers failed:', err);
      return getDemoProviders();
    }
  }

  // ---------------------------------------------------------------
  // Submit provider recommendation
  // ---------------------------------------------------------------

  async function submitProvider(provider, recommendation) {
    if (!isConfigured()) return { ok: true, demo: true };

    try {
      var payload = {
        action: 'submit',
        nombre: provider.name,
        categoria: provider.category,
        servicio: provider.service,
        telefono: provider.phone,
        correo: provider.email || '',
        comunidad: recommendation.community,
        casa: recommendation.house_number,
        recomendadoPor: recommendation.name || '',
        comentario: recommendation.comment || ''
      };
      var resp = await fetch(cfg.APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      var json = await resp.json();
      return { ok: json.success !== false };
    } catch (err) {
      // Fallback to GET
      try {
        var data = JSON.stringify({
          nombre: provider.name,
          categoria: provider.category,
          servicio: provider.service,
          telefono: provider.phone,
          correo: provider.email || '',
          comunidad: recommendation.community,
          casa: recommendation.house_number,
          recomendadoPor: recommendation.name || '',
          comentario: recommendation.comment || ''
        });
        var url = cfg.APPS_SCRIPT_URL + '?action=submit&data=' + encodeURIComponent(data);
        var r = await fetch(url);
        var j = await r.json();
        return { ok: j.success !== false && j.status !== 'error' };
      } catch (err2) {
        return { ok: false, error: err2.message };
      }
    }
  }

  // ---------------------------------------------------------------
  // Submit vote
  // ---------------------------------------------------------------

  async function submitVote(payload) {
    if (!isConfigured()) {
      return { ok: true, demo: true, voteScore: payload.voto, userVote: payload.voto };
    }

    try {
      var body = {
        action: 'vote',
        providerKey: payload.providerKey,
        comunidad: payload.comunidad,
        casa: payload.casa,
        voto: payload.voto
      };
      var resp = await fetch(cfg.APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      var json = await resp.json();
      if (json.success) {
        return { ok: true, voteScore: json.data.voteScore, userVote: json.data.userVote };
      }
      return { ok: false, error: json.error };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // ---------------------------------------------------------------
  // Submit review
  // ---------------------------------------------------------------

  async function submitReview(payload) {
    if (!isConfigured()) return { ok: true, demo: true };

    try {
      var body = {
        action: 'review',
        providerKey: payload.providerKey,
        comunidad: payload.comunidad,
        casa: payload.casa,
        nombre: payload.nombre,
        estrellas: payload.estrellas,
        texto: payload.texto
      };
      var resp = await fetch(cfg.APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      var json = await resp.json();
      if (json.success) return { ok: true };
      return { ok: false, error: json.error };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // ---------------------------------------------------------------
  // Demo data
  // ---------------------------------------------------------------

  function getDemoProviders() {
    var demo = [
      { providerKey:'raul-moreno-65887198', nombre:'Ra\u00fal Moreno', categoria:'aires', servicio:'Limpieza, reparaci\u00f3n e instalaci\u00f3n de aires acondicionados', telefono:'6588-7198', correo:null },
      { providerKey:'cheffy-le-cheff-2691220', nombre:'Cheffy Le Cheff', categoria:'catering', servicio:'Catering, comida y equipo para fiestas', telefono:'269-1220', correo:'Ventas@cheffylecheff.com' },
      { providerKey:'hector-canate-64617563', nombre:'H\u00e9ctor Ca\u00f1ate', categoria:'jardineria', servicio:'Jardiner\u00eda', telefono:'6461-7563', correo:null },
      { providerKey:'antonio-69838544', nombre:'Antonio', categoria:'linea-blanca', servicio:'Lavadoras, secadoras \u2014 reparaci\u00f3n y mantenimiento', telefono:'6983-8544', correo:null },
      { providerKey:'dario-hernandez-66344065', nombre:'Dario Hernandez', categoria:'plomeria', servicio:'Plomer\u00eda', telefono:'6634-4065', correo:null },
      { providerKey:'marcos-sanchez-64846335', nombre:'Marcos Sanchez', categoria:'general', servicio:'Trabajos generales: pintura, techo, alba\u00f1iler\u00eda', telefono:'6484-6335', correo:null },
      { providerKey:'felix-68134069', nombre:'Felix', categoria:'aires', servicio:'Aires acondicionados \u2014 instalaci\u00f3n y mantenimiento', telefono:'6813-4069', correo:null },
      { providerKey:'alexis-angulo-63203154', nombre:'Alexis Angulo', categoria:'fumigacion', servicio:'Fumigaci\u00f3n', telefono:'6320-3154', correo:null },
      { providerKey:'norbing-mercado-65802214', nombre:'Norbing Mercado', categoria:'jardineria', servicio:'Jardiner\u00eda', telefono:'6580-2214', correo:null },
      { providerKey:'carlos-yanez-64870098', nombre:'Carlos Ya\u00f1ez', categoria:'techo', servicio:'Techo y canales de techo', telefono:'6487-0098', correo:null },
      { providerKey:'wa-engineering-solutions-69985838', nombre:'W&A Engineering Solutions', categoria:'solar', servicio:'Instalaci\u00f3n y mantenimiento de paneles solares', telefono:'6998-5838', correo:null },
      { providerKey:'vidrios-y-aluminio-mega-64158511', nombre:'Vidrios y Aluminio Mega', categoria:'vidrios', servicio:'Ventanas y vidrios', telefono:'6415-8511', correo:null }
    ];
    return demo.map(function (p) {
      return Object.assign({}, p, {
        recCount: 1,
        communityCount: 1,
        recommendations: [{ community: 'Villa Valencia', house_number: '104' }],
        voteScore: 0,
        userVote: null,
        reviewCount: 0,
        averageRating: 0,
        reviews: []
      });
    });
  }

  window.CostaSurDB = {
    fetchProviders: fetchProviders,
    submitProvider: submitProvider,
    submitVote: submitVote,
    submitReview: submitReview
  };
})();
