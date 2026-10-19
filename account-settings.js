(function () {
      'use strict';
      const STYLE_ID = 'account-settings-dialog-style';
      let activeOverlay = null;
      let scanQueued = false;
      const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      const key = (value) => clean(value).toLowerCase();
      const textOf = (node) => clean(node && node.textContent);

      function getCountryList() {
        try { if (typeof JW_COUNTRIES !== 'undefined' && Array.isArray(JW_COUNTRIES)) return JW_COUNTRIES; } catch (_) {}
        return Array.isArray(window.JW_COUNTRIES) ? window.JW_COUNTRIES : [];
      }

      function addStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent =
          '.as-overlay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.58);box-sizing:border-box}\n' +
          '.as-dialog{width:min(100%,440px);max-height:min(88vh,720px);overflow:auto;padding:22px;border-radius:18px;background:var(--card-bg,#fff);color:var(--text,#171717);border:1px solid rgba(127,127,127,.24);box-shadow:0 20px 70px rgba(0,0,0,.3);font:inherit;box-sizing:border-box}\n' +
          '.as-dialog *{box-sizing:border-box}.as-title{font-size:20px;font-weight:700;margin:0 42px 8px 0}.as-description{font-size:14px;line-height:1.5;opacity:.76;margin:0 0 18px}\n' +
          '.as-close{position:absolute;right:16px;top:14px;border:0;background:transparent;color:inherit;font-size:26px;line-height:1;cursor:pointer;padding:6px}.as-dialog-head{position:relative}\n' +
          '.as-field-label{display:block;font-size:13px;font-weight:600;margin:0 0 7px}.as-input{width:100%;min-height:46px;border:1px solid rgba(127,127,127,.45);border-radius:10px;padding:11px 12px;background:transparent;color:inherit;font:inherit;outline:none}.as-input:focus{border-color:#e1306c;box-shadow:0 0 0 3px rgba(225,48,108,.16)}\n' +
          '.as-actions{display:flex;gap:10px;margin-top:16px}.as-button{min-height:44px;border-radius:10px;padding:10px 15px;border:1px solid rgba(127,127,127,.35);background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer}.as-button-primary{flex:1;background:#e1306c;border-color:#e1306c;color:#fff}.as-button:disabled{opacity:.55;cursor:wait}\n' +
          '.as-message{min-height:20px;margin:12px 0 0;font-size:13px;line-height:1.4}.as-error{color:#c62828}.as-success{color:#18794e}.as-country-list{margin-top:10px;max-height:38vh;overflow:auto;border:1px solid rgba(127,127,127,.25);border-radius:10px}.as-country-option{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid rgba(127,127,127,.12);padding:11px 12px;background:transparent;color:inherit;font:inherit;cursor:pointer}.as-country-option:last-child{border-bottom:0}.as-country-option:hover,.as-country-option:focus{background:rgba(225,48,108,.1);outline:none}.as-empty{padding:14px;font-size:13px;opacity:.7}\n' +
          '.as-setting-row{cursor:pointer!important}.as-setting-row:focus-visible{outline:2px solid #e1306c;outline-offset:3px;border-radius:8px}\n' +
          '@media(prefers-color-scheme:dark){.as-dialog{--card-bg:#191919;--text:#f5f5f5}.as-error{color:#ff8a80}.as-success{color:#81c784}}@media(max-width:480px){.as-dialog{padding:20px 16px;border-radius:16px}}';
        style.textContent += '.as-inline-action{display:inline-flex;align-items:center;margin-left:auto;padding:7px 10px;border-radius:999px;background:rgba(225,48,108,.1);color:#d81b60;font-size:12px;font-weight:700;white-space:nowrap;line-height:1.2}';
        document.head.appendChild(style);
      }

      function closeModal() {
        if (!activeOverlay) return;
        if (activeOverlay._asCleanup) activeOverlay._asCleanup();
        activeOverlay.remove();
        activeOverlay = null;
      }

      function showModal(title, description, content) {
        closeModal();
        addStyles();
        const overlay = document.createElement('div');
        overlay.className = 'as-overlay';
        overlay.innerHTML = '<section class="as-dialog" role="dialog" aria-modal="true" aria-labelledby="as-dialog-title"><div class="as-dialog-head"><h2 class="as-title" id="as-dialog-title"></h2><button class="as-close" type="button" aria-label="Close">×</button></div><p class="as-description"></p><div class="as-content"></div></section>';
        const dialog = overlay.querySelector('.as-dialog');
        overlay.querySelector('.as-title').textContent = title;
        overlay.querySelector('.as-description').textContent = description;
        overlay.querySelector('.as-content').appendChild(content);
        document.body.appendChild(overlay);
        activeOverlay = overlay;
        const close = () => closeModal();
        overlay.querySelector('.as-close').addEventListener('click', close);
        overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
        const onKey = (event) => { if (event.key === 'Escape' && activeOverlay === overlay) close(); };
        document.addEventListener('keydown', onKey);
        overlay._asCleanup = () => document.removeEventListener('keydown', onKey);
        window.setTimeout(() => { const focusable = dialog.querySelector('input,button'); if (focusable) focusable.focus(); }, 0);
        return { overlay, dialog, close };
      }

      async function requestApi(path, method, body) {
        const token = localStorage.getItem('token');
        if (typeof api === 'function') {
          const result = await api(path, method, body, token, 20000);
          if (result && typeof result.json === 'function') {
            const data = await result.json();
            if (!result.ok) throw new Error(data.detail || data.message || 'Request failed.');
            return data;
          }
          if (result && (result.ok === false || result.success === false)) throw new Error(result.detail || result.message || 'Request failed.');
          return result;
        }
        const response = await fetch('https://post-app-backend-bmge.onrender.com/api' + path, {
          method,
          headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
          body: body ? JSON.stringify(body) : undefined
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) throw new Error(data.detail || data.message || 'Request failed.');
        return data;
      }

      function errorText(error) { return error && error.message ? error.message : 'Could not save this information. Please try again.'; }

      function openPhoneDialog() {
        const form = document.createElement('form');
        form.noValidate = true;
        form.innerHTML = '<label class="as-field-label" for="as-phone">Mobile number</label><input class="as-input" id="as-phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+91 98765 43210" required><div style="font-size:12px;opacity:.7;margin-top:7px">Include the +country code. A 10-digit Indian number is prefixed with +91.</div><div class="as-otp-wrap" hidden style="margin-top:16px"><label class="as-field-label" for="as-otp">Verification code</label><input class="as-input" id="as-otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="Enter the code"></div><p class="as-message" aria-live="polite"></p><div class="as-actions"><button class="as-button as-button-primary" type="submit">Send verification code</button></div><button class="as-button as-use-another" type="button" hidden style="width:100%;margin-top:10px">Use another number</button>';
        showModal('Add mobile number', 'We’ll verify this number with a one-time code before adding it to your account.', form);
        const phoneInput = form.querySelector('#as-phone');
        const otpWrap = form.querySelector('.as-otp-wrap');
        const otpInput = form.querySelector('#as-otp');
        const message = form.querySelector('.as-message');
        const submit = form.querySelector('[type="submit"]');
        const another = form.querySelector('.as-use-another');
        let normalizedPhone = '';
        let step = 'phone';
        const setMessage = (text, type) => { message.textContent = text || ''; message.className = 'as-message' + (type ? ' as-' + type : ''); };
        const normalizePhone = (raw) => {
          let value = String(raw || '').trim().replace(/[()\s.-]/g, '');
          if (value.startsWith('00')) value = '+' + value.slice(2);
          if (value.startsWith('+')) value = '+' + value.slice(1).replace(/\D/g, '');
          else {
            const digits = value.replace(/\D/g, '');
            if (digits.length === 10) value = '+91' + digits;
            else if (digits.length >= 7 && digits.length <= 15) value = '+' + digits;
            else return '';
          }
          return /^\+[1-9]\d{6,14}$/.test(value) ? value : '';
        };
        another.addEventListener('click', () => {
          step = 'phone'; normalizedPhone = ''; phoneInput.disabled = false; otpWrap.hidden = true; another.hidden = true;
          submit.textContent = 'Send verification code'; setMessage('', ''); phoneInput.focus();
        });
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          submit.disabled = true; setMessage('', '');
          try {
            if (step === 'phone') {
              normalizedPhone = normalizePhone(phoneInput.value);
              if (!normalizedPhone) throw new Error('Enter a valid number with country code, for example +91 98765 43210.');
              const result = await requestApi('/auth/add-phone-init', 'POST', { phone: normalizedPhone });
              phoneInput.value = normalizedPhone; phoneInput.disabled = true; otpWrap.hidden = false; another.hidden = false;
              step = 'otp'; submit.textContent = 'Verify and add number';
              setMessage(result && result.demo_otp ? 'Verification code: ' + result.demo_otp : 'Code sent. Check your phone, then enter it above.', 'success');
              otpInput.focus();
            } else {
              const otp = otpInput.value.trim();
              if (!otp) throw new Error('Enter the verification code sent to your phone.');
              await requestApi('/auth/add-phone-verify', 'POST', { phone: normalizedPhone, otp });
              setMessage('Number verified. Refreshing account information…', 'success');
              window.setTimeout(() => window.location.reload(), 500);
            }
          } catch (error) { setMessage(errorText(error), 'error'); }
          finally { submit.disabled = false; }
        });
      }

      function openCountryDialog() {
        const countries = getCountryList().map((item) => ({ name: clean(item && (item.name || item.label)), code: clean(item && item.code) }))
          .filter((item) => item.name).sort((a, b) => a.name.localeCompare(b.name));
        const box = document.createElement('div');
        box.innerHTML = '<label class="as-field-label" for="as-country-search">Search country</label><input class="as-input" id="as-country-search" type="search" autocomplete="off" placeholder="Type a country name"><div class="as-country-list" role="listbox" aria-label="Countries"></div><p class="as-message" aria-live="polite"></p><div class="as-actions"><button class="as-button" type="button" data-clear>Clear country</button></div>';
        showModal('Choose your country', 'This saves to your account profile and is separate from the phone number’s calling code.', box);
        const search = box.querySelector('#as-country-search');
        const list = box.querySelector('.as-country-list');
        const message = box.querySelector('.as-message');
        const clearButton = box.querySelector('[data-clear]');
        let saving = false;
        const setBusy = (value) => { box.querySelectorAll('input,button').forEach((el) => { el.disabled = value; }); };
        const saveCountry = async (value) => {
          if (saving) return; saving = true; setBusy(true); message.textContent = 'Saving country…'; message.className = 'as-message';
          try {
            await requestApi('/profile', 'PATCH', { country: value });
            message.textContent = 'Country saved. Refreshing account information…'; message.className = 'as-message as-success';
            window.setTimeout(() => window.location.reload(), 500);
          } catch (error) { message.textContent = errorText(error); message.className = 'as-message as-error'; saving = false; setBusy(false); }
        };
        const render = () => {
          const query = key(search.value);
          const matches = countries.filter((item) => key(item.name).includes(query) || key(item.code).includes(query)).slice(0, 100);
          list.replaceChildren();
          if (!matches.length) { const empty = document.createElement('div'); empty.className = 'as-empty'; empty.textContent = countries.length ? 'No matching country.' : 'Country list is unavailable. Refresh the page and try again.'; list.appendChild(empty); return; }
          matches.forEach((item) => {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'as-country-option'; button.setAttribute('role', 'option');
            button.textContent = item.name; button.addEventListener('click', () => saveCountry(item.name)); list.appendChild(button);
          });
        };
        search.addEventListener('input', render);
        clearButton.addEventListener('click', () => saveCountry(''));
        render();
      }

      function labelNode(section, label) {
        const target = key(label);
        const nodes = Array.from(section.querySelectorAll('*')).filter((node) => key(node.textContent) === target);
        return nodes.find((node) => node.children.length === 0) || nodes[0] || null;
      }
      function getRow(node) { return node && node.parentElement && node.parentElement.parentElement ? node.parentElement.parentElement : null; }
      function valueText(node, label) {
        const content = node && node.parentElement;
        if (content) {
          const children = Array.from(content.children);
          const value = children.find((child) => key(child.textContent) !== key(label));
          if (value) return textOf(value);
        }
        const row = getRow(node);
        if (!row) return '';
        const full = textOf(row);
        return key(full).startsWith(key(label)) ? full.slice(label.length).trim() : full;
      }
      function bindRow(section, label, handler, onlyWhenEmpty) {
        const node = labelNode(section, label);
        const row = getRow(node);
        if (!row || row.dataset.asAccountBound === label.toLowerCase()) return;
        if (row.querySelector('a,button,input,select')) return;
        if (onlyWhenEmpty) {
          const value = key(valueText(node, label));
          if (value && value !== 'add' && value !== '—' && value !== '-' && value !== 'add phone number') return;
        }
        row.dataset.asAccountBound = label.toLowerCase();
        row.classList.add('as-setting-row'); row.setAttribute('role', 'button'); row.setAttribute('tabindex', '0');
        row.setAttribute('aria-haspopup', 'dialog'); row.setAttribute('aria-label', label + (label === 'Phone' ? ': add mobile number' : ': choose country'));
        const affordance = document.createElement('span');
        affordance.className = 'as-inline-action';
        affordance.setAttribute('aria-hidden', 'true');
        const currentValue = key(valueText(node, label));
        affordance.textContent = label === 'Phone' ? 'Add number ›' : (currentValue && currentValue !== '—' && currentValue !== '-' ? 'Edit country ›' : 'Choose country ›');
        row.appendChild(affordance);
        row.addEventListener('click', (event) => { if (event.target.closest('a,button,input,select')) return; handler(); });
        row.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handler(); } });
      }
      function scan() {
        scanQueued = false;
        if (!document.body || activeOverlay) return;
        const candidates = Array.from(document.querySelectorAll('h1,h2,h3,[role="heading"],div,span,p'))
          .filter((node) => key(node.textContent) === 'account information');
        for (const heading of candidates) {
          let section = heading;
          for (let i = 0; i < 12 && section; i++, section = section.parentElement) {
            if (labelNode(section, 'Phone') && labelNode(section, 'Country') && labelNode(section, 'Date of birth')) {
              bindRow(section, 'Phone', openPhoneDialog, true);
              bindRow(section, 'Country', openCountryDialog, false);
              return;
            }
          }
        }
      }
      function scheduleScan() { if (scanQueued) return; scanQueued = true; window.requestAnimationFrame(scan); }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleScan, { once: true }); else scheduleScan();
      if (document.body) new MutationObserver(scheduleScan).observe(document.body, { childList: true, subtree: true, characterData: true });
      else document.addEventListener('DOMContentLoaded', () => new MutationObserver(scheduleScan).observe(document.body, { childList: true, subtree: true, characterData: true }), { once: true });
    })();
    