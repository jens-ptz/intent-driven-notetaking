// Copied from the acceptance-test-authoring JavaScript pack, then extended with
// the `api` and `web` profiles required by ADR-0007.
//
// Selection is by path rather than by tag: the fenced Gherkin in a spec.md holds
// only Given/When/Then steps, so there is nowhere to write a @web tag that the
// extractor would carry through.
const { extractAll } = require('./extract-gherkin.cjs');
const { effectivePaths } = require('./openspec-effective-paths.cjs');

extractAll();

const allPaths = effectivePaths();
const isWebPath = (p) => p.includes('/web-client/');

const common = {
  paths: allPaths,
  import: ['support/**/*.js', 'step-definitions/**/*.js'],
  format: ['progress-bar', ['html', 'reports/cucumber-report.html']],
};

const specs = {
  ...common,
  paths: ['.extracted/specs/**/*.feature'],
};

// Browser scenarios only.
const web = {
  ...common,
  paths: allPaths.filter(isWebPath),
  format: ['progress-bar', ['html', 'reports/cucumber-report-web.html']],
};

// Everything except browser scenarios - the fast loop while working on the API.
const api = {
  ...common,
  paths: allPaths.filter((p) => !isWebPath(p)),
  format: ['progress-bar', ['html', 'reports/cucumber-report-api.html']],
};

module.exports = { default: common, specs, web, api };
