# Schemas

Validate your data at every step. Catch errors early, not in production.

## What are Schemas?

A schema is a blueprint for your data. It defines what shape your data should have.

```javascript
// Without schema - anything goes
const data = { name: "John", age: "twenty" }; // Wrong type!

// With schema - enforced structure
const schema = z.object({
  name: z.string(),
  age: z.number(),
});
const data = schema.parse({ name: "John", age: 20 }); // Valid!
```

## Types of Workflow Schemas

### 1. Input Schema

Validates data when workflow starts.

```javascript
const workflow = createWorkflowChain({
  id: "process-order",
  input: z.object({
    orderId: z.string(),
    amount: z.number().positive(),
  }),
  // ...
});

// This will work
await workflow.run({ orderId: "123", amount: 99.99 });

// This will fail with clear error
await workflow.run({ orderId: 123, amount: -5 }); // Type error!
```

### 2. Result Schema

Validates final workflow output.

```javascript
const workflow = createWorkflowChain({
  id: "generate-report",
  input: z.object({ data: z.array(z.number()) }),
  result: z.object({
    average: z.number(),
    summary: z.string(),
  }),
}).andThen({
  id: "calculate",
  execute: async ({ data }) => ({
    average: data.reduce((a, b) => a + b, 0) / data.length,
    summary: `Processed ${data.length} items`,
  }),
});
```

### 3. Suspend Schema

Validates data saved when workflow pauses.

```javascript
const workflow = createWorkflowChain({
  id: "approval-flow",
  suspendSchema: z.object({
    requestId: z.string(),
    amount: z.number(),
    requestedBy: z.string(),
  }),
}).andThen({
  id: "check-approval",
  execute: async ({ data }, { suspend }) => {
    if (data.amount > 1000) {
      // Suspend with validated data
      suspend({
        requestId: data.id,
        amount: data.amount,
        requestedBy: data.user,
      });
    }
    return data;
  },
});
```

### 4. Resume Schema

Validates data when workflow continues after suspension.

```javascript
const workflow = createWorkflowChain({
  id: "approval-flow",
  resumeSchema: z.object({
    approved: z.boolean(),
    approvedBy: z.string().email(),
    comments: z.string().optional(),
  }),
}).andThen({
  id: "process-approval",
  execute: async ({ data, resumeData }) => {
    // resumeData is typed and validated
    if (resumeData?.approved) {
      return { ...data, status: "approved", approver: resumeData.approvedBy };
    }
    return { ...data, status: "rejected" };
  },
});

// Resume with validated data
await workflow.resume(executionId, {
  approved: true,
  approvedBy: "manager@company.com",
  comments: "Looks good",
});
```

## Step-Level Schemas

Steps can define their own schemas that override workflow defaults:

```javascript
const workflow = createWorkflowChain({
  id: "multi-step",
  input: z.object({ userId: z.string() }),
  resumeSchema: z.object({ continue: z.boolean() }), // Default
}).andThen({
  id: "step-with-custom-resume",
  resumeSchema: z.object({
    verified: z.boolean(),
    verificationCode: z.string(),
  }), // This step needs different resume data
  execute: async ({ data, resumeData }) => {
    // Uses step's resumeSchema, not workflow's
    if (resumeData?.verified) {
      return { ...data, verified: true };
    }
    return data;
  },
});
```

## Why Use Schemas?

### 1. Catch Errors Early

```javascript
// Without schema - error happens in production
.andThen({
  execute: async ({ data }) => {
    // Crashes if data.email is undefined
    return await sendEmail(data.email);
  }
})

// With schema - error caught immediately
input: z.object({ email: z.string().email() })
```

### 2. Better Developer Experience

```javascript
// TypeScript knows exactly what data looks like
.andThen({
  execute: async ({ data }) => {
    // Auto-complete works perfectly
    data.email // TypeScript knows this exists
    data.phone // TypeScript error: property doesn't exist
  }
})
```

### 3. Clear Documentation

Schemas serve as documentation for your workflow:

```javascript
// Anyone can see what this workflow expects
const workflow = createWorkflowChain({
  input: z.object({
    customer: z.object({
      id: z.string(),
      email: z.string().email(),
      tier: z.enum(["free", "pro", "enterprise"]),
    }),
    items: z.array(
      z.object({
        sku: z.string(),
        quantity: z.number().int().positive(),
      })
    ),
  }),
});
```

## Schema Patterns

### Optional Fields

```javascript
z.object({
  required: z.string(),
  optional: z.string().optional(),
  withDefault: z.string().default("default value"),
});
```

### Union Types

```javascript
// Accept multiple formats
resumeSchema: z.union([
  z.object({ approved: z.literal(true), approvedBy: z.string() }),
  z.object({ approved: z.literal(false), reason: z.string() }),
]);
```

### Nested Validation

```javascript
input: z.object({
  user: z.object({
    name: z.string().min(1),
    age: z.number().int().min(18),
  }),
  preferences: z.record(z.string(), z.any()).optional(),
});
```

## Common Mistakes

### 1. Forgetting Resume Schema

```javascript
// Bad - no validation on resume
.andThen({
  execute: async ({ resumeData }) => {
    // resumeData could be anything!
    return resumeData.approved; // Might crash
  }
})

// Good - validated resume data
resumeSchema: z.object({ approved: z.boolean() })
```

### 2. Too Strict Schemas

```javascript
// Bad - too restrictive
result: z.object({
  data: z.string().length(100), // Must be exactly 100 chars
});

// Good - flexible but safe
result: z.object({
  data: z.string().min(1).max(1000),
});
```

## Next Steps

- Learn about [Suspend & Resume](https://voltagent.dev/docs/workflows/suspend-resume/) patterns with schemas
- See schemas in action with [Step Types](https://voltagent.dev/docs/workflows/steps/and-then/)
- Explore [Workflow Hooks](https://voltagent.dev/docs/workflows/hooks/) for schema validation events
- Execute workflows via [REST API](https://voltagent.dev/docs/api/overview/#workflow-endpoints) with type-safe schemas

## Additional Links

- [VoltAgent home](https://voltagent.dev/)
- [Discord](https://s.voltagent.dev/discord)
- [GitHub](https://github.com/voltagent/voltagent)
- [VoltAgent Docs](https://voltagent.dev/docs/)
- [VoltOps Docs](https://voltagent.dev/voltops-llm-observability-docs/)
- [←Hooks](https://voltagent.dev/docs/workflows/hooks/)
- [andThen→](https://voltagent.dev/docs/workflows/steps/and-then/)
