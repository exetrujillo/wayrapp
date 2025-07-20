import {
  PaginationSchema,
  IdParamSchema,
  UuidParamSchema,
  LanguageCodeSchema,
  CountryCodeSchema,
  EmailSchema,
  UsernameSchema,
  UrlSchema,
  ExperiencePointsSchema,
  OrderSchema,
  ScoreSchema,
  TimeSecondsSchema,
  BooleanStringSchema,
  RoleSchema,
  ModuleTypeSchema,
  ExerciseTypeSchema,
  TextFieldSchema,
  OptionalTextFieldSchema,
  JsonSchema,
} from "../common";

describe("Common Schemas", () => {
  describe("PaginationSchema", () => {
    it("should parse valid pagination parameters", () => {
      const result = PaginationSchema.parse({
        page: "2",
        limit: "50",
        sortBy: "name",
        sortOrder: "desc",
      });

      expect(result).toEqual({
        page: 2,
        limit: 50,
        sortBy: "name",
        sortOrder: "desc",
      });
    });

    it("should use default values", () => {
      const result = PaginationSchema.parse({});

      expect(result).toEqual({
        page: 1,
        limit: 20,
        sortOrder: "asc",
      });
    });

    it("should reject invalid pagination values", () => {
      expect(() =>
        PaginationSchema.parse({ page: "0", limit: "101" }),
      ).toThrow();
    });
  });

  describe("IdParamSchema", () => {
    it("should accept valid ID", () => {
      const result = IdParamSchema.parse({ id: "test-id" });
      expect(result).toEqual({ id: "test-id" });
    });

    it("should reject empty ID", () => {
      expect(() => IdParamSchema.parse({ id: "" })).toThrow();
    });
  });

  describe("UuidParamSchema", () => {
    it("should accept valid UUID", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const result = UuidParamSchema.parse({ id: uuid });
      expect(result).toEqual({ id: uuid });
    });

    it("should reject invalid UUID", () => {
      expect(() => UuidParamSchema.parse({ id: "invalid-uuid" })).toThrow();
    });
  });

  describe("LanguageCodeSchema", () => {
    it("should accept valid language codes", () => {
      expect(LanguageCodeSchema.parse("en")).toBe("en");
      expect(LanguageCodeSchema.parse("es")).toBe("es");
    });

    it("should reject invalid language codes", () => {
      expect(() => LanguageCodeSchema.parse("ENG")).toThrow();
      expect(() => LanguageCodeSchema.parse("e")).toThrow();
      expect(() => LanguageCodeSchema.parse("EN")).toThrow();
    });
  });

  describe("CountryCodeSchema", () => {
    it("should accept valid country codes", () => {
      expect(CountryCodeSchema.parse("US")).toBe("US");
      expect(CountryCodeSchema.parse("GB")).toBe("GB");
    });

    it("should reject invalid country codes", () => {
      expect(() => CountryCodeSchema.parse("us")).toThrow();
      expect(() => CountryCodeSchema.parse("USA")).toThrow();
      expect(() => CountryCodeSchema.parse("U")).toThrow();
    });
  });

  describe("EmailSchema", () => {
    it("should accept valid emails", () => {
      expect(EmailSchema.parse("test@example.com")).toBe("test@example.com");
      expect(EmailSchema.parse("user.name+tag@domain.co.uk")).toBe(
        "user.name+tag@domain.co.uk",
      );
    });

    it("should reject invalid emails", () => {
      expect(() => EmailSchema.parse("invalid-email")).toThrow();
      expect(() => EmailSchema.parse("@domain.com")).toThrow();
      expect(() => EmailSchema.parse("user@")).toThrow();
    });
  });

  describe("UsernameSchema", () => {
    it("should accept valid usernames", () => {
      expect(UsernameSchema.parse("user123")).toBe("user123");
      expect(UsernameSchema.parse("user_name")).toBe("user_name");
      expect(UsernameSchema.parse("user-name")).toBe("user-name");
    });

    it("should reject invalid usernames", () => {
      expect(() => UsernameSchema.parse("ab")).toThrow(); // too short
      expect(() => UsernameSchema.parse("user@name")).toThrow(); // invalid character
      expect(() => UsernameSchema.parse("user name")).toThrow(); // space
    });
  });

  describe("UrlSchema", () => {
    it("should accept valid URLs", () => {
      expect(UrlSchema.parse("https://example.com")).toBe(
        "https://example.com",
      );
      expect(UrlSchema.parse("http://localhost:3000")).toBe(
        "http://localhost:3000",
      );
    });

    it("should reject invalid URLs", () => {
      expect(() => UrlSchema.parse("not-a-url")).toThrow();
      expect(() => UrlSchema.parse("just-text")).toThrow();
    });
  });

  describe("ExperiencePointsSchema", () => {
    it("should accept valid experience points", () => {
      expect(ExperiencePointsSchema.parse(0)).toBe(0);
      expect(ExperiencePointsSchema.parse(100)).toBe(100);
    });

    it("should reject negative values", () => {
      expect(() => ExperiencePointsSchema.parse(-1)).toThrow();
    });

    it("should reject non-integers", () => {
      expect(() => ExperiencePointsSchema.parse(10.5)).toThrow();
    });
  });

  describe("OrderSchema", () => {
    it("should accept positive integers", () => {
      expect(OrderSchema.parse(1)).toBe(1);
      expect(OrderSchema.parse(100)).toBe(100);
    });

    it("should reject zero and negative values", () => {
      expect(() => OrderSchema.parse(0)).toThrow();
      expect(() => OrderSchema.parse(-1)).toThrow();
    });
  });

  describe("ScoreSchema", () => {
    it("should accept valid scores", () => {
      expect(ScoreSchema.parse(0)).toBe(0);
      expect(ScoreSchema.parse(50)).toBe(50);
      expect(ScoreSchema.parse(100)).toBe(100);
    });

    it("should reject out of range scores", () => {
      expect(() => ScoreSchema.parse(-1)).toThrow();
      expect(() => ScoreSchema.parse(101)).toThrow();
    });
  });

  describe("TimeSecondsSchema", () => {
    it("should accept valid time values", () => {
      expect(TimeSecondsSchema.parse(0)).toBe(0);
      expect(TimeSecondsSchema.parse(3600)).toBe(3600);
    });

    it("should reject negative values", () => {
      expect(() => TimeSecondsSchema.parse(-1)).toThrow();
    });
  });

  describe("BooleanStringSchema", () => {
    it("should parse boolean strings correctly", () => {
      expect(BooleanStringSchema.parse("true")).toBe(true);
      expect(BooleanStringSchema.parse("1")).toBe(true);
      expect(BooleanStringSchema.parse("false")).toBe(false);
      expect(BooleanStringSchema.parse("0")).toBe(false);
      expect(BooleanStringSchema.parse(undefined)).toBe(undefined);
    });
  });

  describe("RoleSchema", () => {
    it("should accept valid roles", () => {
      expect(RoleSchema.parse("student")).toBe("student");
      expect(RoleSchema.parse("content_creator")).toBe("content_creator");
      expect(RoleSchema.parse("admin")).toBe("admin");
    });

    it("should reject invalid roles", () => {
      expect(() => RoleSchema.parse("invalid_role")).toThrow();
    });
  });

  describe("ModuleTypeSchema", () => {
    it("should accept valid module types", () => {
      expect(ModuleTypeSchema.parse("informative")).toBe("informative");
      expect(ModuleTypeSchema.parse("basic_lesson")).toBe("basic_lesson");
      expect(ModuleTypeSchema.parse("reading")).toBe("reading");
      expect(ModuleTypeSchema.parse("dialogue")).toBe("dialogue");
      expect(ModuleTypeSchema.parse("exam")).toBe("exam");
    });

    it("should reject invalid module types", () => {
      expect(() => ModuleTypeSchema.parse("invalid_type")).toThrow();
    });
  });

  describe("ExerciseTypeSchema", () => {
    it("should accept valid exercise types", () => {
      expect(ExerciseTypeSchema.parse("translation")).toBe("translation");
      expect(ExerciseTypeSchema.parse("fill_in_the_blank")).toBe(
        "fill_in_the_blank",
      );
      expect(ExerciseTypeSchema.parse("vof")).toBe("vof");
      expect(ExerciseTypeSchema.parse("pairs")).toBe("pairs");
      expect(ExerciseTypeSchema.parse("informative")).toBe("informative");
      expect(ExerciseTypeSchema.parse("ordering")).toBe("ordering");
    });

    it("should reject invalid exercise types", () => {
      expect(() => ExerciseTypeSchema.parse("invalid_type")).toThrow();
    });
  });

  describe("TextFieldSchema", () => {
    it("should create schema with custom length constraints", () => {
      const schema = TextFieldSchema(5, 10);

      expect(schema.parse("hello")).toBe("hello");
      expect(schema.parse("helloworld")).toBe("helloworld");

      expect(() => schema.parse("hi")).toThrow(); // too short
      expect(() => schema.parse("hello world!")).toThrow(); // too long
    });
  });

  describe("OptionalTextFieldSchema", () => {
    it("should accept optional text", () => {
      const schema = OptionalTextFieldSchema(10);

      expect(schema.parse("hello")).toBe("hello");
      expect(schema.parse(undefined)).toBe(undefined);

      expect(() => schema.parse("hello world!")).toThrow(); // too long
    });
  });

  describe("JsonSchema", () => {
    it("should accept valid JSON objects and arrays", () => {
      expect(JsonSchema.parse({ key: "value" })).toEqual({ key: "value" });
      expect(JsonSchema.parse([1, 2, 3])).toEqual([1, 2, 3]);
      expect(JsonSchema.parse({ nested: { data: true } })).toEqual({
        nested: { data: true },
      });
    });
  });
});
