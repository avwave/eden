/**
 * Created by Awesome on 1/30/2016.
 */

import controller from '../../../../bin/bundles/core/controller';

class defaultController extends controller {
    constructor() {
        super();

        this.indexAction = this.indexAction.bind(this);
    }

    /**
     * index action
     * @param req
     * @param res
     *
     * @route {get} /
     */
    indexAction(req, res) {
        res.send('hello world');
    }
}

module.exports = defaultController;