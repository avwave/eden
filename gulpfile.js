/**
 * Created by Awesome on 1/30/2016.
 */

    // use strict
'use strict';

// import dependencies
var glob       = require ('glob');
var rename     = require ('gulp-rename');
var sass       = require ('gulp-sass');
var through    = require ('through2');
var path       = require ('path');
var fs         = require ('fs');
var server     = require ('gulp-express');
var sourcemaps = require ('gulp-sourcemaps');
var browserify = require ('browserify');
var babelify   = require ('babelify');
var source     = require ('vinyl-source-stream');
var concat     = require ('gulp-concat');
var riot       = require ('gulp-riot');
var insert     = require ('gulp-insert');
var streamify  = require ('gulp-streamify');
var uglify     = require ('gulp-uglify');

// import local dependencies
var routePipe = require ('./bin/util/gulp.routing');
var menuPipe  = require ('./bin/util/gulp.menus');

/**
 * build gulp builder class
 */
class gulpBuilder {
    /**
     * construct gulp builder class
     */
    constructor () {
        // bind variables
        this.gulp = require ('gulp');

        // bind methods
        this._watch = [];
        this._tasks = {
            'sass' : [
                'node_modules/bootstrap/scss/bootstrap-flex.scss',
                './bin/bundles/*/resources/scss/bootstrap.scss',
                './app/bundles/*/resources/scss/bootstrap.scss'
            ],
            'daemon' : [
                './bin/bundles/**/*Daemon.js',
                './app/bundles/**/*Daemon.js'
            ],
            'route' : [
                './bin/bundles/**/*Controller.js',
                './app/bundles/**/*Controller.js'
            ],
            'menu' : [
                './bin/bundles/**/*Controller.js',
                './app/bundles/**/*Controller.js'
            ],
            'view' : [
                './bin/bundles/*/view/**/*.hbs',
                './app/bundles/*/view/**/*.hbs'
            ],
            'tag' : [
                './bin/bundles/*/view/**/*.tag',
                './app/bundles/*/view/**/*.tag'
            ],
            'js' : [
                './bin/bundles/*/resources/js/bootstrap.js',
                './app/bundles/*/resources/js/bootstrap.js'
            ]
        };

        // set keys array
        var that  = this;
        var keys  = Object.keys(this._tasks);
        var watch = [];

        // bind and add gulp task methods
        for (var i = 0; i < keys.length; i ++) {
            // bind method
            this[keys[i]] = this[keys[i]].bind (this);
            // setup task
            this.gulp.task (keys[i], this[keys[i]]);
            // setup watch task
            this.gulp.task (keys[i] + ':watch', () => {
                that.gulp.watch (that._tasks[keys[i]], [keys[i]]);
            });
            // add watch task to array
            watch.push(keys[i] + ':watch');
        }

        this.gulp.task('install', keys);
        this.gulp.task('watch', watch);
        this.gulp.task('dev', () => {
            server.run ([
                './app.js'
            ]);

            for (var i = 0; i < keys.length; i++) {
                that.gulp.watch (that._tasks[keys[i]], [keys[i], (event) => {
                    // check for server
                    server.notify (event);
                }]);
            }
        });
        this.gulp.task('default', ['dev']);
    }

    /**
     * sass task
     */
    sass () {
        // set variables
        var that = this;
        var all  = '';

        // grab gulp source for sass
        this.gulp.src (
            this._tasks['sass']
        ).pipe (through.obj ((chunk, enc, cb) => {
                // add @import to all
                all += '@import ".' + chunk.path.replace (__dirname, '').split (path.delimiter).join ('/') + '"; ';

                // run through callback
                cb (null, chunk);
            })).on ('end', () => {
                // write temp sass file
                fs.writeFile ('./tmp.scss', all, (err) => {
                    if (err) {
                        console.log (err);
                        return;
                    }

                    // pipe temp sass file for sass function
                    that.gulp.src ('./tmp.scss')
                        .pipe (sourcemaps.init ())
                        .pipe (sass ({
                            outputStyle : 'compressed'
                        })).pipe (rename ('app.min.css'))
                        .pipe (sourcemaps.write ('./'))
                        .pipe (gulp.dest ('./www/assets/css'))
                        .on ('end', () => {
                            fs.unlinkSync ('./tmp.scss');
                        });
                });
            });
    }

