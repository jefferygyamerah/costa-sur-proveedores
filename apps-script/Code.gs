/**
 * Costa Sur Proveedores — Google Apps Script
 *
 * Handles provider submissions and serves approved providers as JSON.
 *
 * Sheet structure (single sheet "Proveedores"):
 * Row 1: Headers
 * Columns: Timestamp | Nombre | Categoria | Servicio | Telefono | Correo |
 *          Comunidad | Casa | Recomendado Por | Comentario | Estado
 *
 * "Estado" column: leave blank or set to "pendiente" for new submissions.
 * Set to "aprobado" to make the provider visible on the site.
 * Set to "rechazado" to hide permanently.
 */

var SHEET_NAME = 'Proveedores';
var FEEDBACK_SHEET_NAME = 'Feedback';

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'Nombre', 'Categoria', 'Servicio', 'Telefono',
      'Correo', 'Comunidad', 'Casa', 'Recomendado Por', 'Comentario', 'Estado'
    ]);
    // Format header row
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// GET — return approved providers as JSON
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'providers';

  if (action === 'providers') {
    return serveProviders();
  }

  if (action === 'feedback') {
    var providerName = (e.parameter && e.parameter.provider) || '';
    var providerPhone = (e.parameter && e.parameter.phone) || '';
    return serveFeedback(providerName, providerPhone);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ error: 'Unknown action' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function serveProviders() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var providersMap = {};
  var providersList = [];

  for (var i = 1; i < data.length; i++) {
    var estado = String(data[i][10] || '').trim().toLowerCase();
    if (estado !== 'aprobado') continue;

    var nombre = String(data[i][1] || '').trim();
    var categoria = String(data[i][2] || '').trim();
    var servicio = String(data[i][3] || '').trim();
    var telefono = String(data[i][4] || '').trim();
    var correo = String(data[i][5] || '').trim();
    var comunidad = String(data[i][6] || '').trim();
    var casa = String(data[i][7] || '').trim();

    // Group by provider (name + phone as key)
    var key = nombre.toLowerCase() + '|' + telefono;

    if (!providersMap[key]) {
      providersMap[key] = {
        id: String(i),
        name: nombre,
        category: categoria,
        service: servicio,
        phone: telefono,
        email: correo || null,
        recommendations: []
      };
      providersList.push(providersMap[key]);
    }

    providersMap[key].recommendations.push({
      community: comunidad,
      house_number: casa
    });
  }

  // Compute counts
  for (var j = 0; j < providersList.length; j++) {
    var p = providersList[j];
    p.recCount = p.recommendations.length;
    var communities = {};
    for (var k = 0; k < p.recommendations.length; k++) {
      communities[p.recommendations[k].community] = true;
    }
    p.communityCount = Object.keys(communities).length;
  }

  return ContentService.createTextOutput(
    JSON.stringify({ providers: providersList })
  ).setMimeType(ContentService.MimeType.JSON);
}

// POST — route by _type field
function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data._type === 'feedback') {
    return handleFeedbackPost(data);
  }

  // Default: provider recommendation
  var sheet = getSheet();
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

  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// --- Feedback ---

function getFeedbackSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(FEEDBACK_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(FEEDBACK_SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'ProviderName', 'ProviderPhone', 'Rating',
      'Comment', 'Community', 'Casa', 'Estado'
    ]);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Verify that the community+casa combo exists as a recommender on an approved row
function isVerifiedRecommender(comunidad, casa) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var estado = String(data[i][10] || '').trim().toLowerCase();
    if (estado !== 'aprobado') continue;
    var rowComunidad = String(data[i][6] || '').trim().toLowerCase();
    var rowCasa = String(data[i][7] || '').trim().toLowerCase();
    if (rowComunidad === comunidad.trim().toLowerCase() &&
        rowCasa === casa.trim().toLowerCase()) {
      return true;
    }
  }
  return false;
}

function handleFeedbackPost(data) {
  var comunidad = data.comunidad || '';
  var casa = data.casa || '';

  if (!isVerifiedRecommender(comunidad, casa)) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: 'No encontramos tu recomendación. Solo residentes que han recomendado un proveedor pueden dejar opiniones.' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var feedbackSheet = getFeedbackSheet();
  feedbackSheet.appendRow([
    new Date(),
    data.providerName || '',
    data.providerPhone || '',
    data.rating || '',
    data.comment || '',
    comunidad,
    casa,
    'pendiente'
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// Serve approved feedback for a specific provider
function serveFeedback(providerName, providerPhone) {
  var sheet = getFeedbackSheet();
  var data = sheet.getDataRange().getValues();
  var feedback = [];
  var thumbsUp = 0;
  var thumbsDown = 0;

  for (var i = 1; i < data.length; i++) {
    var estado = String(data[i][7] || '').trim().toLowerCase();
    if (estado !== 'aprobado') continue;

    var name = String(data[i][1] || '').trim().toLowerCase();
    var phone = String(data[i][2] || '').trim();

    if (name === providerName.trim().toLowerCase() && phone === providerPhone.trim()) {
      var rating = String(data[i][3] || '').trim();
      if (rating === 'up') thumbsUp++;
      if (rating === 'down') thumbsDown++;

      var comment = String(data[i][4] || '').trim();
      if (comment) {
        feedback.push({
          rating: rating,
          comment: comment,
          community: String(data[i][5] || '').trim()
        });
      }
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({ thumbsUp: thumbsUp, thumbsDown: thumbsDown, comments: feedback })
  ).setMimeType(ContentService.MimeType.JSON);
}
