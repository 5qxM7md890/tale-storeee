export const PERM_ADMINISTRATOR = 0x8n;
export const PERM_MANAGE_GUILD = 0x20n;

export function hasAdminPerm(permissions: string | number | bigint) {
  const p = typeof permissions === 'bigint'
    ? permissions
    : BigInt(typeof permissions === 'number' ? permissions : permissions || '0');
  return (p & PERM_ADMINISTRATOR) !== 0n || (p & PERM_MANAGE_GUILD) !== 0n;
}
