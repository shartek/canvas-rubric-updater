  // ==UserScript==
// @name         Canvas Rubric Title Updater
// @namespace    https://github.com/shartek/canvas-rubric-updater
// @author       Shar ⭐
// @description  Update non-outcome rubric rating titles to Expected / Acceptable / Developing / Beginning
// @match        https://uwoms.instructure.com/courses/*/rubrics/*
// @match        https://earlyedu.instructure.com/courses/*/rubrics/*
// @version      3.0.0
// @updateURL    https://raw.githubusercontent.com/shartek/canvas-rubric-updater/main/rubric-updater.user.js
// @downloadURL  https://raw.githubusercontent.com/shartek/canvas-rubric-updater/main/rubric-updater.user.js
// @grant        none
// ==/UserScript==


(function () {
  'use strict';

  // --- CONFIGURABLE TITLES ---
  var ratingTitles = ['Expected', 'Acceptable', 'Developing', 'Beginning'];

  // --- PAGE CONTEXT ---
  var path = window.location.pathname;
  var parts = path.split('/').filter(Boolean);
  if (parts.length < 4 || parts[0] !== 'courses' || parts[2] !== 'rubrics') return;

  var courseId = parts[1];
  var rubricId = parts[3];

  // --- ADD BUTTON ---
  function addUpdateButton() {
    var container = document.getElementById('rubric-action-buttons');
    if (!container) return;

    if (document.getElementById('rubric-update-titles')) return;

    var btn = document.createElement('a');
    btn.id = 'rubric-update-titles';
    btn.href = '#';
    btn.className = 'Button button-sidebar-wide';
    btn.innerHTML = '<i class="icon-annotate" aria-hidden="true"></i> Update Titles';

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      runUpdate();
    });

    container.appendChild(btn);
  }

  // --- CSRF TOKEN ---
  function getCsrfToken() {
    var csrfRegex = /^_csrf_token=(.*)$/;
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      var match = csrfRegex.exec(cookie);
      if (match) return decodeURIComponent(match[1]);
    }
    return null;
  }

  // --- FETCH RUBRIC JSON ---
  function fetchRubric() {
    console.log('[RubricUpdater] Fetching rubric…');

    return fetch('/api/v1/courses/' + courseId + '/rubrics/' + rubricId, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('Failed to fetch rubric: ' + res.status);
      return res.json();
    });
  }

  // --- EXTRACT CRITERIA (assignment-aware) ---
  function extractCriteria(rubric) {
    if (Array.isArray(rubric.rubric)) return rubric.rubric;
    if (Array.isArray(rubric.data)) return rubric.data;
    if (rubric.rubric && Array.isArray(rubric.rubric.criteria)) return rubric.rubric.criteria;

    throw new Error('Rubric structure has no valid criteria array');
  }

  // --- UPDATE TITLES ---
  function updateRubricTitles(rubric) {
    console.log('[RubricUpdater] Updating rating titles…');

    var criteria = extractCriteria(rubric);

    criteria.forEach(function (criterion) {
      if (criterion.learning_outcome_id) return;
      if (!Array.isArray(criterion.ratings)) return;

      for (var i = 0; i < criterion.ratings.length && i < ratingTitles.length; i++) {
        criterion.ratings[i].description = ratingTitles[i];
      }
    });

    return rubric;
  }

  // --- TRANSFORM CRITERIA INTO INDEXED HASH ---
  function transformCriteriaToHash(criteriaArray) {
    var criteriaHash = {};

    criteriaArray.forEach(function (criterion, cIdx) {
      var ratingsHash = {};

      if (Array.isArray(criterion.ratings)) {
        criterion.ratings.forEach(function (rating, rIdx) {
          var ratingId = rating.id;
          if (typeof ratingId === 'string' &&
              (ratingId.startsWith('blank') || ratingId === '')) {
            ratingId = null;
          }

          ratingsHash[String(rIdx)] = {
            id: ratingId,
            description: rating.description,
            long_description: rating.long_description || "",
            points: Number(rating.points)
          };
        });
      }

      var cleanCriterionId = criterion.id;
      if (typeof cleanCriterionId === 'string' && cleanCriterionId.includes('_')) {
        cleanCriterionId = cleanCriterionId.split('_')[1];
      }

      criteriaHash[String(cIdx)] = {
        id: cleanCriterionId || null,
        description: criterion.description || "",
        long_description: criterion.long_description || "",
        points: Number(criterion.points),
        criterion_use_range: !!criterion.criterion_use_range,
        ratings: ratingsHash
      };
    });

    return criteriaHash;
  }

  // --- SAVE RUBRIC ---
  function saveRubric(rubric) {
    console.log('[RubricUpdater] Saving rubric…');

    var token = getCsrfToken();
    if (!token) throw new Error('CSRF token not found.');

    var settings = rubric.rubric_settings || rubric;
    var rawCriteria = extractCriteria(rubric);
    var formattedCriteriaHash = transformCriteriaToHash(rawCriteria);

    var dynamicRubricId = settings.id || rubricId;

    var payload = {
      rubric: {
        title: settings.title,
        free_form_criterion_comments: !!settings.free_form_criterion_comments,
        skip_updating_points_possible: false,
        criteria: formattedCriteriaHash
      },
      rubric_association: {
        association_id: Number(courseId),
        association_type: "Course",
        purpose: "bookmark",
        use_for_grading: false,
        hide_score_total: false
      },
      title: settings.title,
      points_possible: Number(settings.points_possible),
      rubric_id: dynamicRubricId,
      rubric_association_id: ""
    };

    console.log('[RubricUpdater] PUT payload ready.');

    return fetch('/api/v1/courses/' + courseId + '/rubrics/' + dynamicRubricId, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': token
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('Failed to save rubric: ' + res.status);
      return res.json();
    });
  }

  // --- MAIN WORKFLOW ---
  function runUpdate() {
    var rubricTitle = document.querySelector('.rubric_title')?.innerText || 'Unknown rubric';

    if (!window.confirm(
      'Rubric: ' + rubricTitle +
      '\n\nUpdate all rating titles to:\n' +
      ratingTitles.join(' / ')
    )) return;

    fetchRubric()
      .then(updateRubricTitles)
      .then(saveRubric)
      .then(function () {
        console.log('[RubricUpdater] Update complete.');
        window.location.reload(true);
      })
      .catch(function (err) {
        console.error('[RubricUpdater] Error:', err);
        window.alert('Rubric update failed: ' + err.message);
      });
  }

  // --- INIT ---
  addUpdateButton();
})();

