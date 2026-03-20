/**
 * Costa Sur Proveedores — Google Apps Script
 *
 * Handles:
 * - Provider submissions (POST action=submit)
 * - Approved provider list with votes/reviews (GET action=providers)
 * - Vote recording (POST action=vote)
 * - Review submission (POST action=review)
 *
 * Sheets:
 *   Proveedores: Timestamp | Nombre | Categoria | Servicio | Telefono | Correo |
 *                Comunidad | Casa | Recomendado Por | Comentario | Estado
 *   Votos:       Timestamp | ProviderKey | Comunidad | Casa | HouseholdKey | Voto
 *   Resenas:     Timestamp | ProviderKey | Comunidad | Casa | HouseholdKey |
 *                NombreReviewer | Estrellas | Texto | Estado | ModeradoPor | ModeradoEn
 */

// ---------------------------------------------------------------------------
// Sheet helpers
// ---------------------------------------------------------------------------

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getProveedoresSheet() {
  return getOrCreateSheet('Proveedores', [
    'Timestamp', 'Nombre', 'Categoria', 'Servicio', 'Telefono',
    'Correo', 'Comunidad', 'Casa', 'Recomendado Por', 'Comentario', 'Estado'
  ]);
}

function getVotosSheet() {
  return getOrCreateSheet('Votos', [
    'Timestamp', 'ProviderKey', 'Comunidad', 'Casa', 'HouseholdKey', 'Voto'
  ]);
}

function getResenasSheet() {
  return getOrCreateSheet('Resenas', [
    'Timestamp', 'ProviderKey', 'Comunidad', 'Casa', 'HouseholdKey',
    'NombreReviewer', 'Estrellas', 'Texto', 'Estado', 'ModeradoPor', 'ModeradoEn'
  ]);
}

// ---------------------------------------------------------------------------
// Identity helpers
// ---------------------------------------------------------------------------

function makeHouseholdKey(comunidad, casa) {
  return String(comunidad || '').trim().toLowerCase() + '|' + String(casa || '').trim().toLowerCase();
}

function makeProviderKey(nombre, telefono) {
  var slug = String(nombre || '').trim().toLowerCase()
    .replace(/[^a-z0-9\u00e0-\u00ff]+/g, '-')
    .replace(/^-|-$/g, '');
  var phone = String(telefono || '').replace(/\D/g, '');
  return slug + '-' + phone;
}

// ---------------------------------------------------------------------------
// Text sanitization
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Category inference from service description
// ---------------------------------------------------------------------------

function guessCategoria(servicio) {
  var s = String(servicio || '').toLowerCase();
  var rules = [
    ['aires', ['aire', 'a/c', 'acondicionado', 'clima']],
    ['catering', ['catering', 'comida', 'fiesta', 'evento']],
    ['jardineria', ['jardin', 'jardiner']],
    ['linea-blanca', ['lavadora', 'secadora', 'linea blanca', 'línea blanca', 'electrodom']],
    ['plomeria', ['plomer', 'plomero']],
    ['fumigacion', ['fumiga']],
    ['techo', ['techo', 'canal', 'gotera']],
    ['solar', ['solar', 'panel']],
    ['vidrios', ['vidrio', 'aluminio', 'ventana']],
    ['general', ['pintura', 'alba', 'constructor', 'general', 'acarreo', 'reparaci']]
  ];
  for (var i = 0; i < rules.length; i++) {
    for (var j = 0; j < rules[i][1].length; j++) {
      if (s.indexOf(rules[i][1][j]) !== -1) return rules[i][0];
    }
  }
  return 'general';
}

function sanitize(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// JSON response helpers
// ---------------------------------------------------------------------------

function jsonOk(data) {
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, data: data })
  ).setMimeType(ContentService.MimeType.JSON);
}

