const { parse } = require("@alpaca-travel/fexp-js");
const _isEqual = require("lodash.isequal");
const assert = require("assert");
const objectActions = require("./object-actions");

const supportedRuleTypes = Object.keys(objectActions);

/**
 * Take a set of defined rules, and validate/optimise
 *
 * rules: [
 *   {
 *     match: _fexp-js-expression_
 *     actions: [
 *       { type: 'remove', args: [..] }
 *     ]
 *   }
 * ]
 **/
const rulesParse = (rules, { warn, lang = stdLang }) =>
  rules
    .map((r) => {
      try {
        assert(Array.isArray(r.actions));
        assert(r.actions.length, "Should supply actions for this");
        assert(r.match, "Should provide a match statement");
        r.actions.forEach((rule) => {
          assert(rule.type, "Should define a supported type");
          assert(
            supportedRuleTypes.indexOf(rule.type) > -1,
            `Unrecognised rule action type ${
              rule.type
            }. Allowed values are: ${supportedRuleTypes.join(",")}`
          );
          assert(Array.isArray(rule.args), `Rule ${rule.type} is missing args`);
        });
      } catch (e) {
        if (warn === true) {
          console.warn(e);
          return undefined;
        }
        throw e;
      }
      return Object.assign({}, r, {
        parsed: parse(r.match, lang),
      });
    })
    .filter((rule) => rule);

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
        if (rule.parsed(data)) {
          // Indicate we want to process the actions
          return true;
        }
        // Ignore this rule
        return false;
      })
      .reduce((trans, rule) => {
        // Apply the transition rules
        const next = rule.actions.reduce(
          (next, action) => objectActions[action.type](next)(...action.args),
          trans
        );

        // Capture mistakes where the value does not transition
        if (_isEqual(trans, next)) {
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

module.exports = {
  assign,
  rulesParse,
};
