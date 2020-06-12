const { parse, langs } = require("@alpaca-travel/fexp-js");
const stdLang = require("@alpaca-travel/fexp-js-lang");
const { assign, lang: shimLang } = require("../../src/index");

describe("State Transitions", () => {
  test("Fexp-js reducer fn", () => {
    const lang = langs(stdLang, shimLang);
    const expr = [
      "reducer-assign",
      [
        "fn",
        [
          "all",
          // Change in category
          ["!=", ["get", "category"], ["get", "category", ["fn-arg", 1]]],
          // Has a subcategory, and still has a subcategory
          ["exists", ["get", "subCategory"]],
          ["exists", ["get", "subCategory", ["fn-arg", 1]]],
        ],
      ],
      ["fn", ["remove", "subCategory"]],
      ["fn-arg", 1],
    ];

    const fn = parse(expr, lang);
    expect(fn({ category: "a", subCategory: "a" }, { category: "b" })).toEqual({
      category: "b",
    });
  });

  describe("Basic category/sub-category dependencies", () => {
    test("standard", () => {
      const rules = [
        {
          match: (before, after) => {
            if (
              before.category !== after.category &&
              before.subCategory &&
              after.subCategory
            ) {
              return true;
            }
            return false;
          },
          perform: (obj) => {
            const val = Object.assign({}, obj, { subCategory: null });
            return val;
          },
        },
      ];

      const state = {
        category: "eat",
        subCategory: "restaurant",
        tags: ["tag1"],
      };
      const changeState = { category: "stay" };

      const value = assign({ rules })(state, changeState);
      expect(value).toEqual({
        category: "stay",
        subCategory: null,
        tags: ["tag1"],
      });
    });
    test("Scenarios using fexp-js", () => {
      const rules = [
        // Remove a sub-category if something changes
        {
          match: [
            "all",
            // Change in category
            ["!=", ["get", "category"], ["get", "category", ["fn-arg", 1]]],
            // Has a subcategory, and still has a subcategory
            ["exists", ["get", "subCategory"]],
            ["exists", ["get", "subCategory", ["fn-arg", 1]]],
          ],
          perform: ["remove", "subCategory"],
        },
        // Remove a category when you change a region
        {
          match: [
            "all",
            // Change in category
            ["!=", ["get", "region"], ["get", "region", ["fn-arg", 1]]],
            ["exists", ["get", "category"]],
            ["exists", ["get", "category", ["fn-arg", 1]]],
          ],
          perform: ["remove", "category"],
        },
      ];

      expect(
        assign({ rules, lang: stdLang, parse })(
          { category: "a", subCategory: "a", region: "a" },
          { category: "a", region: "b" }
        )
      ).toEqual({
        region: "b",
      });

      expect(
        assign({ rules, lang: stdLang, parse })(
          { category: "a", subCategory: "a", region: "a" },
          { category: "b", region: "a" }
        )
      ).toEqual({
        region: "a",
        category: "b",
      });

      expect(
        assign({ rules, lang: stdLang, parse })(
          { category: "a", subCategory: "a", region: "a" },
          { category: "b", region: "b" }
        )
      ).toEqual({
        region: "b",
      });
    });
  });
});
