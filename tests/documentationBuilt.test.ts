import * as assert from 'assert';
import { scanDocumentationBuilt } from '../src/documentationBuilt';

describe('scanDocumentationBuilt', () => {
  it('reports ready when a chunk contains Documentation built', () => {
    const result = scanDocumentationBuilt('', 'INFO    -  Documentation built in 1.23 seconds\n');
    assert.strictEqual(result.ready, true);
  });

  it('reports ready for a timestamp-prefixed docker logs line', () => {
    const result = scanDocumentationBuilt(
      '',
      '2026-09-07T12:00:00.000000000Z INFO    -  Documentation built in 4.50 seconds\n',
    );
    assert.strictEqual(result.ready, true);
  });

  it('reports ready when the marker is split across two chunks', () => {
    const first = scanDocumentationBuilt('', 'INFO    -  Documenta');
    assert.strictEqual(first.ready, false);
    const second = scanDocumentationBuilt(first.pending, 'tion built in 2.00 seconds\n');
    assert.strictEqual(second.ready, true);
  });

  it('is not ready for unrelated log text', () => {
    const result = scanDocumentationBuilt('', 'INFO    -  Serving on http://0.0.0.0:8000\n');
    assert.strictEqual(result.ready, false);
  });
});