function jsonError(msg) {
  return ContentService.createTextOutput(
    JSON.stringify({ success: false, error: msg })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// GET — providers list
// ---------------------------------------------------------------------------

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'providers';

  if (action === 'providers') {
    var comunidad = (e && e.parameter && e.parameter.comunidad) || '';
    var casa = (e && e.parameter && e.parameter.casa) || '';
    return serveProviders(comunidad, casa);
  }

  // Legacy: GET submit support
  if (action === 'submit') {
    return handleSubmitGet(e.parameter.data || '{}');
  }

  return jsonError('Accion desconocida');
}

// ---------------------------------------------------------------------------
// POST — submit, vote, review
// ---------------------------------------------------------------------------

function doPost(e) {
  try {
    var raw = '';
    if (e && e.postData) {
      raw = e.postData.contents || '';
    } else if (e && e.parameter && e.parameter.data) {
      raw = e.parameter.data;
    }

    var data = JSON.parse(raw);
    var action = data.action || 'submit';

    if (action === 'submit') return handleSubmit(data);
    if (action === 'vote') return handleVote(data);
    if (action === 'review') return handleReview(data);

    return jsonError('Accion desconocida');
  } catch (err) {
    return jsonError('Error: ' + err.message);
  }
}

// ---------------------------------------------------------------------------
// Submit provider recommendation
// ---------------------------------------------------------------------------

function handleSubmit(data) {
  var sheet = getProveedoresSheet();
  sheet.appendRow([
    new Date(),
    data.nombre || '',
    data.categoria || '',
    data.servicio || '',
    data.telefono || '',
    data.correo || '',
    data.comunidad || '',
    data.casa || '',
    data.recomendadoPor || '',
    data.comentario || '',
    'pendiente'
  ]);
  return jsonOk({ status: 'ok' });
}

function handleSubmitGet(raw) {
  try {
    var data = JSON.parse(raw);
    return handleSubmit(data);
  } catch (err) {
    return jsonError(err.message);
  }
}

// ---------------------------------------------------------------------------
// Vote
// ---------------------------------------------------------------------------

function handleVote(data) {
  var providerKey = String(data.providerKey || '').trim();
  var comunidad = String(data.comunidad || '').trim();
  var casa = String(data.casa || '').trim();
  var voto = Number(data.voto);

  if (!providerKey) return jsonError('providerKey requerido');
  if (!comunidad) return jsonError('comunidad requerida');
  if (!casa) return jsonError('casa requerida');
  if (voto !== 1 && voto !== -1) return jsonError('voto debe ser 1 o -1');

  var householdKey = makeHouseholdKey(comunidad, casa);
  var sheet = getVotosSheet();
  var rows = sheet.getDataRange().getValues();

  // Find existing vote for this household + provider
  var existingRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === providerKey &&
        String(rows[i][4]).trim() === householdKey) {
      existingRow = i + 1; // 1-indexed
      break;
    }
  }

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1).setValue(new Date());
    sheet.getRange(existingRow, 6).setValue(voto);
  } else {
    sheet.appendRow([
      new Date(), providerKey, comunidad, casa, householdKey, voto
    ]);
  }

  // Compute new score for this provider
  var allRows = sheet.getDataRange().getValues();
  var score = 0;
  for (var j = 1; j < allRows.length; j++) {
    if (String(allRows[j][1]).trim() === providerKey) {
      score += Number(allRows[j][5]) || 0;
    }
  }

  return jsonOk({ voteScore: score, userVote: voto });
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

function handleReview(data) {
  var providerKey = String(data.providerKey || '').trim();
  var comunidad = String(data.comunidad || '').trim();
  var casa = String(data.casa || '').trim();
  var nombre = String(data.nombre || '').trim();
  var estrellas = Number(data.estrellas);
  var texto = String(data.texto || '').trim();

  if (!providerKey) return jsonError('providerKey requerido');
  if (!comunidad) return jsonError('comunidad requerida');
  if (!casa) return jsonError('casa requerida');
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    return jsonError('estrellas debe ser entre 1 y 5');
  }
  if (!texto) return jsonError('texto requerido');
  if (texto.length > 500) return jsonError('texto excede 500 caracteres');

  var householdKey = makeHouseholdKey(comunidad, casa);
  var sheet = getResenasSheet();

  sheet.appendRow([
    new Date(),
    providerKey,
    comunidad,
    casa,
    householdKey,
    nombre || ('Casa ' + casa),
    estrellas,
    texto,
    'pendiente',
    '',
    ''
  ]);

  return jsonOk({ status: 'ok' });
}

// ---------------------------------------------------------------------------
// Serve providers with aggregated votes + reviews
// ---------------------------------------------------------------------------

