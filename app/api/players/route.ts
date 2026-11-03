import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const playerCreateSchema = z.object({
  name: z.string().trim().min(2).max(30),
  rating: z.number().int().min(1).max(5).optional().default(3),
});

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(players);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar os jogadores." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = playerCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const player = await prisma.player.create({
      data: parsed.data,
    });
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um jogador com esse nome." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível cadastrar o jogador." },
      { status: 500 },
    );
  }
}
