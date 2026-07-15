import { prisma } from "@/lib/prisma";
import { AIMemoryType, Prisma } from "@prisma/client";

export async function getMemory(
  employeeId: string,
  type: AIMemoryType,
  key: string,
): Promise<unknown | null> {
  const entry = await prisma.aIMemory.findUnique({
    where: { employeeId_type_key: { employeeId, type, key } },
  });
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < new Date()) {
    prisma.aIMemory.delete({ where: { id: entry.id } }).catch(() => {});
    return null;
  }
  return entry.value;
}

export async function setMemory(
  employeeId: string,
  type: AIMemoryType,
  key: string,
  value: unknown,
  expiresAt?: Date,
): Promise<void> {
  await prisma.aIMemory.upsert({
    where:  { employeeId_type_key: { employeeId, type, key } },
    create: { employeeId, type, key, value: value as Prisma.InputJsonValue, expiresAt },
    update: { value: value as Prisma.InputJsonValue, expiresAt, updatedAt: new Date() },
  });
}

export async function deleteMemory(
  employeeId: string,
  type: AIMemoryType,
  key: string,
): Promise<void> {
  await prisma.aIMemory.deleteMany({
    where: { employeeId, type, key },
  });
}

export async function listMemories(employeeId: string, type?: AIMemoryType) {
  return prisma.aIMemory.findMany({
    where: {
      employeeId,
      ...(type ? { type } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function appendConversationMessage(
  employeeId: string,
  userId: string,
  message: { role: "user" | "assistant"; content: string; timestamp: string },
): Promise<void> {
  const conv = await prisma.aIEmployeeConversation.findFirst({
    where: { employeeId, userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!conv) {
    await prisma.aIEmployeeConversation.create({
      data: { employeeId, userId, messages: [message] as unknown as Prisma.InputJsonValue },
    });
    return;
  }

  const messages = Array.isArray(conv.messages) ? conv.messages : [];
  messages.push(message);
  await prisma.aIEmployeeConversation.update({
    where: { id: conv.id },
    data:  { messages: messages as unknown as Prisma.InputJsonValue },
  });
}
