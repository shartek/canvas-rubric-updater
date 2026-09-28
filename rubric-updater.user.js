// ==UserScript==
// @name         Rubric Updater
// @namespace    https://github.com/shartek/canvas-rubric-updater
// @description  Update non-outcome rubric rating titles to Expected / Acceptable / Developing / Beginning
// @match        https://uwoms.instructure.com/courses/*/rubrics/*
// @match        https://earlyedu.instructure.com/courses/*/rubrics/*
// @version      1
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // --- CONFIGURABLE TITLES ---
  // You can change these later if the wording ever changes.
  var ratingTitles = ['Expected', 'Acceptable', 'Developing', 'Beginning'];

  // --- ONLY RUN ON RUBRIC PAGES ---
  var path = window.location.pathname;
  // Expect: /courses/:course_id/rubrics/:rubric_id
  var parts = path.split('/').filter(Boolean);
  if (parts.length < 4 || parts[0] !== 'courses' || parts[2] !== 'rubrics') {
    return;
  }
  var courseId = parts[1];
  var rubricId = parts[3];

  // --- ADD BUTTON UNDER EDIT / DELETE ---
  function addUpdateButton() {
    var container = document.getElementById('rubric-action-buttons');
    if (!container) return;

    // Avoid duplicate button
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

  // --- CSRF TOKEN (same pattern as James’ importer) ---
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

  // --- UPDATE TITLES IN RUBRIC OBJECT ---
  function updateRubricTitles(rubric) {
    if (!rubric || !Array.isArray(rubric.criteria)) {
      throw new Error('Rubric has no criteria array.');
    }

    rubric.criteria.forEach(function (criterion) {
      // Skip outcome-linked criteria
      if (criterion.learning_outcome_id) return;
      if (!Array.isArray(criterion.ratings)) return;

      // Replace rating descriptions with our standard titles
      for (var i = 0; i < criterion.ratings.length && i < ratingTitles.length; i++) {
        criterion.ratings[i].description = ratingTitles[i];
      }
    });

    return rubric;
  }

  // --- SAVE UPDATED RUBRIC BACK TO CANVAS ---
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
    // Simple confirm so you know you’re touching this rubric
    if (!window.confirm('Update all non-outcome rating titles to: ' +
      ratingTitles.join(' / ') + ' ?')) {
      return;
    }

    fetchRubric()
      .then(updateRubricTitles)
      .then(saveRubric)
      .then(function () {
        // Reload so you can immediately verify the change
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
