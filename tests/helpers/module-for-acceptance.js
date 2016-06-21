import { module } from 'qunit';
import startApp from '../helpers/start-app';
import destroyApp from '../helpers/destroy-app';
import { mockSetup, mockTeardown } from 'ember-data-factory-guy';

export default function(name, options = {}) {
  module(name, {
    beforeEach() {
      this.application = startApp();

      mockSetup();

      // $.mockjaxSettings.logging = true;
      // $.mockjaxSettings.logging = 4;

      if (options.beforeEach) {
        return options.beforeEach.apply(this, arguments);
      }
    },

    afterEach() {
      // destroyApp(this.application);

      let afterEach = options.afterEach && options.afterEach.apply(this, arguments);
      return Promise.resolve(afterEach)
        .then(() => destroyApp(this.application))
        .then(() => mockTeardown());
    }
  });
}
