
// require dependencies
const riot = require ('riot');

/**
 * create riot store
 */
class riotStore {
  /**
   * construct riot store
   */
  constructor () {
    // set observable
    riot.observable (this);

    // bind private variables
    this._hooks = {};

    // check window
    if (typeof window === 'undefined') return;

    // set variables
    for (var key in window.eden) {
      // set value
      this[key] = window.eden[key];
    }
  }

  /**
   * sets key values
   *
   * @param  {String} key
   * @param  {*} val
   *
   * @return {this}
   */
  set (key, val) {
    // set to this
    this[key] = val;

    // emit to this
    this.trigger (key, val);

    // return this
    return this;
  }

  /**
   * gets key values
   *
   * @param  {String} key
   *
   * @return {*}
   */
  get (key) {
    // return this
    return this[key];
  }


  //////////////////////////////////////////////////////////////////////////////
  //
  //  Hook Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * add post hook to act as pre
   *
   * @param {String} hook
   * @param {Function} fn
   */
  pre (hook, fn) {
    // check hook
    this.__hook (hook);

    // add to post
    this._hooks[hook].pre.push (fn);
  }

  /**
   * add post hook to act as pre
   *
   * @param {String} hook
   * @param {Function} fn
   */
  post (hook, fn) {
    // check hook
    this.__hook (hook);

    // add to post
    this._hooks[hook].post.push (fn);
  }


  /**
   * adds kareem hook
   *
   * @param {String} hook
   */
  hook (hook, ...args) {
    // set fn
    let fn = false;

    // get function
    if (args.length > 1 && args[args.length - 1] instanceof Function && typeof args[args.length -1] === 'function' && args[args.length - 1].call) fn = args.splice (-1)[0];

    // check hook
    this.__hook (hook);

    // exec pres
    for (var a = 0; a < this._hooks[hook].pre.length; a++) {
      // exec pre
      this._hooks[hook].pre[a] (...args);
    }

    // exec actual function
    if (fn) fn (...args);

    // exec post
    for (var b = 0; b < this._hooks[hook].post.length; b++) {
      // exec pre
      this._hooks[hook].post[b] (...args);
    }
  }

  /**
   * checks hook
   *
   * @param {String} hook
   *
   * @private
   */
  __hook (hook) {
    // check hook exists
    if (!this._hooks[hook]) this._hooks[hook] = {
      'pre'  : [],
      'post' : []
    };
  }
}

/**
 * export built riot store
 *
 * @type {riotStore}
 */
exports = module.exports = new riotStore ();
