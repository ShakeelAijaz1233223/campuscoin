const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { getNextOccurrence } = require('../src/utils/dates');

test('month ranges retain calendar boundaries in Karachi and western time zones', () => {
  for (const TZ of ['Asia/Karachi', 'America/Los_Angeles', 'UTC']) {
    const output = execFileSync(process.execPath, ['-e', "console.log(JSON.stringify(require('./src/utils/dates').getMonthRange(2026, 9)))"], {cwd:require('node:path').join(__dirname,'..'),env:{...process.env,TZ}});
    assert.deepEqual(JSON.parse(output), {startDate:'2026-09-01',endDate:'2026-09-30'}, TZ);
  }
});
test('monthly/yearly recurring dates clamp to the last valid calendar day', () => {
  assert.equal(getNextOccurrence('monthly','2026-01-31'),'2026-02-28');
  assert.equal(getNextOccurrence('monthly','2028-01-31'),'2028-02-29');
  assert.equal(getNextOccurrence('yearly','2028-02-29'),'2029-02-28');
});
