# Fexp-js Object Reducer

A utility to reduce an object assignment of properties into a new state.

This exists for a use case where you wish to apply an object property and automatically remove or update other properties based on a set of rules. In this case, we need to be able to target a number of conditions, such as describing edge-cases and compatible states to apply a criteria based on the resulting object.

A couple of special things:

- If the supplied rule matches, but then does not transition the object away from a match, it will throw an error
- Rules are applied continually until there is no further transitions

```javascript
const { assign } = require("@alpaca-travel/object-assign-rules");
const lang = require("@alpaca-travel/fexp-js-lang");

// Create some rules
const rules = [
  {
    match: [
      // Use a fexp-js rule for expressions
      "all",
      ["!=", ["get", "before.category"], ["get", "next.category"]],
      ["exists", ["get", "before.subCategory"]],
      ["exists", ["get", "next.subCategory"]],
    ],
    actions: [{ type: "remove", args: ["subCategory"] }],
  },
];

// Out state object
const state = { category: "eat", subCategory: "restaurant" };
const apply = { category: "stay" };

// Traditional assign has not subtle rules
// Object.assign({}, state, apply);
// { category: stay, subCategory: restaurant }
// Invalid object state, the subCategory does not match

// Apply some state with some state rules
const nextState = assign({ rules, lang })(state, change);

console.log(nextState);
// { category: stay }
```
