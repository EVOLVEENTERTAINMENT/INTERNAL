#!/usr/bin/env node
// The gate for the CI tour: reads tour.json and fails when the tour saw a
// console error, a tab that did not open, fewer than the 11 tabs, or no
// BUILD in the page. Usage: node test/check/tour-gate.js <tour.json>
'use strict';
const fs = require('fs');
const file = process.argv[2] || 'tour.json';
let j;
try { j = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.log('tour FAILED: could not read ' + file + ': ' + e.message); process.exit(1); }
const tabs = Array.isArray(j.tabs) ? j.tabs : [], errors = Array.isArray(j.errors) ? j.errors : [];
const wrong = tabs.filter(t => t.current !== t.m).map(t => t.m);
const problems = [];
if (!j.info || !j.info.build) problems.push('no BUILD in the page');
if (tabs.length < 11) problems.push('only ' + tabs.length + ' tabs seen');
if (wrong.length) problems.push('tabs that did not open: ' + wrong.join(', '));
if (errors.length) problems.push(errors.length + ' console errors: ' + errors.slice(0, 5).join(' | '));
if (problems.length) { console.log('tour FAILED: ' + problems.join('; ')); process.exit(1); }
console.log('tour ok: ' + tabs.length + ' tabs opened, build ' + j.info.build + ', no console errors');
