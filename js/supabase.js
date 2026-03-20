/**
 * Costa Sur Proveedores — Google Sheets backend
 */
(function () {
  'use strict';

  var cfg = window.COSTASUR_CONFIG || {};

  function isConfigured() {
    return cfg.APPS_SCRIPT_URL && cfg.APPS_SCRIPT_URL.indexOf('YOUR_') === -1;
  }

  // Fetch approved providers from Google Sheet
  async function fetchProviders() {
    if (!isConfigured()) return getDemoProviders();

    try {
      var resp = await fetch(cfg.APPS_SCRIPT_URL + '?action=providers');
      var data = await resp.json();
      return (data.providers || []).map(function (p) {
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          service: p.service,
          phone: p.phone,
          email: p.email || null,
          recCount: p.recCount || 1,
          communityCount: p.communityCount || 1,
          recommendations: p.recommendations || []
        };
      });
    } catch (err) {
      console.error('Fetch failed:', err);
      return getDemoProviders();
    }
  }

  // Submit a new provider recommendation
  async function submitProvider(provider, recommendation) {
    if (!isConfigured()) return { ok: true, demo: true };

    try {
      await fetch(cfg.APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          _type: 'provider',
          nombre: provider.name,
          categoria: provider.category,
          servicio: provider.service,
          telefono: provider.phone,
          correo: provider.email || '',
          comunidad: recommendation.community,
          casa: recommendation.house_number,
          recomendadoPor: recommendation.name || '',
          comentario: recommendation.comment || ''
        })
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // Demo data for local development
  function getDemoProviders() {
    var demo = [
      { id:'1',  name:'Raul Moreno',              category:'aires',       service:'Limpieza, reparaci\u00f3n e instalaci\u00f3n de aires acondicionados', phone:'6588-7198', email:null },
      { id:'2',  name:'Cheffy Le Cheff',           category:'catering',    service:'Catering, comida y equipo para fiestas',                     phone:'269-1220',  email:'Ventas@cheffylecheff.com' },
      { id:'3',  name:'H\u00e9ctor Ca\u00f1ate',   category:'jardineria',  service:'Jardiner\u00eda',                                            phone:'6461-7563', email:null },
      { id:'4',  name:'Antonio',                   category:'linea-blanca',service:'Lavadoras, secadoras \u2014 reparaci\u00f3n y mantenimiento', phone:'6983-8544', email:null },
      { id:'5',  name:'Dario Hernandez',           category:'plomeria',    service:'Plomer\u00eda',                                              phone:'6634-4065', email:null },
      { id:'6',  name:'Marcos Sanchez',            category:'general',     service:'Trabajos generales: pintura, techo, alba\u00f1iler\u00eda',   phone:'6484-6335', email:null },
      { id:'7',  name:'Felix',                     category:'aires',       service:'Aires acondicionados \u2014 instalaci\u00f3n y mantenimiento',phone:'6813-4069', email:null },
      { id:'8',  name:'Alexis Angulo',             category:'fumigacion',  service:'Fumigaci\u00f3n',                                            phone:'6320-3154', email:null },
      { id:'9',  name:'Norbing Mercado',           category:'jardineria',  service:'Jardiner\u00eda',                                            phone:'6580-2214', email:null },
      { id:'10', name:'Carlos Ya\u00f1ez',         category:'techo',       service:'Techo y canales de techo',                                   phone:'6487-0098', email:null },
      { id:'11', name:'W&A Engineering Solutions',  category:'solar',       service:'Instalaci\u00f3n y mantenimiento de paneles solares',         phone:'6998-5838', email:null },
      { id:'12', name:'Vidrios y Aluminio Mega',   category:'vidrios',     service:'Ventanas y vidrios',                                         phone:'6415-8511', email:null }
    ];
    return demo.map(function (p) {
      return Object.assign({}, p, {
        recCount: 1,
        communityCount: 1,
        recommendations: [{ community: 'Villa Valencia', house_number: '104' }]
      });
    });
  }

  window.CostaSurDB = {
    fetchProviders: fetchProviders,
    submitProvider: submitProvider
  };
})();
