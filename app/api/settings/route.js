import { getFullState, setSetting } from "@/lib/budget";
import { badRequest, handle, json, readBody } from "@/lib/http";

// Réglages : salaire + épargne
export const PUT = handle(async (request) => {
  const { salary, savings } = await readBody(request);

  if (salary !== undefined) {
    const n = Number(salary);
    if (Number.isNaN(n) || n < 0) return badRequest("Salaire invalide");
    await setSetting("salary", n);
  }
  if (savings !== undefined && savings !== null) {
    const mode = savings.mode === "amount" ? "amount" : "percent";
    const value = Math.max(0, Number(savings.value) || 0);
    await setSetting("savings", { mode, value });
  }
  return json(await getFullState());
});
