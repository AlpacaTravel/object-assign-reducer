const lang = require("@alpaca-travel/fexp-js-lang");
const { assign } = require("../../src/index");

describe("State Transitions", () => {
  describe("Basic category/sub-category dependencies", () => {
    test("Scenarios", () => {
      const rules = [
        // Remove a sub-category if something changes
        {
          match: [
            "all",
            // Change in category
            ["!=", ["get", "before.category"], ["get", "next.category"]],
            // Has a subcategory, and still has a subcategory
            ["exists", ["get", "before.subCategory"]],
            ["exists", ["get", "next.subCategory"]],
          ],
          actions: [
            {
              type: "remove",
              args: ["subCategory"],
            },
          ],
        },
        // Remove a category when you change a region
        {
          match: [
            "all",
            // Change in category
            ["!=", ["get", "before.region"], ["get", "next.region"]],
            ["exists", ["get", "before.category"]],
            ["exists", ["get", "next.category"]],
          ],
          actions: [
            {
              type: "remove",
              args: ["category"],
            },
          ],
        },
      ];

      expect(
        assign({ rules, lang })(
          { category: "a", subCategory: "a", region: "a" },
          { category: "a", region: "b" }
        )
      ).toEqual({
        region: "b",
      });

      expect(
        assign({ rules, lang })(
          { category: "a", subCategory: "a", region: "a" },
          { category: "b", region: "a" }
        )
      ).toEqual({
        region: "a",
        category: "b",
      });

      expect(
        assign({ rules, lang })(
          { category: "a", subCategory: "a", region: "a" },
          { category: "b", region: "b" }
        )
      ).toEqual({
        region: "b",
      });
    });
  });
});
