const _isEqual = require("lodash.isequal");
const _clone = require("lodash.clone");
const assert = require("assert");

const remove = (args) => {
  const clone = _clone(args[1] || args.context.vars.arguments[0]);
  const props = [...args];
  delete clone[props[0]];
  return clone;
};

/**
 * Take a set of defined rules, and validate/optimise
 *
 * rules: [
 *   {
 *     match: <fexp-js-expression to return true/false>
 *     perform: <fexp-js-expresion to modify>
 *   }
 * ]
 **/
const rulesParse = (rules, { warn, lang, parse }) => {
  // Fexpjs
  const mutatorLang = {
    remove,
  };
  const langImplementation = Object.assign(lang || {}, mutatorLang);

  return rules
    .map((r) => {
      try {
        assert(
          Array.isArray(r.perform) || r.perform,
          "Should supply perform for this"
        );
        assert(
          Array.isArray(r.match) ||
            ["function", "boolean"].indexOf(typeof r.match) > -1,
          "Should provide a match statement"
        );
      } catch (e) {
        if (warn === true) {
          console.warn(e);
          return undefined;
        }
        throw e;
      }
      return Object.assign({}, r, {
        matcher: (() => {
          if (typeof r.match === "boolean") {
            return r.match;
          }
          if (Array.isArray(r.match)) {
            return parse(r.match, langImplementation);
          }
          return r.match;
        })(),
        performer: (() => {
          if (typeof r.perform === "function") {
            return r.perform;
          }
          if (Array.isArray(r.perform)) {
            return parse(r.perform, langImplementation);
          }
          return r.perform;
        })(),
      });
    })
    .filter((rule) => rule);
};

/**
 * Process an assignment
 * @param {*} options
 */
const assign = (options) => {
  // Obtain the rules ready for transition
  const rulesParsed = (() => {
    // Create rules
    if (!options.rules || options.rulesParsed) {
      return [];
    }
    if (options.rulesParsed) {
      return options.rulesParsed;
    }
    return rulesParse(options.rules, {
      warn: options.warn === true,
      lang: options.lang,
      parse: options.parse,
    });
  })();

  // Prepare the options for subsequent calls
  const optimisedOptions = Object.assign({}, options, { rulesParsed });

  // Return the reducer
  return (obj, ...next) => {
    if (!next.length) {
      return assignOnce(obj, {}, options);
    }

    return next.reduce((c, n) => assignOnce(c, n, optimisedOptions), obj);
  };
};

const assignOnce = (before, apply, options = {}) => {
  rulesParsed = options.rulesParsed;
  assert(rulesParsed, "Missing the parsed fules");

  // Build a transition of rules
  let transitioning = Object.assign({}, before, apply);

  // Process to end..
  while (true) {
    const data = {
      before,
      next: transitioning,
    };

    // Update the transition
    const next = rulesParsed
      .filter((rule) => {
        // If the match consition is matched
        const isMatch = (() => {
          // We are appling
          if (typeof rule.matcher === "function") {
            if (rule.matcher(data.before, data.next)) {
              // Indicate we want to process the actions
              return true;
            }
          }
          // We have a boolean
          if (typeof rule.matcher === "boolean") {
            return rule.matcher;
          }
          return false;
        })();
        return isMatch;
      })
      .reduce((trans, rule) => {
        // Apply the transition rules
        const next = (() => {
          if (typeof rule.performer === "function") {
            return rule.performer(trans);
          }
          return rule.performer;
        })();

        // Capture mistakes where the value does not transition
        if (_isEqual(next, trans)) {
          console.warn("Rule did not transition and is removed", rule);
          rulesParsed = rulesParsed.filter((f) => f !== rule);
        }

        return next;
      }, transitioning);

    // We have no work to do
    if (_isEqual(transitioning, next)) {
      break;
    }

    // Continue the processing..
    transitioning = next;
  }

  return transitioning;
};

// reducer-assign, match, result, match, result, action, action

const reducerAssign = (args) => {
  const iterator = args[Symbol.iterator]();

  const pair = function* () {
    while (true) {
      const arg0 = iterator.next();
      const arg1 = iterator.next();
      if (!arg1.done) {
        yield [arg0.value, arg1.value];
      } else {
        yield arg0.value;
        break;
      }
    }
  };

  const rules = [];
  let assignVal = {};

  for (const cases of pair(args)) {
    if (Array.isArray(cases)) {
      const [kase, output] = cases;
      rules.push({
        match: kase,
        perform: output,
      });
    } else {
      assignVal = cases;
    }
  }

  const context = args.context.vars.arguments[0];

  return assignOnce(context, assignVal, { rulesParsed: rulesParse(rules, {}) });
};

const lang = {
  "reducer-assign": reducerAssign,
  remove,
};

module.exports = {
  assign,
  rulesParse,
  lang,
};
