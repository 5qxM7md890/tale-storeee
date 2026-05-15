'use server';

import {randomUUID} from 'crypto';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {BotInventoryStatus, Prisma, SlotStatus, SubscriptionStatus} from '@prisma/client';
import {prisma} from '@/lib/db';
import {getSession} from '@/lib/auth';
import {seedProducts} from '@/data/seed-products';

type DiscordGuildOption = {
  id: string;
  name: string;
  permissions?: string;
};

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function newId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== 'string') return '';
  return value.trim();
}

function readNullableText(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value || null;
}

function readInteger(formData: FormData, key: string, fallback = 0) {
  const value = readText(formData, key);
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function isDiscordId(value: string | null): value is string {
  if (!value) return false;
  return /^\d{16,22}$/.test(value);
}

function parseSettingsMeta(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function buildRoute(path: string, params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function getDetailPath(locale: string, botId: string) {
  return `/${locale}/my-bots/${botId}`;
}

function getSetupPath(locale: string, botId: string) {
  return `/${locale}/my-bots/${botId}/setup`;
}

function hasManageGuildPermission(permissions?: string | null) {
  try {
    const value = BigInt(permissions ?? '0');
    return (value & 0x8n) === 0x8n || (value & 0x20n) === 0x20n;
  } catch {
    return true;
  }
}

async function getUserGuildOptions(userId: string): Promise<DiscordGuildOption[]> {
  const currentSession = await prisma.session.findFirst({
    where: {userId},
    orderBy: {createdAt: 'desc'}
  });

  if (!currentSession?.discordAccessToken || !currentSession.discordTokenType) {
    return [];
  }

  try {
    const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `${currentSession.discordTokenType} ${currentSession.discordAccessToken}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('getUserGuildOptions failed', {
        userId,
        status: response.status,
        statusText: response.statusText
      });
      return [];
    }

    const guilds = (await response.json()) as Array<DiscordGuildOption>;
    return guilds
      .filter((guild) => hasManageGuildPermission(guild.permissions))
      .map((guild) => ({
        id: guild.id,
        name: guild.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('getUserGuildOptions exception', {userId, error});
    return [];
  }
}

function getPublicMutationErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return 'A bot of this type is already linked to the selected server. Only one bot of each type is allowed per server.';
    }
    if (error.code === 'P2025') {
      return 'A required bot, setup, or binding record could not be found while saving.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message.slice(0, 220);
  }

  return fallbackMessage;
}


async function readImageValue(
  formData: FormData,
  existingMeta: Record<string, unknown>,
  options: {
    urlKey: string;
    fileKey: string;
    existingKey: string;
    label: string;
  }
): Promise<{value: string | null; error: string | null}> {
  const uploaded = formData.get(options.fileKey);
  const imageUrl = readNullableText(formData, options.urlKey);
  const keepExisting =
    typeof existingMeta[options.existingKey] === 'string'
      ? (existingMeta[options.existingKey] as string)
      : null;

  if (uploaded instanceof File && uploaded.size > 0) {
    if (!uploaded.type.startsWith('image/')) {
      return {value: null, error: `${options.label} must be a valid image file.`};
    }

    if (uploaded.size > 2 * 1024 * 1024) {
      return {value: null, error: `${options.label} must be 2 MB or smaller.`};
    }

    const bytes = Buffer.from(await uploaded.arrayBuffer());
    return {
      value: `data:${uploaded.type};base64,${bytes.toString('base64')}`,
      error: null
    };
  }

  if (imageUrl) {
    try {
      const parsed = new URL(imageUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      return {value: imageUrl, error: null};
    } catch {
      return {value: null, error: `${options.label} URL must be a valid http or https URL.`};
    }
  }

  return {value: keepExisting, error: null};
}

export async function addTestBotAction(formData: FormData) {
  const localeValue = formData.get('locale');
  const locale = typeof localeValue === 'string' && localeValue ? localeValue : 'en';

  const session = await getSession();
  if (!session) {
    redirect(`/api/auth/discord/login?next=/${locale}/my-bots`);
  }

  const seed = seedProducts.find((product) => product.slug === 'temp-voice') || seedProducts[0];
  if (!seed) {
    throw new Error('No seed product is available for the dev bot flow.');
  }

  const monthly = seed.pricing.find((option) => option.periodMonths === 1) || seed.pricing[0];
  if (!monthly) {
    throw new Error('No seed pricing option is available for the dev bot flow.');
  }

  const now = new Date();
  const refBase = `dev_${session.userId}_${Date.now()}`;

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.upsert({
      where: {slug: seed.slug},
      update: {
        name: seed.name,
        description: seed.description ?? null
      },
      create: {
        slug: seed.slug,
        name: seed.name,
        description: seed.description ?? null
      }
    });

    const pricingOption = await tx.pricingOption.upsert({
      where: {
        productId_periodMonths: {
          productId: product.id,
          periodMonths: monthly.periodMonths
        }
      },
      update: {
        unitMonthlyCents: monthly.unitMonthlyCents
      },
      create: {
        productId: product.id,
        periodMonths: monthly.periodMonths,
        unitMonthlyCents: monthly.unitMonthlyCents
      }
    });

    const lineItems: Prisma.InputJsonValue = [
      {
        productId: product.id,
        pricingOptionId: pricingOption.id,
        productName: product.name,
        periodMonths: pricingOption.periodMonths,
        qty: 1,
        unitMonthlyMinor: pricingOption.unitMonthlyCents
      }
    ];

    const availableInventory = await tx.botInventory.findFirst({
      where: {
        status: BotInventoryStatus.AVAILABLE
      },
      orderBy: {createdAt: 'asc'}
    });

    if (!availableInventory) {
      return {ok: false as const, reason: 'no_inventory'};
    }

    const reservedInventory = await tx.botInventory.update({
      where: {id: availableInventory.id},
      data: {
        status: BotInventoryStatus.RESERVED,
        assignedUserId: session.userId,
        updatedAt: now
      }
    });

    const order = await tx.order.create({
      data: {
        id: newId('order'),
        userId: session.userId,
        provider: 'DEV',
        status: 'PAID',
        currency: 'SAR',
        subtotalMinor: pricingOption.unitMonthlyCents * pricingOption.periodMonths,
        discountMinor: 0,
        totalMinor: pricingOption.unitMonthlyCents * pricingOption.periodMonths,
        couponCode: null,
        merchantReferenceId: `${refBase}_order`,
        selectedGuildId: null,
        billingAddress: Prisma.DbNull,
        lineItems,
        providerPayload: {
          source: 'dev_manual_bot_flow',
          createdBy: 'addTestBotAction'
        } as Prisma.InputJsonValue,
        fulfilledAt: null,
        updatedAt: now
      } satisfies Prisma.OrderUncheckedCreateInput
    });

    const subscription = await tx.subscription.create({
      data: {
        userId: session.userId,
        stripeSubscriptionId: `${refBase}_sub`,
        stripeCustomerId: `dev_customer_${session.userId}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: addMonths(now, pricingOption.periodMonths),
        provider: 'DEV',
        providerSubscriptionId: null,
        billingCycle: `${pricingOption.periodMonths}m`,
        nextBillingAt: addMonths(now, pricingOption.periodMonths),
        endsAt: null,
        merchantReferenceId: order.merchantReferenceId,
        orderId: order.id
      } satisfies Prisma.SubscriptionUncheckedCreateInput
    });

    const subscriptionItem = await tx.subscriptionItem.create({
      data: {
        subscriptionId: subscription.id,
        productId: product.id,
        pricingOptionId: pricingOption.id,
        qtySlots: 1,
        stripeSubscriptionItemId: `${refBase}_item`
      } satisfies Prisma.SubscriptionItemUncheckedCreateInput
    });

    const subscriptionSlot = await tx.subscriptionSlot.create({
      data: {
        subscriptionItemId: subscriptionItem.id,
        slotNo: 1,
        guildId: null,
        status: SlotStatus.UNASSIGNED
      } satisfies Prisma.SubscriptionSlotUncheckedCreateInput
    });

    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${reservedInventory.clientId}&permissions=8&scope=bot%20applications.commands`;

    const botInstance = await tx.botInstance.create({
      data: {
        userId: session.userId,
        orderId: order.id,
        subscriptionId: subscription.id,
        subscriptionItemId: subscriptionItem.id,
        subscriptionSlotId: subscriptionSlot.id,
        inventoryId: reservedInventory.id,
        productId: product.id,
        pricingOptionId: pricingOption.id,
        status: 'RESERVED',
        displayName: reservedInventory.defaultName || product.name,
        clientId: reservedInventory.clientId,
        guildId: null,
        inviteUrl,
        provisionedAt: null,
        activatedAt: null
      } satisfies Prisma.BotInstanceUncheckedCreateInput
    });

    await tx.botSetting.create({
      data: {
        id: newId('botsetting'),
        botInstanceId: botInstance.id,
        mode: 'VOICE',
        createChannel: null,
        panelChannel: null,
        tempCategory: null,
        logsChannel: null,
        defaultUserLimit: 0,
        language: locale === 'ar' ? 'ar' : 'en',
        permissions: Prisma.DbNull,
        updatedAt: now
      } satisfies Prisma.BotSettingUncheckedCreateInput
    });

    return {ok: true as const, botId: botInstance.id};
  });

  revalidatePath(`/${locale}/my-bots`);

  if (!result.ok) {
    redirect(buildRoute(`/${locale}/my-bots`, {
      status: 'no_inventory',
      message: 'No bot inventory is available right now. Please add an AVAILABLE bot first.'
    }));
  }

  redirect(buildRoute(`/${locale}/my-bots`, {
    status: 'created',
    message: 'Test bot created from the current inventory pool.'
  }));
}

export async function bindBotToSelectedServerAction(formData: FormData) {
  const locale = readText(formData, 'locale') || 'en';
  const botId = readText(formData, 'botId');
  const returnTab = readText(formData, 'returnTab') || 'general';

  const session = await getSession();
  if (!session) {
    redirect(`/api/auth/discord/login?next=${encodeURIComponent(getDetailPath(locale, botId))}`);
  }

  const detailPath = getDetailPath(locale, botId);
  const selectedGuildIdFromForm = readNullableText(formData, 'selectedGuildId');

  if (!isDiscordId(selectedGuildIdFromForm)) {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      bind: 'missing_server',
      message: 'No selected server found for this bot. Please choose a server in this bot page first.'
    }));
  }

  const selectedGuildId: string = selectedGuildIdFromForm;

  const accessibleGuilds = await getUserGuildOptions(session.userId);
  if (accessibleGuilds.length > 0 && !accessibleGuilds.some((guild) => guild.id === selectedGuildId)) {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      bind: 'error',
      message: 'The selected server is not available on your current Discord session.'
    }));
  }

  const bot = await prisma.botInstance.findFirst({
    where: {
      id: botId,
      userId: session.userId
    },
    include: {
      Product: true,
      GuildBinding: true
    }
  });

  if (!bot) {
    redirect(buildRoute(`/${locale}/my-bots`, {status: 'bot_not_found'}));
  }

  const now = new Date();
  let failureMessage: string | null = null;

  try {
    await prisma.$transaction(async (tx) => {
      const conflictingBinding = await tx.guildBinding.findFirst({
        where: {
          guildId: selectedGuildId,
          productId: bot.productId,
          NOT: {botInstanceId: bot.id}
        },
        include: {
          Product: true
        }
      });

      if (conflictingBinding) {
        throw new Error(
          `A ${conflictingBinding.Product?.name || 'bot of this type'} is already linked to this server. Only one bot of each type is allowed per server.`
        );
      }

      if (bot.GuildBinding) {
        await tx.guildBinding.update({
          where: {botInstanceId: bot.id},
          data: {
            userId: session.userId,
            productId: bot.productId,
            guildId: selectedGuildId,
            updatedAt: now
          }
        });
      } else {
        await tx.guildBinding.create({
          data: {
            id: newId('guildbinding'),
            botInstanceId: bot.id,
            userId: session.userId,
            productId: bot.productId,
            guildId: selectedGuildId,
            updatedAt: now
          } satisfies Prisma.GuildBindingUncheckedCreateInput
        });
      }

      await tx.botInstance.update({
        where: {id: bot.id},
        data: {
          guildId: selectedGuildId
        }
      });

      if (bot.subscriptionSlotId) {
        await tx.subscriptionSlot.update({
          where: {id: bot.subscriptionSlotId},
          data: {
            guildId: selectedGuildId,
            status: SlotStatus.ASSIGNED
          }
        });
      }
    });
  } catch (error) {
    failureMessage = getPublicMutationErrorMessage(
      error,
      'The bot could not be bound to the selected server right now.'
    );

    console.error('bindBotToSelectedServerAction failed', {
      botId,
      userId: session.userId,
      selectedGuildId,
      message: failureMessage,
      error
    });
  }

  if (failureMessage) {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      bind: 'error',
      message: failureMessage
    }));
  }

  revalidatePath(`/${locale}/my-bots`);
  revalidatePath(detailPath);
  redirect(buildRoute(detailPath, {
    tab: returnTab,
    bind: 'success',
    message: 'The bot was bound to the selected server successfully.'
  }));
}


export async function saveBotSetupAction(formData: FormData) {
  const locale = readText(formData, 'locale') || 'en';
  const botId = readText(formData, 'botId');
  const returnTab = readText(formData, 'returnTab') || 'general';

  const session = await getSession();
  if (!session) {
    redirect(`/api/auth/discord/login?next=${encodeURIComponent(getDetailPath(locale, botId))}`);
  }

  const detailPath = getDetailPath(locale, botId);

  const bot = await prisma.botInstance.findFirst({
    where: {
      id: botId,
      userId: session.userId
    },
    include: {
      BotSetting: true
    }
  });

  if (!bot) {
    redirect(`/${locale}/my-bots`);
  }

  const mode = readText(formData, 'mode') || 'VOICE';
  const language = readText(formData, 'language') || bot.BotSetting?.language || 'en';
  const createChannel = readNullableText(formData, 'createChannel');
  const tempCategory = readNullableText(formData, 'tempCategory');
  const panelChannel = readNullableText(formData, 'panelChannel');
  const logsChannel = readNullableText(formData, 'logsChannel');
  const defaultUserLimit = readInteger(formData, 'defaultUserLimit', 0);

  if (mode !== 'VOICE') {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      save: 'error',
      message: 'Only VOICE mode is supported by the current runtime.'
    }));
  }

  if (!isDiscordId(createChannel) || !isDiscordId(tempCategory) || !isDiscordId(panelChannel) || !isDiscordId(logsChannel)) {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      save: 'error',
      message: 'Create Channel, Temp Category, Panel Channel, and Logs Channel must all be valid Discord IDs.'
    }));
  }

  if (!Number.isFinite(defaultUserLimit) || defaultUserLimit < 0) {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      save: 'error',
      message: 'Default user limit must be a valid number that is zero or higher.'
    }));
  }

  const existingMeta = parseSettingsMeta(bot.BotSetting?.permissions ?? null);
  const panelImageUrl = typeof existingMeta.panelImageUrl === 'string' ? existingMeta.panelImageUrl : null;
  const statusText = typeof existingMeta.statusText === 'string' ? existingMeta.statusText : null;
  const activityType = typeof existingMeta.activityType === 'string' ? existingMeta.activityType : null;

  const nextMeta: Record<string, unknown> = {};
  if (panelImageUrl) nextMeta.panelImageUrl = panelImageUrl;
  if (statusText) nextMeta.statusText = statusText;
  if (activityType) nextMeta.activityType = activityType;

  const permissionsValue: Prisma.InputJsonValue | typeof Prisma.DbNull =
    Object.keys(nextMeta).length > 0 ? (nextMeta as Prisma.InputJsonValue) : Prisma.DbNull;

  const settingData = {
    mode,
    language,
    createChannel,
    tempCategory,
    panelChannel,
    logsChannel,
    defaultUserLimit,
    permissions: permissionsValue,
    updatedAt: new Date()
  };

  let failureMessage: string | null = null;

  try {
    if (bot.BotSetting) {
      await prisma.botSetting.update({
        where: {id: bot.BotSetting.id},
        data: settingData
      });
    } else {
      await prisma.botSetting.create({
        data: {
          id: newId('botsetting'),
          botInstanceId: bot.id,
          ...settingData
        } satisfies Prisma.BotSettingUncheckedCreateInput
      });
    }
  } catch (error) {
    failureMessage = getPublicMutationErrorMessage(
      error,
      'Could not save setup right now. Please try again.'
    );
    console.error('saveBotSetupAction failed', {botId, userId: session.userId, error, message: failureMessage});
  }

  if (failureMessage) {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      save: 'error',
      message: failureMessage
    }));
  }

  revalidatePath(`/${locale}/my-bots`);
  revalidatePath(detailPath);
  revalidatePath(getSetupPath(locale, botId));
  redirect(buildRoute(detailPath, {
    tab: returnTab,
    save: 'saved',
    message: 'The bot setup was updated successfully.'
  }));
}


export async function saveBotAppearanceAction(formData: FormData) {
  const locale = readText(formData, 'locale') || 'en';
  const botId = readText(formData, 'botId');
  const returnTab = readText(formData, 'returnTab') || 'customize';

  const session = await getSession();
  if (!session) {
    redirect(`/api/auth/discord/login?next=${encodeURIComponent(getDetailPath(locale, botId))}`);
  }

  const detailPath = getDetailPath(locale, botId);

  const bot = await prisma.botInstance.findFirst({
    where: {
      id: botId,
      userId: session.userId
    },
    include: {
      BotSetting: true,
      Product: true
    }
  });

  if (!bot) {
    redirect(`/${locale}/my-bots`);
  }

  const displayName = readText(formData, 'displayName') || bot.displayName || bot.Product?.name || 'Bot';
  const statusText = readNullableText(formData, 'statusText');
  const activityType = readText(formData, 'activityType') || 'PLAYING';

  if (displayName.length < 2 || displayName.length > 64) {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      appearance: 'error',
      message: 'Display name must be between 2 and 64 characters.'
    }));
  }

  if (statusText && statusText.length > 128) {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      appearance: 'error',
      message: 'Status text must be 128 characters or fewer.'
    }));
  }

  const validActivityTypes = ['PLAYING', 'LISTENING', 'WATCHING', 'COMPETING', 'STREAMING'];
  if (!validActivityTypes.includes(activityType)) {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      appearance: 'error',
      message: 'Activity type is invalid.'
    }));
  }

  const existingMeta = parseSettingsMeta(bot.BotSetting?.permissions ?? null);
  const avatarImage = await readImageValue(formData, existingMeta, {
    urlKey: 'avatarImageUrl',
    fileKey: 'avatarImageFile',
    existingKey: 'avatarImageUrl',
    label: 'Avatar image'
  });
  const bannerImage = await readImageValue(formData, existingMeta, {
    urlKey: 'bannerImageUrl',
    fileKey: 'bannerImageFile',
    existingKey: 'bannerImageUrl',
    label: 'Banner image'
  });
  const panelImage = await readImageValue(formData, existingMeta, {
    urlKey: 'panelImageUrl',
    fileKey: 'panelImageFile',
    existingKey: 'panelImageUrl',
    label: 'Panel image'
  });

  const imageError = avatarImage.error || bannerImage.error || panelImage.error;
  if (imageError) {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      appearance: 'error',
      message: imageError
    }));
  }

  const nextMeta: Record<string, unknown> = {...existingMeta};

  if (avatarImage.value) {
    nextMeta.avatarImageUrl = avatarImage.value;
  } else {
    delete nextMeta.avatarImageUrl;
  }

  if (bannerImage.value) {
    nextMeta.bannerImageUrl = bannerImage.value;
  } else {
    delete nextMeta.bannerImageUrl;
  }

  if (panelImage.value) {
    nextMeta.panelImageUrl = panelImage.value;
  } else {
    delete nextMeta.panelImageUrl;
  }

  if (statusText) {
    nextMeta.statusText = statusText;
  } else {
    delete nextMeta.statusText;
  }

  nextMeta.activityType = activityType;

  const permissionsValue: Prisma.InputJsonValue | typeof Prisma.DbNull =
    Object.keys(nextMeta).length > 0 ? (nextMeta as Prisma.InputJsonValue) : Prisma.DbNull;

  const now = new Date();
  let failureMessage: string | null = null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.botInstance.update({
        where: {id: bot.id},
        data: {
          displayName
        }
      });

      if (bot.BotSetting) {
        await tx.botSetting.update({
          where: {id: bot.BotSetting.id},
          data: {
            permissions: permissionsValue,
            updatedAt: now
          }
        });
      } else {
        await tx.botSetting.create({
          data: {
            id: newId('botsetting'),
            botInstanceId: bot.id,
            mode: 'VOICE',
            createChannel: null,
            tempCategory: null,
            panelChannel: null,
            logsChannel: null,
            defaultUserLimit: 0,
            language: 'en',
            permissions: permissionsValue,
            updatedAt: now
          } satisfies Prisma.BotSettingUncheckedCreateInput
        });
      }
    });
  } catch (error) {
    failureMessage = getPublicMutationErrorMessage(
      error,
      'Could not save appearance settings right now.'
    );
    console.error('saveBotAppearanceAction failed', {botId, userId: session.userId, error, message: failureMessage});
  }

  if (failureMessage) {
    redirect(buildRoute(detailPath, {
      tab: returnTab,
      appearance: 'error',
      message: failureMessage
    }));
  }

  revalidatePath(`/${locale}/my-bots`);
  revalidatePath(detailPath);
  redirect(buildRoute(detailPath, {
    tab: returnTab,
    appearance: 'saved',
    message: 'Appearance settings were updated successfully.'
  }));
}
