/** Protect spreadsheet consumers from formula execution without altering stored data. */
const escapeCSV = (value) => {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))
    text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
};
module.exports = { escapeCSV };
