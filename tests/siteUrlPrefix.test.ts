import * as assert from 'assert';
import {
  prefixSitePath,
  siteUrlPathPrefixFromYaml,
} from '../src/siteUrlPrefix';

describe('siteUrlPathPrefixFromYaml', () => {
  it('extracts the pathname from a quoted absolute site_url', () => {
    const yaml = [
      'site_name: Example',
      "site_url: 'http://git.example.com/somedocs/mkdocs/'",
      'use_directory_urls: false',
    ].join('\n');
    assert.strictEqual(siteUrlPathPrefixFromYaml(yaml), '/somedocs/mkdocs');
  });

  it('extracts the pathname from the fixture-style site_url', () => {
    const yaml = "site_url: 'http://git.example.com/someexample/mkdocs/'";
    assert.strictEqual(siteUrlPathPrefixFromYaml(yaml), '/someexample/mkdocs');
  });

  it('returns empty when site_url has no path or is blank', () => {
    assert.strictEqual(
      siteUrlPathPrefixFromYaml('site_url: http://example.com'),
      '',
    );
    assert.strictEqual(siteUrlPathPrefixFromYaml("site_url: ''"), '');
    assert.strictEqual(siteUrlPathPrefixFromYaml('site_name: Only'), '');
  });

  it('accepts a path-only site_url', () => {
    assert.strictEqual(
      siteUrlPathPrefixFromYaml('site_url: /docs/site/'),
      '/docs/site',
    );
  });
});

describe('prefixSitePath', () => {
  it('prefixes page candidates with the site_url path', () => {
    assert.strictEqual(
      prefixSitePath('/stands.html', '/somedocs/mkdocs'),
      '/somedocs/mkdocs/stands.html',
    );
    assert.strictEqual(
      prefixSitePath('/stands/', '/somedocs/mkdocs'),
      '/somedocs/mkdocs/stands/',
    );
  });

  it('prefixes the site root and index', () => {
    assert.strictEqual(prefixSitePath('/', '/somedocs/mkdocs'), '/somedocs/mkdocs/');
    assert.strictEqual(
      prefixSitePath('/index.html', '/somedocs/mkdocs'),
      '/somedocs/mkdocs/index.html',
    );
  });

  it('leaves paths unchanged when there is no prefix', () => {
    assert.strictEqual(prefixSitePath('/page.html', ''), '/page.html');
    assert.strictEqual(prefixSitePath('/', ''), '/');
  });
});
