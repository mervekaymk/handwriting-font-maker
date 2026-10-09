// A small retro-styled pop-up for confirmations and messages.
// Uses the built-in <dialog> element from index.html.
//
// Usage:
//   const ok = await showDialog({ title: 'RESET.EXE', message: 'Sure?', okLabel: 'Reset', cancelLabel: 'Cancel' });
//   await showDialog({ title: 'ERROR', message: 'Bad file.' });  // no cancelLabel = just an OK button

const dialog = document.getElementById('dialog');
const titleEl = document.getElementById('dialog-title');
const messageEl = document.getElementById('dialog-message');
const okButton = document.getElementById('dialog-ok');
const cancelButton = document.getElementById('dialog-cancel');

// Resolves to true if the user pressed OK, false for Cancel / Escape.
export function showDialog({ title, message, okLabel = 'OK', cancelLabel = null, danger = false }) {
  titleEl.textContent = title;
  messageEl.textContent = message;
  okButton.textContent = okLabel;
  okButton.classList.toggle('btn-danger-fill', danger);
  cancelButton.hidden = cancelLabel === null;
  if (cancelLabel !== null) cancelButton.textContent = cancelLabel;

  return new Promise((resolve) => {
    function finish(result) {
      okButton.removeEventListener('click', onOk);
      cancelButton.removeEventListener('click', onCancel);
      dialog.removeEventListener('cancel', onCancel);
      dialog.close();
      resolve(result);
    }
    function onOk() { finish(true); }
    function onCancel(event) {
      if (event) event.preventDefault();
      finish(false);
    }

    okButton.addEventListener('click', onOk);
    cancelButton.addEventListener('click', onCancel);
    dialog.addEventListener('cancel', onCancel);  // Escape key
    dialog.showModal();
    // Focus the safe choice for destructive actions.
    (cancelLabel !== null ? cancelButton : okButton).focus();
  });
}
