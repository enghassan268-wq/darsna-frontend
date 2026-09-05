// App-shell License Gate (Roadmap Phase 6b/6c).
//
// This is called ONCE, before the platform renders — never from inside
// checkpoint-engine.js or student-development.js (CLAUDE.md Absolute
// Rule 4/5: licensing is a separate concern from the Educational Engine).
//
// Today this talks to the local dev server (backend/server.js). Phase 6d
// swaps LICENSE_API_BASE for a real deployed backend URL — nothing else
// in this file, or in the engine it gates, needs to change.

(function () {
  "use strict";

  var LICENSE_API_BASE = window.DARSNA_LICENSE_API_BASE || "http://localhost:4500";
  var SCHOOL_ID_KEY = "darsna_school_id";
  var DEVICE_TOKEN_KEY = "darsna_device_token";

  // Subscriptions are per (schoolId, Subject) and fully isolated — an active
  // English subscription must never unlock Math. This artifact IS the English
  // platform, so the Subject is a constant here, not a runtime choice. When a
  // second Subject's copy of the platform exists, this one line is the only
  // thing that changes in this file. See COMMERCIAL_PLATFORM.md Section 3 and
  // Phase 6g.
  var DARSNA_SUBJECT = "english";

  function getSchoolId() {
    try { return localStorage.getItem(SCHOOL_ID_KEY); } catch (e) { return null; }
  }
  function setSchoolId(id) {
    try { localStorage.setItem(SCHOOL_ID_KEY, id); } catch (e) {}
  }

  // Phase 6i (device binding): a random, opaque, per-browser token, created
  // once and kept for as long as this browser's storage survives. Not tied
  // to any real hardware/browser fingerprint on purpose — it only needs to
  // be a value one browser has and no other browser can guess or already
  // have, so the server can tell "the same device that redeemed this" apart
  // from "a different device typing the same schoolId". See
  // docs/decisions/device-binding.md for what this does and does not
  // protect against.
  function getDeviceToken() {
    try {
      var t = localStorage.getItem(DEVICE_TOKEN_KEY);
      if (!t) {
        t = (window.crypto && window.crypto.randomUUID)
          ? window.crypto.randomUUID()
          : ('dt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
        localStorage.setItem(DEVICE_TOKEN_KEY, t);
      }
      return t;
    } catch (e) {
      // No localStorage available at all (rare, e.g. storage fully blocked):
      // a fresh value every call means this device can never pass a match
      // check on a later visit, which is the safe failure direction — it
      // fails CLOSED, same principle as an unreachable License Service.
      return 'dt-nostorage-' + Math.random().toString(36).slice(2);
    }
  }

  /**
   * Checks the current school's subscription status against the License
   * Service. Resolves to { active, subscription, reason } — same shape
   * the LicenseService interface promises (see
   * backend/license/license-service.interface.js), so this file never
   * reimplements expiry/grace-period logic itself.
   */
  function checkLicense() {
    var schoolId = getSchoolId();
    if (!schoolId) {
      return Promise.resolve({ active: false, subscription: null, reason: "no_school_id" });
    }
    return fetch(LICENSE_API_BASE + "/api/license/status?schoolId=" + encodeURIComponent(schoolId)
                 + "&subject=" + encodeURIComponent(DARSNA_SUBJECT)
                 + "&deviceToken=" + encodeURIComponent(getDeviceToken()))
      .then(function (r) { return r.json(); })
      .catch(function () {
        // Network/backend unreachable: fail CLOSED for a real deployment,
        // but this is documented explicitly because it's a real design
        // choice, not an accident — see COMMERCIAL_PLATFORM.md Decision
        // Points if Hassan wants a short offline grace instead.
        return { active: false, subscription: null, reason: "license_service_unreachable" };
      });
  }

  function redeemKey(code, schoolId) {
    return fetch(LICENSE_API_BASE + "/api/license/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `subject` is sent for symmetry and forward-compatibility. The server
      // deliberately ignores it and derives the Subject from the redeemed
      // key's own plan instead, so a client cannot activate a Subject it did
      // not pay for by claiming a different one here.
      body: JSON.stringify({ code: code, schoolId: schoolId, subject: DARSNA_SUBJECT, deviceToken: getDeviceToken() })
    }).then(function (r) {
      return r.json().then(function (body) {
        if (!r.ok) throw new Error(body.error || "تعذّر تفعيل المفتاح");
        setSchoolId(schoolId);
        return body.subscription;
      });
    });
  }

  window.DarsnaLicenseGate = { checkLicense: checkLicense, redeemKey: redeemKey, getSchoolId: getSchoolId };
})();
