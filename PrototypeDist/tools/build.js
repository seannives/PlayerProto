{
    "baseUrl": "../lib",
    "paths": {
        "interactives": "../interactives"
    },
    "include": ["../tools/almond", "interactives"],
    "exclude": ["jquery", "underscore", "d3"],
    "out": "../dist/interactives.js",
    "wrap": {
        "startFile": "wrap.start",
        "endFile": "wrap.end"
    }
}
