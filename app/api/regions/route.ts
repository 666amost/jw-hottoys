import { NextRequest, NextResponse } from "next/server";
import { isAllowedRegionParent, type RegionOption } from "@/lib/address-regions";

type RegionLevel = "districts" | "villages";

function isRegionLevel(value: string | null): value is RegionLevel {
  return value === "districts" || value === "villages";
}

function parseRegionOptions(payload: unknown, parentCode: string): RegionOption[] {
  if (!payload || typeof payload !== "object" || !("data" in payload)) return [];

  const { data } = payload;
  if (!Array.isArray(data)) return [];

  return data.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("code" in item) ||
      !("name" in item) ||
      typeof item.code !== "string" ||
      typeof item.name !== "string" ||
      !item.code.startsWith(`${parentCode}.`)
    ) {
      return [];
    }

    return [{ code: item.code, name: item.name.trim() }];
  });
}

export async function GET(request: NextRequest) {
  const level = request.nextUrl.searchParams.get("level");
  const parentCode = request.nextUrl.searchParams.get("parent")?.trim() ?? "";

  if (!isRegionLevel(level) || !isAllowedRegionParent(level, parentCode)) {
    return NextResponse.json({ error: "Permintaan wilayah tidak valid." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://wilayah.id/api/${level}/${parentCode}.json`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    if (!response.ok) throw new Error(`Region API returned ${response.status}`);

    const options = parseRegionOptions(await response.json(), parentCode);
    if (options.length === 0) throw new Error("Region API returned no matching data");

    return NextResponse.json({ data: options });
  } catch {
    return NextResponse.json(
      { error: "Data wilayah sedang tidak dapat dimuat." },
      { status: 502 },
    );
  }
}
