import { handler } from "../../services/porter";

test("test porter handler return hello", async () => {
  const response = await handler({} as any, {} as any);
  expect(response.statusCode).toBe(200);
});
