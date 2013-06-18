{
    "baseUrl": "../lib",
    "paths": {
        "interactives": "../interactives"
    },
    "include": ["../tools/almond", "interactives"],
    "exclude": ["jquery", "underscore"],
    "out": "../dist/interactives.js",
    "wrap": {
        "startFile": "wrap.start",
        "endFile": "wrap.end"
    }
}