    /**
     * daemon task
     */
    daemon () {
        // grab daemon controllers
        var daemons = [];
        for (var i = 0; i < this._tasks['daemon'].length; i++) {
            daemons = daemons.concat(glob.sync (this._tasks['daemon'][i]));
        }

        // loop daemons
        for (var key in daemons) {
            daemons[key] = daemons[key].replace ('./', '/');
        }

        // write daemons cache file
        fs.writeFile ('./cache/daemons.json', JSON.stringify (daemons), function (err) {
            if (err) {
                return console.log (err);
            }
        });
    }

    /**
     * route task
     */
    route() {
        // set variables
        var that = this;
        var all  = {};

        // get all routes
        this.gulp.src (
            this._tasks['route']
        )
            .pipe (through.obj (routePipe))
            .on ('data', (data) => {
                that._merge(all, data.routes);
            }).on ('end', function () {
                fs.writeFile ('./cache/routes.json', JSON.stringify (all), function (err) {
                    if (err) {
                        return console.log (err);
                    }
                });
            });
    }

    /**
     * menu task
     */
    menu() {
        // set variables
        var that = this;
        var all  = {};

        // get all menus
        this.gulp.src (
            this._tasks['menu']
        )
            .pipe (through.obj (menuPipe))
            .on ('data', function (data) {
                that._merge (all, data.menus);
            }).on ('end', function () {
                fs.writeFile ('./cache/menus.json', JSON.stringify (all), function (err) {
                    if (err) {
                        return console.log (err);
                    }
                });
            });
    }

    /**
     * view task
     */
    view() {
        // move views into single folder
        // @todo bundle prioroty
        this.gulp.src (
            this._tasks['view']
        )
            .pipe (rename (function (filePath) {
                var amended = filePath.dirname.split (path.sep);
                amended.shift ();
                amended.shift ();
                filePath.dirname = amended.join (path.sep);
            }))
            .pipe (this.gulp.dest ('cache/view'));
    }

    /**
     * tag task
     */
    tag() {
        // move tags into javascript compiled file (riotjs)
        this.gulp.src (
            this._tasks['tag']
        )
            .pipe (rename (function (filePath) {
                var amended      = filePath.dirname.split (path.sep);
                amended.shift ();
                amended.shift ();
                amended.shift ();
                filePath.dirname = amended.join (path.sep);
            }))
            .pipe (riot ({
                compact : true
            }))
            .pipe (concat ('tags.min.js'))
            .pipe (insert.prepend ('var riot = require(\'riot\');'))
            .pipe (gulp.dest ('./cache/tag'));
    }

    /**
     * javascript task
     */
    js() {
        // create javascript array
        var js = [];
        for (var i = 0; i < this._tasks['js'].length; i++) {
            js = js.concat(glob.sync (this._tasks['js'][i]));
        }

        // browserfiy javascript
        browserify ({
            entries : js
        })
            .transform (babelify)
            .bundle ()
            .pipe (source ('app.min.js'))
            .pipe (insert.prepend (fs.readFileSync ('./node_modules/bootstrap/dist/js/bootstrap.js')))
            .pipe (insert.prepend (fs.readFileSync ('./node_modules/jquery/dist/jquery.min.js')))
            .pipe (streamify (uglify ()))
            .pipe (this.gulp.dest ('./www/assets/js'));

    }

    /**
     * merges two objects
     *
     * @param obj1
     * @param obj2
     * @returns {*}
     * @private
     */
    _merge(obj1, obj2) {
        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor == Object) {
                    obj1[p] = this._merge (obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];
            }
        }

        return obj1;
    }
}

/**
 * export gulp builder class
 *
 * @type {gulpBuilder}
 */
module.exports = new gulpBuilder ();