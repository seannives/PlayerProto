/*global require, define, test, expect, strictEqual, location */

if (typeof require === 'function' && require.config) {
    require.config({
        baseUrl: '../lib',
        paths: {
            //Path relative to baseUrl
            'interactives': '../interactives'
        },
        shim: {
            'underscore': {
                exports: '_'
            }
        }
    });

    //Override if in "dist" mode
    if (location.href.indexOf('-dist') !== -1) {
        //Set location of interactives to the dist location
        require.config({
            paths: {
                'interactives': '../dist/interactives'
            }
        });
    }
}

(function (root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['interactives', 'jquery'], factory);
    } else {
        // Browser globals
        factory(root.interactives, root.jQuery);
    }
}(this, function (interactives, $) {
    'use strict';

    /*
    test('version test', function () {
        expect(1);
        strictEqual(interactives.version,
            '0.0.1, jQuery version is: ' + $.fn.jquery,
            'Version concatenated');
    });

    test('conversion test', function () {
        expect(1);
        strictEqual(interactives.convert('Harry & Sally'),
            'Harry &amp; Sally',
            'Ampersand converted');
    });*/
    test('init test', function () {
        expect(1);
        strictEqual('1','1','base test');
    });
}));