function serveProviders(comunidad, casa) {
  var provSheet = getProveedoresSheet();
  var provData = provSheet.getDataRange().getValues();

  var votosSheet = getVotosSheet();
  var votosData = votosSheet.getDataRange().getValues();

  var resenasSheet = getResenasSheet();
  var resenasData = resenasSheet.getDataRange().getValues();

  // Caller identity
  var callerKey = '';
  if (comunidad && casa) {
    callerKey = makeHouseholdKey(comunidad, casa);
  }

  // Build provider list from approved rows
  var providersMap = {};
  var providersList = [];

  for (var i = 1; i < provData.length; i++) {
    var estado = String(provData[i][10] || '').trim().toLowerCase();
    if (estado !== 'aprobado') continue;

    var nombre = String(provData[i][1] || '').trim();
    var categoria = String(provData[i][2] || '').trim();
    var servicio = String(provData[i][3] || '').trim();
    if (!categoria) categoria = guessCategoria(servicio);
    var telefono = String(provData[i][4] || '').trim();
    var correo = String(provData[i][5] || '').trim();
    var com = String(provData[i][6] || '').trim();
    var cas = String(provData[i][7] || '').trim();

    var key = makeProviderKey(nombre, telefono);

    if (!providersMap[key]) {
      providersMap[key] = {
        providerKey: key,
        nombre: nombre,
        categoria: categoria,
        servicio: servicio,
        telefono: telefono,
        correo: correo || null,
        recommendations: [],
        voteScore: 0,
        userVote: null,
        reviewCount: 0,
        averageRating: 0,
        reviews: []
      };
      providersList.push(providersMap[key]);
    }

    providersMap[key].recommendations.push({
      community: com,
      house_number: cas
    });
  }

  // Aggregate votes
  var votesByProvider = {};
  for (var v = 1; v < votosData.length; v++) {
    var vKey = String(votosData[v][1]).trim();
    var vHousehold = String(votosData[v][4]).trim();
    var vVal = Number(votosData[v][5]) || 0;

    if (!votesByProvider[vKey]) {
      votesByProvider[vKey] = { score: 0, byHousehold: {} };
    }
    votesByProvider[vKey].score += vVal;
    votesByProvider[vKey].byHousehold[vHousehold] = vVal;
  }

  // Aggregate approved reviews
  var reviewsByProvider = {};
  for (var r = 1; r < resenasData.length; r++) {
    var rEstado = String(resenasData[r][8] || '').trim().toLowerCase();
    if (rEstado !== 'aprobado') continue;

    var rKey = String(resenasData[r][1]).trim();
    if (!reviewsByProvider[rKey]) {
      reviewsByProvider[rKey] = [];
    }
    reviewsByProvider[rKey].push({
      nombreReviewer: sanitize(String(resenasData[r][5] || '')),
      estrellas: Number(resenasData[r][6]) || 0,
      texto: sanitize(String(resenasData[r][7] || '')),
      timestamp: resenasData[r][0] ? new Date(resenasData[r][0]).toISOString() : ''
    });
  }

  // Merge into providers
  for (var p = 0; p < providersList.length; p++) {
    var prov = providersList[p];
    var pk = prov.providerKey;

    // Votes
    if (votesByProvider[pk]) {
      prov.voteScore = votesByProvider[pk].score;
      if (callerKey && votesByProvider[pk].byHousehold[callerKey] !== undefined) {
        prov.userVote = votesByProvider[pk].byHousehold[callerKey];
      }
    }

    // Reviews
    if (reviewsByProvider[pk]) {
      prov.reviews = reviewsByProvider[pk];
      prov.reviewCount = reviewsByProvider[pk].length;
      var sum = 0;
      for (var s = 0; s < prov.reviews.length; s++) {
        sum += prov.reviews[s].estrellas;
      }
      prov.averageRating = prov.reviewCount > 0
        ? Math.round((sum / prov.reviewCount) * 10) / 10
        : 0;
    }

    // Compute rec counts
    prov.recCount = prov.recommendations.length;
    var communities = {};
    for (var c = 0; c < prov.recommendations.length; c++) {
      communities[prov.recommendations[c].community] = true;
    }
    prov.communityCount = Object.keys(communities).length;
  }

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, data: { providers: providersList } })
  ).setMimeType(ContentService.MimeType.JSON);
}
