// Optical centring for form controls: the one place the site handles it.
//
// Kit Rounded sits about 0.2-0.3em above the middle of its line box. Text elsewhere is fixed
// in CSS (text-box trim on .text_optical / .text_trim, see the code_css embed), but Chrome
// ignores text-box on <input>/<textarea>, so form controls are shifted here instead. The
// script reads each control's real padding, so a new field needs no class, variable or rule.
//
//   text fields        typed text and placeholder move down 0.22em (inputs, textareas and selects)
//   submit / buttons   label moves down 0.315em
//   checkbox labels    label text moves down 0.27em
//
// A field with room in its bottom padding trades padding top for bottom (its height never
// changes). A field with no bottom padding (e.g. an input inside a styled wrapper) gets the
// padding-top added twice over, which the wrapper's centring halves to the same visual shift.

const FIELD_SHIFT = 0.22;
const BUTTON_SHIFT = 0.315;
const LABEL_SHIFT = 0.27;

const FIELDS =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="file"]):not([type="range"]), textarea, select';
const LABELS = '.w-checkbox .w-form-label, .w-radio .w-form-label';

function shiftField(el) {
  // Read the author's padding, not one we set on an earlier pass
  el.style.removeProperty('padding-top');
  el.style.removeProperty('padding-bottom');

  const cs = getComputedStyle(el);
  const isButton = el.type === 'submit' || el.type === 'button';
  const shift = (isButton ? BUTTON_SHIFT : FIELD_SHIFT) * parseFloat(cs.fontSize);
  const pt = parseFloat(cs.paddingTop);
  const pb = parseFloat(cs.paddingBottom);

  if (pb >= shift) {
    el.style.paddingTop = `${pt + shift}px`;
    el.style.paddingBottom = `${pb - shift}px`;
  } else {
    el.style.paddingTop = `${pt + shift * 2}px`;
  }
}

export default function opticalFields() {
  const apply = () => {
    document.querySelectorAll(FIELDS).forEach(shiftField);
    document.querySelectorAll(LABELS).forEach((label) => {
      label.style.position = 'relative';
      label.style.top = `${LABEL_SHIFT}em`;
    });
  };

  apply();

  // The root font size is fluid, so padding in px has to follow it
  let frame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(apply);
  });
}
