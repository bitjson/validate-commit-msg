'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var m = require('./index');

describe('validate-commit-msg.js', function() {
  var originalLog, originalError;
  var errors = [];
  var logs = [];

  var VALID = true;
  var INVALID = false;

  // modify project config for testing
  m.config.helpMessage = undefined;

  beforeEach(function() {
    errors.length = 0;
    logs.length = 0;
    originalLog = console.log;
    originalError = console.error;
    console.error = fakeError;
    console.log = fakeLog;

    sinon.spy(console, 'error');
    sinon.spy(console, 'log');

    function fakeError(msg) {
      errors.push(msg.replace(/\x1B\[\d+m/g, '')); // uncolor
    }

    function fakeLog(msg) {
      logs.push(msg.replace(/\x1B\[\d+m/g, '')); // uncolor
    }
  });

  describe('validateMessage', function() {

    it('should be valid', function() {
      expect(m.validateMessage('chore($controller): something')).to.equal(VALID);
      expect(m.validateMessage('chore(*): something')).to.equal(VALID);
      expect(m.validateMessage('chore(foo-bar): something')).to.equal(VALID);
      expect(m.validateMessage('chore(guide/location): something')).to.equal(VALID);
      expect(m.validateMessage('custom(baz): something')).to.equal(VALID);
      expect(m.validateMessage('docs($filter): something')).to.equal(VALID);
      expect(m.validateMessage('feat($location): something (another thing)')).to.equal(VALID);
      expect(m.validateMessage('fix($compile): something')).to.equal(VALID);
      expect(m.validateMessage('refactor($httpBackend): something')).to.equal(VALID);
      expect(m.validateMessage('revert(foo): something')).to.equal(VALID);
      expect(m.validateMessage('revert: feat($location): something')).to.equal(VALID);
      expect(m.validateMessage('style($http): something')).to.equal(VALID);
      expect(m.validateMessage('test($resource): something')).to.equal(VALID);

      expect(errors).to.deep.equal([]);
      expect(logs).to.deep.equal([]);
    });


    it('should validate 100 characters length', function() {
      var msg = 'fix($compile): something super mega extra giga tera long, maybe even longer and longer and longer... ';

      expect(m.validateMessage(msg)).to.equal(INVALID);
      expect(errors).to.deep.equal(['INVALID COMMIT MSG: is longer than 100 characters !']);
      expect(logs).to.deep.equal([msg]);
    });


    it('should work fine with a bigger body', function() {
      var message = [
        'chore(build): something',
        '', // BLANK_LINE
        'Something longer that is more descriptive',
        '', // BLANK LINE
        'Closes #14',
        'BREAKING CHANGE: Something is totally broken :-('
      ].join('\n');

      expect(m.validateMessage(message)).to.equal(VALID);
      expect(errors).to.deep.equal([]);
      expect(logs).to.deep.equal([]);
    });


    it('should validate "<type>(<scope>): <subject>" format', function() {
      var msg = 'not correct format';

      expect(m.validateMessage(msg)).to.equal(INVALID);
      expect(errors).to.deep.equal(['INVALID COMMIT MSG: does not match "<type>(<scope>): <subject>" !']);
      expect(logs).to.deep.equal([msg]);
    });

    it('should log the helpMessage on invalid commit messages', function() {
      var msg = 'invalid message';
      m.config.helpMessage = '\nPlease fix your commit message (and consider using http://npm.im/commitizen)\n';
      expect(m.validateMessage(msg)).to.equal(INVALID);
      expect(errors).to.deep.equal(['INVALID COMMIT MSG: does not match "<type>(<scope>): <subject>" !']);
      expect(logs).to.deep.equal([msg, m.config.helpMessage]);
      m.config.helpMessage = undefined;
    });


    it('should validate type', function() {
      var msg = 'weird($filter): something';

      expect(m.validateMessage(msg)).to.equal(INVALID);
      expect(errors).to.deep.equal(['INVALID COMMIT MSG: "weird" is not allowed type !']);
      expect(logs).to.deep.equal([msg]);
    });


    it('should allow empty scope', function() {
      expect(m.validateMessage('fix: blablabla')).to.equal(VALID);
      expect(errors).to.deep.equal([]);
      expect(logs).to.deep.equal([]);
    });


    it('should allow dot in scope', function() {
      expect(m.validateMessage('chore(mocks.$httpBackend): something')).to.equal(VALID);
      expect(errors).to.deep.equal([]);
      expect(logs).to.deep.equal([]);
    });


    it('should ignore msg prefixed with "WIP "', function() {
      expect(m.validateMessage('WIP stuff')).to.equal(VALID);
      expect(errors).to.deep.equal([]);
      expect(logs).to.not.deep.equal([]);
    });


    it('should handle undefined message"', function() {
      expect(m.validateMessage()).to.equal(INVALID);
    });


    it('should allow semver style commits', function() {
      expect(m.validateMessage('v1.0.0-alpha.1')).to.equal(VALID);
    });


    it('should allow fixup! and squash! commits', function() {
      expect(m.validateMessage('fixup! fix($compile): something')).to.equal(VALID);
      expect(m.validateMessage('squash! fix($compile): something super mega extra giga tera long, maybe even longer and longer and longer...')).to.equal(VALID);
    });
  });

  afterEach(function() {
    console.log = originalLog;
    console.error = originalError;
  });
});
