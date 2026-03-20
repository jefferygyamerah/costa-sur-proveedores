/**
 * Costa Sur Proveedores — Supabase client wrapper
 */
(function () {
  'use strict';

  var cfg = window.COSTASUR_CONFIG || {};
  var client = null;

  function getClient() {
    if (client) return client;
    if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.indexOf('YOUR_') !== -1) {
      console.warn('Supabase not configured — using demo mode');
      return null;
    }
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    return client;
  }

  // Fetch approved providers with recommendation counts
  async function fetchProviders() {
    var sb = getClient();
    if (!sb) return getDemoProviders();

    var { data: providers, error: pErr } = await sb
      .from('providers')
      .select('*')
      .eq('status', 'approved')
      .order('name');

    if (pErr) { console.error(pErr); return getDemoProviders(); }

    var { data: recs, error: rErr } = await sb
      .from('recommendations')
      .select('provider_id, community, house_number')
      .eq('status', 'approved');

    if (rErr) { console.error(rErr); recs = []; }

    // Aggregate recommendations per provider
    var recMap = {};
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i];
      if (!recMap[r.provider_id]) recMap[r.provider_id] = [];
      recMap[r.provider_id].push(r);
    }

    return providers.map(function (p) {
      var pRecs = recMap[p.id] || [];
      var communities = {};
      for (var j = 0; j < pRecs.length; j++) {
        communities[pRecs[j].community] = true;
      }
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        service: p.service,
        phone: p.phone,
        email: p.email,
        recCount: pRecs.length,
        communityCount: Object.keys(communities).length,
        recommendations: pRecs
      };
    });
  }

  // Fetch communities for dropdown
  async function fetchCommunities() {
    var sb = getClient();
    if (!sb) return getDemoCommunities();

    var { data, error } = await sb.from('communities').select('*').order('name');
    if (error) { console.error(error); return getDemoCommunities(); }
    return data;
  }

  // Submit a new provider + recommendation
  async function submitProvider(provider, recommendation) {
    var sb = getClient();
    if (!sb) return { ok: true, demo: true };

    var { data: pData, error: pErr } = await sb
      .from('providers')
      .insert({
        name: provider.name,
        category: provider.category,
        service: provider.service,
        phone: provider.phone,
        email: provider.email || null,
        status: 'pending'
      })
      .select('id')
      .single();

    if (pErr) return { ok: false, error: pErr.message };

    var { error: rErr } = await sb
      .from('recommendations')
      .insert({
        provider_id: pData.id,
        community: recommendation.community,
        house_number: recommendation.house_number,
        recommender_name: recommendation.name || null,
        comment: recommendation.comment || null,
        status: 'pending'
      });

    if (rErr) return { ok: false, error: rErr.message };
    return { ok: true };
  }

  // Submit recommendation for existing provider
  async function submitRecommendation(providerId, recommendation) {
    var sb = getClient();
    if (!sb) return { ok: true, demo: true };

    var { error } = await sb
      .from('recommendations')
      .insert({
        provider_id: providerId,
        community: recommendation.community,
        house_number: recommendation.house_number,
        recommender_name: recommendation.name || null,
        comment: recommendation.comment || null,
        status: 'pending'
      });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  // Demo data for development without Supabase
  function getDemoProviders() {
    var demo = [
      { id:'1',  name:'Raul Moreno',              category:'aires',       service:'Limpieza, reparacion e instalacion de aires acondicionados', phone:'6588-7198', email:null },
      { id:'2',  name:'Cheffy Le Cheff',           category:'catering',    service:'Catering, comida y equipo para fiestas',                     phone:'269-1220',  email:'Ventas@cheffylecheff.com' },
      { id:'3',  name:'Hector Canate',             category:'jardineria',  service:'Jardineria',                                                 phone:'6461-7563', email:null },
      { id:'4',  name:'Antonio',                   category:'linea-blanca',service:'Lavadoras, secadoras — reparacion y mantenimiento',           phone:'6983-8544', email:null },
      { id:'5',  name:'Dario Hernandez',           category:'plomeria',    service:'Plomeria',                                                   phone:'6634-4065', email:null },
      { id:'6',  name:'Marcos Sanchez',             category:'general',     service:'Trabajos generales: pintura, techo, albanileria',             phone:'6484-6335', email:null },
      { id:'7',  name:'Felix',                     category:'aires',       service:'Aires acondicionados — instalacion y mantenimiento',          phone:'6813-4069', email:null },
      { id:'8',  name:'Alexis Angulo',             category:'fumigacion',  service:'Fumigacion',                                                 phone:'6320-3154', email:null },
      { id:'9',  name:'Norbing Mercado',           category:'jardineria',  service:'Jardineria',                                                 phone:'6580-2214', email:null },
      { id:'10', name:'Carlos Yanez',              category:'techo',       service:'Techo y canales de techo',                                   phone:'6487-0098', email:null },
      { id:'11', name:'W&A Engineering Solutions', category:'solar',       service:'Instalacion y mantenimiento de paneles solares',              phone:'6998-5838', email:null },
      { id:'12', name:'Vidrios y Aluminio Mega',   category:'vidrios',     service:'Ventanas y vidrios',                                         phone:'6415-8511', email:null }
    ];
    return demo.map(function (p) {
      return Object.assign({}, p, {
        recCount: 1,
        communityCount: 1,
        recommendations: [{ community: 'villa-valencia', house_number: '104' }]
      });
    });
  }

  function getDemoCommunities() {
    return [
      { slug: 'villa-valencia', name: 'Villa Valencia' },
      { slug: 'woodlands', name: 'Woodlands' },
      { slug: 'caminos-del-sur', name: 'Caminos del Sur' },
      { slug: 'green-village', name: 'Green Village' },
      { slug: 'panama-pacifico', name: 'Panama Pacifico' },
      { slug: 'brisas-del-golf', name: 'Brisas del Golf' },
      { slug: 'otro', name: 'Otra comunidad' }
    ];
  }

  window.CostaSurDB = {
    fetchProviders: fetchProviders,
    fetchCommunities: fetchCommunities,
    submitProvider: submitProvider,
    submitRecommendation: submitRecommendation
  };
})();
