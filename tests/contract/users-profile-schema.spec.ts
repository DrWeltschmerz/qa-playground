import { expect } from "@playwright/test";
import Ajv from "ajv";
import { test } from "../fixtures/api-fixtures";

// A small schema-backed contract check for the authenticated profile shape.
// The demo API returns capitalized fields (ID, Email, Username) and must not expose passwords.

test.describe("@contract Users profile schema", () => {
  const schema = {
    type: "object",
    required: ["ID", "Email", "Username"],
    properties: {
      ID: { type: "string", minLength: 1 },
      Email: { type: "string", minLength: 3 },
      Username: { type: "string", minLength: 1 },
    },
    additionalProperties: true,
    not: { required: ["password", "Password"] },
  } as const;

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  test("profile matches contract", async ({ userRequest, apiBase }) => {
    const res = await userRequest.get(`${apiBase}/user/profile`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    const ok = validate(json);
    if (!ok) {
      const msg = (validate.errors || [])
        .map((e: any) => `${e.instancePath || "(root)"} ${e.message}`)
        .join("; ");
      throw new Error(`Profile schema validation failed: ${msg}`);
    }
  });
});
