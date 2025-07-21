import { Request, Response, NextFunction } from "express";
import { xssProtection } from "../xssProtection";

describe("XSS Protection Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
      path: "/test",
      ip: "127.0.0.1",
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it("should sanitize XSS in request body", () => {
    mockRequest.body = {
      name: 'Test <script>alert("XSS")</script>',
      description: "Normal text",
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // The xss library HTML-encodes dangerous scripts instead of removing them completely
    expect(mockRequest.body.name).toBe('Test &lt;script&gt;alert("XSS")&lt;/script&gt;');
    expect(mockRequest.body.description).toBe("Normal text");
    expect(nextFunction).toHaveBeenCalled();
  });

  it("should sanitize XSS in query parameters", () => {
    mockRequest.query = {
      search: '<img src="x" onerror="alert(\'XSS\')">',
      page: "1",
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // The xss library removes the onerror attribute and src value
    expect(mockRequest.query["search"]).toBe('<img src>');
    expect(mockRequest.query["page"]).toBe("1");
    expect(nextFunction).toHaveBeenCalled();
  });

  it("should sanitize XSS in URL parameters", () => {
    mockRequest.params = {
      id: "123<script>document.cookie</script>",
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // The xss library HTML-encodes the script tag
    expect(mockRequest.params["id"]).toBe("123&lt;script&gt;document.cookie&lt;/script&gt;");
    expect(nextFunction).toHaveBeenCalled();
  });

  it("should handle nested objects", () => {
    mockRequest.body = {
      user: {
        name: 'Test <script>alert("XSS")</script>',
        profile: {
          bio: "<img src=\"javascript:alert('XSS')\">",
        },
      },
      items: [
        { title: '<script>alert("Item XSS")</script>' },
        { title: "Safe title" },
      ],
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // The xss library HTML-encodes dangerous scripts
    expect(mockRequest.body.user.name).toBe('Test &lt;script&gt;alert("XSS")&lt;/script&gt;');
    expect(mockRequest.body.user.profile.bio).toBe("<img src>");
    expect(mockRequest.body.items[0].title).toBe('&lt;script&gt;alert("Item XSS")&lt;/script&gt;');
    expect(mockRequest.body.items[1].title).toBe("Safe title");
    expect(nextFunction).toHaveBeenCalled();
  });

  it("should handle null and undefined values", () => {
    mockRequest.body = {
      nullValue: null,
      undefinedValue: undefined,
      text: "Normal text",
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockRequest.body.nullValue).toBeNull();
    expect(mockRequest.body.undefinedValue).toBeUndefined();
    expect(mockRequest.body.text).toBe("Normal text");
    expect(nextFunction).toHaveBeenCalled();
  });

  it("should handle non-object request properties", () => {
    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalled();
  });
});
