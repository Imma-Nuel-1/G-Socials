// ============================================
// TEAM SERVICE — Workspace-scoped
// ============================================
// Teams are replaced by workspace memberships.
// Team CRUD now delegates to workspace.service.
// Messaging (user-to-user DMs) remains here.
// ============================================

import prisma from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors.js";

// ---- Messages (User-to-user, not workspace-scoped) ----

export async function getConversations(userId: string) {
  const sent = await prisma.message.findMany({
    where: { senderId: userId },
    select: { recipientId: true },
    distinct: ["recipientId"],
  });

  const received = await prisma.message.findMany({
    where: { recipientId: userId },
    select: { senderId: true },
    distinct: ["senderId"],
  });

  const contactIds = [
    ...new Set([
      ...sent.map((m) => m.recipientId),
      ...received.map((m) => m.senderId),
    ]),
  ];

  const conversations = await Promise.all(
    contactIds.map(async (contactId) => {
      const contact = await prisma.user.findUnique({
        where: { id: contactId },
        select: { id: true, name: true, avatar: true },
      });

      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: userId, recipientId: contactId },
            { senderId: contactId, recipientId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      const unreadCount = await prisma.message.count({
        where: { senderId: contactId, recipientId: userId, read: false },
      });

      return {
        contact,
        lastMessage: lastMessage
          ? { content: lastMessage.content, createdAt: lastMessage.createdAt }
          : null,
        unreadCount,
      };
    }),
  );

  return conversations.sort(
    (a, b) =>
      (b.lastMessage?.createdAt?.getTime() ?? 0) -
      (a.lastMessage?.createdAt?.getTime() ?? 0),
  );
}

export async function getMessages(
  userId: string,
  contactId: string,
  page: number = 1,
  limit: number = 50,
) {
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: contactId },
          { senderId: contactId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        content: true,
        read: true,
        createdAt: true,
        senderId: true,
        recipientId: true,
        sender: { select: { id: true, name: true, avatar: true } },
      },
    }),
    prisma.message.count({
      where: {
        OR: [
          { senderId: userId, recipientId: contactId },
          { senderId: contactId, recipientId: userId },
        ],
      },
    }),
  ]);

  // Mark unread messages from contact as read
  await prisma.message.updateMany({
    where: { senderId: contactId, recipientId: userId, read: false },
    data: { read: true },
  });

  return { messages: messages.reverse(), total };
}

export async function sendMessage(
  senderId: string,
  recipientId: string,
  content: string,
) {
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
  });
  if (!recipient) throw new NotFoundError("User", recipientId);

  return prisma.message.create({
    data: { senderId, recipientId, content },
    select: {
      id: true,
      content: true,
      read: true,
      createdAt: true,
      senderId: true,
      recipientId: true,
      sender: { select: { id: true, name: true, avatar: true } },
    },
  });
}
