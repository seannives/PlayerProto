/* **************************************************************************
 * submitmanager-spec.js                                                    $
 * **********************************************************************//**
 *
 * @fileoverview SubmitManager unit tests
 *
 * Created on		June 04, 2013
 * @author			Seann
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

'use strict';


(function () {
    var expect = chai.expect;

    describe('SubmitManager', function () {
		var submitManager = new SubmitManager();
		it('should be an object', function () {
                expect(submitManager).to.be.an('object');
        	});
	});
});