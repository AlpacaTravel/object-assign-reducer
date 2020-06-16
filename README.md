# Object Assign Reducer

[![Build Status](https://travis-ci.com/AlpacaTravel/object-assign-reducer.svg?branch=master)](https://travis-ci.com/AlpacaTravel/object-assign-reducer)[![Coverage Status](https://coveralls.io/repos/github/AlpacaTravel/object-assign-reducer/badge.svg?branch=master)](https://coveralls.io/github/AlpacaTravel/object-assign-reducer?branch=master)![MIT](https://img.shields.io/npm/l/@alpaca-travel/object-assign-reducer)

A "hideous" utility to reduce an object assignment of properties into a new state.

This exists for a use case where you wish to apply an object property and automatically remove or update other properties based on a set of rules. In this case, we need to be able to target a number of conditions, such as describing edge-cases and compatible states to apply a criteria based on the resulting object.

A couple of special things:

- If the supplied rule matches, but then does not transition the object away from a match, it will throw an error
- Rules are applied continually until there is no further state transitions

```javascript
const { assign } = require("@alpaca-travel/object-assign-reducer");

// State before
const state = {
  category: "eat",
  subCategory: "restaurant",
  tags: ["tag1"],
};
// Changing state
const changeState = { category: "stay" };

// We want to eliminate the subcategory on change

// Traditional assign has not subtle rules
// Object.assign({}, state, apply);
// { category: stay, subCategory: restaurant }

// Describing rules as collections of match/perform
const rules = [
  {
    // Setup a matching rules to take the before value, and the after value
    // Return true when we want to match against this rule
    match: (before, after) =>
      // Category does has changed
      before.category !== after.category &&
      // Has a subcategory
      before.subCategory &&
      after.subCategory,

    // Perform a modification to the object
    perform: (obj) => {
      // Poor mans clone
      const val = JSON.parse(JSON.stringify(obj));
      delete val.subCategory;
      return val;
    },
  },

  // ... More rules added here
];

const value = assign({ rules })(state, changeState);
// { category: 'stay' }
```

## Fexp-js Lang Feature

This is as a complete language enhancement for fexp-js scripting

```javascript
const { parse, langs } = require("@alpaca-travel/fexp-js");
const stdLang = require("@alpaca-travel/fexp-js-lang");
const {
  lang: newLangFeatures,
} = require("@alpaca-travel/object-assign-reducer");

// Define this in YAML/JSON, and can be external to your application code
const expr = [
  "reducer-assign",
  // Matcher function
  [
    "fn",
    [
      // All conditions are true in order to perform this action
      "all",
      // Categories don't match
      // fn-arg 0 = before
      // fn-arg 1 = after
      [
        "!=",
        ["get", "category", ["fn-arg", 0]],
        ["get", "category", ["fn-arg", 1]],
      ],
      // They have sub-categories
      ["exists", ["get", "subCategory", ["fn-arg", 0]]],
      ["exists", ["get", "subCategory", ["fn-arg", 1]]],
    ],
  ],
  // Action to remove the sub category
  ["fn", ["remove", "subCategory"]],

  // ... more can go here

  // The context of the second argument
  ["fn-arg", 1],
];

// Fn now contains all the rules
const fn = parse(expr, langs(stdLang, newLangFeatures));

// State before
const state = {
  category: "eat",
  subCategory: "restaurant",
  tags: ["tag1"],
};
// Changing state
const changeState = { category: "stay" };

const result = fn(state, changeState);

// { category: 'eat', tags: ['tag1'] }
```

[![Edit Object Assign Reducer with Fexp-js](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/silent-sun-yugzk?fontsize=14&hidenavigation=1&theme=dark)
