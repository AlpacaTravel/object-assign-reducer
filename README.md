# Object Assign Reducer

A utility to reduce an object assignment of properties into a new state.

This exists for a use case where you wish to apply an object property and automatically remove or update other properties based on a set of rules. In this case, we need to be able to target a number of conditions, such as describing edge-cases and compatible states to apply a criteria based on the resulting object.

A couple of special things:

- If the supplied rule matches, but then does not transition the object away from a match, it will throw an error
- Rules are applied continually until there is no further transitions

```javascript
const { assign } = require("@alpaca-travel/fexp-js-object-reducer");

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
    // Setup a matching rul
    match: (before, after) => {
      if (
        // Category does has changed
        before.category !== after.category &&
        // Has a subcategory
        before.subCategory &&
        after.subCategory
      ) {
        return true;
      }
      return false;
    },
    // Perform a modification to the object
    perform: (obj) => {
      // Poor mans clone
      const val = JSON.parse(JSON.stringify(obj));
      delete val.subCategory;
      return val;
    },
  },

  // More rules
];

const value = assign({ rules })(state, changeState);
// { category: 'stay' }
```

## Fexp-js Externalise

We often use a scripting configuration by leveraging `@alpaca-travel/fexp-js`.

```javascript
const { assign } = require("@alpaca-travel/fexp-js-object-reducer");
const { parse } = require("@alpaca-travel/fexp-js");
const lang = require("@alpaca-travel/fexp-js-lang");

// Create some rules
const rules = [
  {
    match: [
      // Use a fexp-js rule for expressions
      "all",
      ["!=", ["get", "category"], ["get", "category", ["fn-arg", 1]]],
      ["exists", ["get", "subCategory"]],
      ["exists", ["get", "subCategory", ["fn-arg", 1]]],
    ],
    perform: ["remove", "subCategory"],
  },
  // ... more rules here
];

// Out state object
const state = { category: "eat", subCategory: "restaurant" };
const apply = { category: "stay" };

// Traditional assign has not subtle rules
// Object.assign({}, state, apply);
// { category: stay, subCategory: restaurant }
// Invalid object state, the subCategory does not match

// Apply some state with some state rules
const nextState = assign({ rules, parse, lang })(state, change);

console.log(nextState);
// { category: stay }
```

## Fexp-js Lang Feature

This is as a complete language enhancement for fexp-js scripting

```javascript
const { parse, langs } = require("@alpaca-travel/fexp-js");
const stdLang = require("@alpaca-travel/fexp-js-lang");
const { lang: shim } = require("@alpaca-travel/fexp-js-object-reducer");

const expr = [
  "reducer-assign",
  // Matcher function
  [
    "fn",
    [
      "all",
      ["!=", ["get", "category", ['fn-arg', 0]], ["get", "category", ["fn-arg", 1]]],
      ["exists", ["get", "subCategory"], ['fn-arg', 0]],
      ["exists", ["get", "subCategory", ["fn-arg", 1]],
    ],
  ],
  // Action
  ["fn", ["remove", "subCategory"]],

  // ... more can go here

  // The context of the second argument
  ["fn-arg", 1],
];

const fn = parse(expr, langs(stdLang, shim));

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
