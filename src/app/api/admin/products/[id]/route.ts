import { NextResponse } from "next/server";

/** Direct product status changes are disabled — use maker-checker change requests. */
export async function PATCH() {
  return NextResponse.json(
    {
      error:
        "Direct product status changes are disabled. Create a change request and have a different admin approve it.",
    },
    { status: 405 },
  );
}
