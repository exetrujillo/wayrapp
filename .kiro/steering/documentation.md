# WayrApp Documentation Standards

## Documentation Philosophy
WayrApp maintains comprehensive, multi-layered documentation that serves developers, API consumers, and maintainers. All documentation should be clear, accurate, and automatically generated where possible.

## Documentation Types

### 1. Code Documentation (JSDoc/TypeDoc)
All TypeScript code must include comprehensive JSDoc comments for automatic documentation generation.

#### Module-Level Documentation
Every module file should start with a comprehensive JSDoc block:

```typescript
/**
 * Brief one-line description of the module's purpose.
 * 
 * Detailed explanation of what this module does, its role in the system,
 * key architectural decisions, and how it integrates with other components.
 * Include information about design patterns used, security considerations,
 * and any important implementation details.
 * 
 * @module ModuleName
 * @category CategoryName (e.g., Controllers, Services, Utils, Routes)
 * @author Exequiel Trujillo
 * @since Version (e.g., 1.0.0)
 * 
 * @example
 * // Usage example showing how to use this module
 * import { SomeFunction } from './module';
 * const result = SomeFunction(params);
 */
```

#### Function/Method Documentation
All public functions and methods must be documented:

```typescript
/**
 * Brief description of what the function does.
 * 
 * Detailed explanation including edge cases, error conditions,
 * and any side effects.
 * 
 * @param {Type} paramName - Description of parameter
 * @param {Type} [optionalParam] - Description of optional parameter
 * @returns {Type} Description of return value
 * @throws {ErrorType} When this error occurs
 * 
 * @example
 * // Example usage
 * const result = functionName(param1, param2);
 */
```

#### Interface/Type Documentation
All interfaces and types should be documented:

```typescript
/**
 * Description of the interface purpose.
 * 
 * @interface InterfaceName
 * @property {Type} propertyName - Description of property
 * @property {Type} [optionalProperty] - Description of optional property
 */
interface InterfaceName {
  /** Brief description of property */
  propertyName: Type;
  /** Brief description of optional property */
  optionalProperty?: Type;
}
```

### 2. API Documentation (OpenAPI/Swagger)
All API endpoints must include comprehensive Swagger documentation.

#### Swagger Comment Structure
```typescript
/**
 * @swagger
 * /api/v1/endpoint:
 *   post:
 *     summary: Brief description of endpoint
 *     description: Detailed description of what this endpoint does
 *     tags:
 *       - TagName
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Description of parameter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchemaName'
 *           example:
 *             field: "example value"
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseSchema'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 */
```

### 3. README Documentation
Each module should include a README.md explaining:
- Purpose and scope
- Key components
- Usage examples
- Integration points
- Testing approach

## Documentation Tools & Configuration

### TypeDoc Configuration
- **Output**: `./docs` directory
- **Theme**: Material theme with WayrApp colors (#50A8B1)
- **Exclusions**: Test files, node_modules, dist
- **Features**: Search in comments, version inclusion, category organization

### Swagger/OpenAPI
- **Version**: OpenAPI 3.0.0
- **Integration**: Automatic generation from JSDoc comments
- **UI**: Custom styled Swagger UI with WayrApp design tokens
- **Endpoints**: 
  - `/swagger` - Interactive documentation
  - `/api/docs` - JSON specification
  - `/api-docs` - Alternative UI

## Documentation Standards

### Required Documentation
1. **All public APIs** - Complete Swagger documentation
2. **All modules** - Module-level JSDoc with examples
3. **All public functions** - Parameter and return documentation
4. **All interfaces/types** - Property descriptions
5. **Complex business logic** - Inline comments explaining reasoning
6. **Error handling** - Document all possible error conditions

### Documentation Quality Guidelines
1. **Clarity**: Use clear, concise language
2. **Completeness**: Cover all parameters, return values, and exceptions
3. **Examples**: Include practical usage examples
4. **Accuracy**: Keep documentation synchronized with code
5. **Consistency**: Follow established patterns and terminology

### Code Comments
- Use `//` for brief inline comments
- Use `/* */` for multi-line explanations
- Use JSDoc `/** */` for documentation generation
- Explain **why**, not just **what**
- Document complex algorithms and business rules
- Include TODO/FIXME comments with context

## Documentation Maintenance

### Automated Generation
- **TypeDoc**: Runs on `npm run docs`
- **Swagger**: Auto-generated from route comments
- **GitHub Pages**: Automatically deployed from docs/

### Review Process
- Documentation updates required for all API changes
- JSDoc comments reviewed in code reviews
- Examples tested and validated
- Version information updated with releases

### Documentation Deployment
- **Technical Docs**: GitHub Pages (https://exetrujillo.github.io/wayrapp/)
- **API Docs**: Integrated with application deployment
- **Local Development**: `npm run docs:serve` for local preview

## Special Documentation Requirements

### Security Documentation
- Document authentication requirements
- Explain authorization levels
- Detail rate limiting rules
- Include security considerations

### Error Documentation
- Document all error codes and messages
- Explain error handling strategies
- Include troubleshooting guides
- Provide recovery procedures

### Testing Documentation
- Document test setup requirements
- Explain test database configuration
- Include testing best practices
- Provide debugging guidance

## Documentation Anti-Patterns to Avoid
- Outdated comments that don't match code
- Obvious comments that add no value
- Missing parameter or return value documentation
- Incomplete error condition documentation
- Examples that don't work or are misleading
- Documentation that duplicates code without adding insight