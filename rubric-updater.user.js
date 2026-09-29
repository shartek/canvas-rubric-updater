// ==UserScript==
// @name         Rubric Updater
// @namespace    https://github.com/shartek/canvas-rubric-updater
// @author       shartek
// @description  Update non-outcome rubric rating titles to Expected / Acceptable / Developing / Beginning
// @match        https://uwoms.instructure.com/courses/*/rubrics/*
// @match        https://earlyedu.instructure.com/courses/*/rubrics/*
// @version      1.1.0
// @updateURL    https://raw.githubusercontent.com/shartek/canvas-rubric-updater/main/rubric-updater.user.js
// @downloadURL  https://raw.githubusercontent.com/shartek/canvas-rubric-updater/main/rubric-updater.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // --- CONFIGURABLE TITLES ---
  var ratingTitles = ['Expected', 'Acceptable', 'Developing', 'Beginning'];

  // --- ONLY RUN ON RUBRIC PAGES ---
  var path = window.location.pathname;
  var parts = path.split('/').filter(Boolean);
  if (parts.length < 4 || parts[0] !== 'courses' || parts[2] !== 'rubrics') {
    return;
  }
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
    btn.innerHTML = '<i class="icon-edit" aria-hidden="true"></i> Update Titles';

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
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    return null;
  }

  // --- FETCH RUBRIC JSON ---
  function fetchRubric() {
    return fetch('/api/v1/courses/' + courseId + '/rubrics/' + rubricId, {
      method: 'GET',
      credentials: 'same-origin'
    }).then(function (res) {
      if (!res.ok) {
        throw new Error('Failed to fetch rubric: ' + res.status);
      }
      return res.json();
    });
  }

  // --- DETECT RUBRIC FORMAT ---
  function extractCriteria(rubric) {
    // Format A: classic rubric
    if (Array.isArray(rubric.criteria)) {
      return rubric.criteria;
    }

    // Format B: association-style rubric
    if (rubric.rubric && Array.isArray(rubric.rubric.criteria)) {
      return rubric.rubric.criteria;
    }

    throw new Error('Rubric has no criteria array');
  }

  // --- UPDATE TITLES ---
  function updateRubricTitles(rubric) {
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

  // --- SAVE RUBRIC ---
  function saveRubric(rubric) {
    var token = getCsrfToken();
    if (!token) {
      throw new Error('CSRF token not found.');
    }

    return fetch('/api/v1/courses/' + courseId + '/rubrics/' + rubricId, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      body: JSON.stringify(rubric)
    }).then(function (res) {
      if (!res.ok) {
        throw new Error('Failed to save rubric: ' + res.status);
      }
      return res.json();
    });
  }

  // --- MAIN WORKFLOW ---
  function runUpdate() {
    if (!window.confirm('Update all non-outcome rating titles to: ' +
      ratingTitles.join(' / ') + ' ?')) {
      return;
    }

    fetchRubric()
      .then(updateRubricTitles)
      .then(saveRubric)
      .then(function () {
        window.location.reload(true);
      })
      .catch(function (err) {
        console.error(err);
        window.alert('Rubric update failed: ' + err.message);
      });
  }

  // --- INIT ---
  addUpdateButton();
})();
