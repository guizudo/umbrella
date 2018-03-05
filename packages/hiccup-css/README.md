# @thi.ng/hiccup-css

[![npm (scoped)](https://img.shields.io/npm/v/@thi.ng/hiccup-css.svg)](https://www.npmjs.com/package/@thi.ng/hiccup-css)

## About

Following a similar pattern as the
[@thi.ng/hiccup](https://github.com/thi-ng/umbrella/tree/master/packages/hiccup)
package, this library generates CSS from plain nested arrays / data structures,
functions, iterators.

## Features

- Uses JS arrays to define selector scopes
- Uses JS object to define selector properties
  - Multiple objects per scope are combined automatically
- Supports nested selectors and computes their cartesian products
- Configurable auto-prefixed properties & vendor prefixes (disabled by default)
- Automatically consumes embedded iterators
- Supports embeded functions, either:
  - to define entire selector branches/scopes
  - to produce single selector items
  - to produce property values
- Quoted functions to support CSS-as-JSON definitions
- Various @-rule function wrappers:
  - `@import`
  - `@keyframes`
  - `@media` (incl. nested media queries)
  - `@namespace`
  - `@supports`
- Attribute selector functions
- Unit formatting wrappers (no conversions yet)
- Customizable formatting (2 defaults for compact & pretty printing)

The overall approach of using S-expressions was inspired by these Clojure projects:

- [hiccup](https://github.com/weavejester/hiccup)
- [garden](https://github.com/noprompt/garden)

## Installation

```
yarn add @thi.ng/hiccup-css
```

## Usage examples

```typescript
import * as css from "@thi.ng/hiccup-css";
```

### Property formatting only

This feature is only intended for setting an element's `.style` attrib:

```typescript
css.css({
    position: "absolute",
    border: 0,
    // function is evaluated during serialization
    top: () => css.percent((Math.random() * 100) | 0),
    // the entire properties object is passed to functions
    left: (props) => css.px(props.border),
    // arrays are joined with `,`
    // nested arrays are joined w/ ` `
    font: [["72px", "ComicSans"], "sans-serif"]
});

// "position:absolute;border:0;top:23%;left:0px;font:72px ComicSans,sans-serif;"
```

### Basic selectors

```typescript
css.css(
    [
        ["html", "body", { margin: 0, padding: 0 }],
        ["div", { "max-width": css.rem(30)}],
        ["div.title", { color: "red" }]
    ],
    { format: css.PRETTY }
);
```

```css
html, body {
    margin: 0;
    padding: 0;
}

div {
    max-width: 30rem;
}

div.title {
    color: red;
}
```

### Property object merging & re-use

```typescript
// re-usable property snippets
const border = { border: "1px solid black" };
const red = { color: "red" };

css.css(
    [
        ["#foo", { background: "white" }, border, red],
        ["#bar", { background: "yellow", color: "black" }, border]
    ],
    { format: css.PRETTY }
);
```

```css
#foo {
    background: white;
    border: 1px solid black;
    color: red;
}

#bar {
    background: yellow;
    color: black;
    border: 1px solid black;
}
```

### Iterator support

```typescript
import * as tx from "@thi.ng/transducers";

// single rule generator
// e.g. `[".w25", { width: "25%" }]`
const prop = (id, key) => (x) => [id + x, {[key]: css.percent(x)}];

css.css(
    // define iterator to produce a number of width & height css classes
    // `juxt` is used to process given percentage values in parallel and produces a tuple
    // `mapcat` is used to dissolve the tuple and produce a flat stream of generated rules
    // REMEMBER: iterators are lazy and can only be consumed once (not a problem here)
    tx.iterator(
        tx.mapcat(tx.juxt(prop(".w", "width"), prop(".h", "height"))),
        tx.range(25, 101, 25)
    ),
    { format: css.PRETTY }
);
```

```css
.w25 {
    width: 25%;
}

.h25 {
    height: 25%;
}

.w50 {
    width: 50%;
}

.h50 {
    height: 50%;
}

.w75 {
    width: 75%;
}

.h75 {
    height: 75%;
}

.w100 {
    width: 100%;
}

.h100 {
    height: 100%;
}
```

### Nested selectors

Selector nesting can be easily done via array nesting. Each new nesting level
defines a child scope of the current selector. The actual CSS selectors are
computed using the cartesian product of any selectors in the current scope and
their previously defined parents:

```typescript
css.css(
    ["header", "footer", { "font-size": css.rem(1.25) },
        ["nav", { background: "#000", color: "#666" },
            ["ul", { "list-style": "none" }],
            ["li", { padding: css.rem(0.5) },
                [css.withAttrib("selected"), { color: "#0cf" }]]]],
    { format: css.PRETTY }
)
```

```css
header nav ul, footer nav ul {
    list-style: none;
}

header nav li[selected], footer nav li[selected] {
    color: #0cf;
}

header nav li, footer nav li {
    padding: 0.5rem;
}

header nav, footer nav {
    background: #000;
    color: #666;
}

header, footer {
    font-size: 1.25rem;
}
```

### Auto-prefixed properties

(Currently, only prefixed properties are supported. Auto-prefixing based on
property values is planned, but currently low priority.)

```typescript
css.css(
    ["div", {"border-radius": "4px"}],
    { autoprefix: ["border-radius"], format: css.PRETTY }
);
```

```css
div {
    -moz-border-radius: 4px;
    -ms-border-radius: 4px;
    -o-border-radius: 4px;
    -webkit-border-radius: 4px;
    border-radius: 4px;
}
```

### Media queries

Media queries (optionally nested) are supported via the `at_media()` and
`at_supports()` functions, both taking an object (or string) of conditionals
and a body which will be based to `css()`.

The key-value pairs of the conditional object are interpreted as follows and
ALWAYS combined using `and`:

| Key/Value pair | Result |
| --- | --- |
| `"min-width": "10rem"` | `(min-width: 10rem)` |
| `print: true` | `print` |
| `print: false` | `not print` |
| `print: "only"` | `only print` |

```typescript
css.css(
    css.at_media(
        { screen: true, "min-width": css.rem(10) },
        [
            [".col", { width: css.percent(50)}],
            [
                css.at_media(
                    { "min-width": "20rem" },
                    [".col", { padding: css.rem(1) }]
                )
            ]
        ]
    ),
    { format: css.PRETTY }
);
```

```css
@media screen and (min-width:10rem) {

    .col {
        width: 50%;
    }

    @media (min-width:20rem) {

        .col {
            padding: 1rem;
        }

    }

}
```

### Keyframes

```typescript
css.css(
    css.at_keyframes("fadein", { opacity: 0 }, { opacity: 1 }),
    { format: css.PRETTY }
);
```

```css
@keyframes fadein {

    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }

}
```

```typescript
css.css(
    css.at_keyframes(
        "fadein",
        {
            0: {
                color: "red"
            },
            50: {
                color: "green"
            },
            100: {
                color: "blue"
            }
        }
    ),
    { format: css.PRETTY }
);
```

```css
@keyframes fadein {

    0% {
        color: red;
    }

    50% {
        color: green;
    }

    100% {
        color: blue;
    }

}
```

### General function handling

**Functions are handled differently based on their position in the rule tree.**
Also see the section on [Quoted functions](#quoted-functions) below...

#### Functions in scope head position

If a function is given as arg to `css()` or is in the head position (first
element) of a rule scope, the function is considered a higher-order function
and the returned function is called with an empty result accumulator array and the
`CSSOpts` object passed to `css()`. This form is mainly used by the various
`at_*()` functions provided (e.g. `at_media()` example above).

```typescript
css.css(at_import("foo.css", "screen"));
// "@import url(foo.css) screen;"
```

The following example illustrates the head position placement, using the
`comment()` function to emit CSS comments.

**IMPORTANT:** any other items given in the same scope *after* the function
will be ignored.

```typescript
css.css([
    // comments are usually omitted with the default format (css.COMPACT)
    // pass `true` as 2nd arg to force inclusion
    [css.comment("generated, please don't edit", true)],
    // the following `div` rule is in its own scope, so okay
    ["div", { margin: 0 }]
]);
// "/* generated, don't edit */div{margin:0;}"

css.css([
    css.comment("generated, please don't edit", true),
    // here the `div` rule is part of the same scope and will be omitted
    ["div", { margin: 0 }]
])
// "/* generated, don't edit */"
```

#### Functions in other positions

If a function is located anywhere else in a rule scope array (2nd index or
later), it will be called without arguments and the return value used in its
place. Any returned functions will be eval'd recursively in the same manner.

### Quoted functions

One of this project's use cases is to support stylesheets defined as JSON.
Since functions cannot be used there, an optional mechanism to map strings to
functions is provided:

```
["function-name", ...args]
```

The quoted function name is looked up in a dictionary and if found, called with
all remaining elements in the same array. I.e. `["@import", "foo.css"]` will be
the same result as `at_import("foo.css")`.

```typescript
const styles = [
    ["@comment", " CSS from JSON"],
    ["@import", "print.css", "print"],
    ["@media",
        { "screen": true, "min-width": "10em" },
        ["div", { "font-size": "80%" }]
    ],
    ["@keyframes", "fadein", { "opacity": 0}, { "opacity": 1 }]
];

css.css(styles, { format: css.PRETTY, fns: css.QUOTED_FNS });

// btw. QUOTED_FNS is simply:
const QUOTED_FNS = {
    "@comment": comment,
    "@import": at_import,
    "@keyframes": at_keyframes,
    "@media": at_media,
    "@namespace": at_namespace,
    "@supports": at_supports,
}
```

```css
/*
    CSS from JSON
 */
@import url(print.css) print;
@media screen and (min-width:10em) {

    div {
        font-size: 80%;
    }

}

@keyframes fadein {

    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }

}
```

## Future plans

- [ ] Integration with @thi.ng/hiccup and @thi.ng/hdom
- [ ] Webpack loader (help wanted)

## Authors

- Karsten Schmidt

## License

&copy; 2016 - 2018 Karsten Schmidt // Apache Software License 2.0