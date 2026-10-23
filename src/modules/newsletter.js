// E-book sign-up: sends the Webflow form to the newsletter Worker, which adds the subscriber to
// Campaign Monitor (see worker-newsletter/).
//
// Markup (the form wrapper, the element Webflow gives .w-form):
//   [data-module="newsletter"]      root; data-api = the Worker's /subscribe URL
//     form                          fields named name, email and Consent (Webflow's own checkbox)
//     .w-form-done / .w-form-fail   Webflow's success and error blocks, shown here instead of its own
//
// Webflow would post the form to its own form inbox, so the submit is taken over in the capture
// phase before Webflow sees it. A hidden "company" field is added as a honeypot for bots.
// Without JS the form behaves as Webflow built it.

const MESSAGES = {
  'invalid-email': 'That email address doesn’t look right. Please check it and try again.',
  'consent-required': 'Please tick the box to accept the Privacy Policy.',
};

export default function newsletter(root) {
  const form = root.querySelector('form');
  const done = root.querySelector('.w-form-done');
  const fail = root.querySelector('.w-form-fail');
  const api = root.dataset.api;
  if (!form || !api) return;

  const submit = form.querySelector('[type="submit"]');
  const idle = submit?.value;
  const failText = fail?.firstElementChild;
  const failDefault = failText?.textContent;

  const trap = document.createElement('input');
  trap.type = 'text';
  trap.name = 'company';
  trap.tabIndex = -1;
  trap.autocomplete = 'off';
  trap.setAttribute('aria-hidden', 'true');
  trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
  form.appendChild(trap);

  const show = (el) => el && (el.style.display = 'block');
  const hide = (el) => el && (el.style.display = 'none');

  form.addEventListener(
    'submit',
    async (e) => {
      e.preventDefault();
      e.stopImmediatePropagation(); // keep Webflow from also posting to its own form inbox

      hide(fail);
      if (submit) {
        submit.disabled = true;
        submit.value = submit.dataset.wait || idle;
      }

      try {
        const res = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.elements.name?.value || '',
            email: form.elements.email?.value || '',
            consent: Boolean(form.elements.Consent?.checked),
            company: trap.value,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'failed');

        hide(form);
        show(done);
        done?.focus();
      } catch (err) {
        if (failText) failText.textContent = MESSAGES[err.message] || failDefault;
        show(fail);
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.value = idle;
        }
      }
    },
    true
  );
}
