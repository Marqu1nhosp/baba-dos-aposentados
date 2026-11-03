import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { isValidSessionToken } from "@/lib/auth";

export async function PATCH(
  _request: Request,
  _context: { params: Promise<{ id: string }> },
) {
  return NextResponse.json(
    { error: "Exclua o jogador e cadastre-o novamente para alterar as estrelas." },
    { status: 405 },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  if (!(await isValidSessionToken(cookieStore.get("baba_session")?.value))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.player.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Jogador não encontrado." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível remover o jogador." },
      { status: 500 },
    );
  }
}
