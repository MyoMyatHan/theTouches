// Theme toggle — mirrors darioamodei.com behavior:
// respects OS preference until the user toggles manually, then persists.

(function () {
  function setColorMode(isDark, savePreference) {
    document.documentElement.classList.toggle('u-mode-invert', isDark);
    var checkbox = document.getElementById('color-mode');
    if (checkbox) checkbox.checked = isDark;
    if (savePreference) localStorage.setItem('darkMode', isDark ? 'true' : 'false');
  }

  var savedMode = localStorage.getItem('darkMode');
  var usingOSPreference = false;
  var prefersDark;

  if (savedMode !== null) {
    prefersDark = savedMode === 'true';
  } else {
    usingOSPreference = true;
    prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  setColorMode(prefersDark, !usingOSPreference);

  window.addEventListener('DOMContentLoaded', function () {
    var checkbox = document.getElementById('color-mode');
    if (!checkbox) return;
    checkbox.checked = document.documentElement.classList.contains('u-mode-invert');
    checkbox.addEventListener('change', function () {
      usingOSPreference = false;
      setColorMode(this.checked, true);
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (usingOSPreference) setColorMode(e.matches, false);
  });
})();
