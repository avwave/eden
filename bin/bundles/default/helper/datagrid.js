/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// require dependencies
var co = require ('co');

/**
 * build datagrid helper class
 */
class datagrid {
    /**
     * construct datagrid helper
     */
    constructor () {
        // bind methods
        this.grid = this.grid.bind (this);
    }

    /**
     * default grid functionality for jquery bootgrid
     *
     * @param req
     * @param model
     * @param row
     * @param filter
     * @param type
     * @returns {Promise}
     */
    grid (req, model, row, filter, type) {
        return new Promise ((resolve, reject) => {
            // set default variables
            var response = {
                'current'  : (req.body.current ? parseInt (req.body.current) : 1),
                'rowCount' : (req.body.rowCount ? parseInt (req.body.rowCount) : 10),
                'rows'     : [],
                'total'    : 0
            };
            // set default where object
            var where = {};
            // set default order
            var order = {};
            // set default filter
            filter = (filter ? (Array.isArray (filter) ? filter : [filter]) : false);
            // set default type
            type = (type ? type : '$or');

            // run coroutine
            co (function * () {
                // check for search phrase
                if (req.body.searchPhrase && filter) {
                    where[type] = [];
                    for (var i = 0; i < filter.length; i++) {
                        // create push object
                        var push        = {};
                        push[filter[i]] = {
                            '$regex' : req.body.searchPhrase
                        };

                        // push into where
                        where[type].push (push)
                    }
                }

                // check for order
                if (req.body.sort) {
                    for (var key in req.body.sort) {
                        // set sort order
                        var dir = (req.body.sort[key] == 'asc' ? 1 : -1);
                        // add to order
                        order[key] = dir;
                    }
                }

                // set total in response
                var result     = model.where (where);
                response.total = yield result.count ();

                // set results
                var results = yield result.sort (order).limit (response.rowCount).skip (response.rowCount * (response.current - 1)).find ();

                // loop results
                for (var i = 0; i < results.length; i++) {
                    response.rows.push(row(results[i]));
                }

                // send response
                resolve(response);
            });
        });
    }
}

/**
 * export datagrid class
 *
 * @type {datagrid}
 */
module.exports = new datagrid ();