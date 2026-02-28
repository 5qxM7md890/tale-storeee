export type Command = {
  name: string;
  description: string;
  category: string;
};

export const categories = [
  'All',
  'Admin',
  'Settings',
  'Roles',
  'Channels',
  'Protection',
  'Chat',
  'Mod',
  'Genral',
  'Owners',
  'Groups',
  'Points',
  'Tickets'
] as const;

export const commands: Command[] = [
  {name: '/ban', description: 'Ban a user from the server.', category: 'Admin'},
  {name: '/kick', description: 'Kick a user from the server.', category: 'Admin'},
  {name: '/unban', description: 'Remove a ban for a user.', category: 'Admin'},

  {name: '/log-channel', description: 'Set a channel for logs.', category: 'Settings'},
  {name: '/welcome', description: 'Configure welcome messages.', category: 'Settings'},
  {name: '/prefix', description: 'Change bot prefix (if supported).', category: 'Settings'},

  {name: '/role-add', description: 'Add a role to a user.', category: 'Roles'},
  {name: '/role-remove', description: 'Remove a role from a user.', category: 'Roles'},
  {name: '/reaction-roles', description: 'Setup reaction roles.', category: 'Roles'},

  {name: '/slowmode', description: 'Set slowmode for a channel.', category: 'Channels'},
  {name: '/lock', description: 'Lock a channel.', category: 'Channels'},
  {name: '/unlock', description: 'Unlock a channel.', category: 'Channels'},

  {name: '/anti-raid', description: 'Toggle anti-raid protection.', category: 'Protection'},
  {name: '/anti-spam', description: 'Toggle anti-spam protection.', category: 'Protection'},
  {name: '/verify', description: 'Enable verification checks.', category: 'Protection'},

  {name: '/clear', description: 'Bulk delete messages.', category: 'Chat'},
  {name: '/announce', description: 'Send an announcement.', category: 'Chat'},
  {name: '/embed', description: 'Send a custom embed message.', category: 'Chat'},

  {name: '/warn', description: 'Warn a user.', category: 'Mod'},
  {name: '/mute', description: 'Mute a user.', category: 'Mod'},
  {name: '/unmute', description: 'Unmute a user.', category: 'Mod'},

  {name: '/ping', description: 'Check bot latency.', category: 'Genral'},
  {name: '/help', description: 'Show help menu.', category: 'Genral'},

  {name: '/owner-panel', description: 'Open owner tools panel.', category: 'Owners'},
  {name: '/backup', description: 'Create a configuration backup.', category: 'Owners'},

  {name: '/group-create', description: 'Create a voice group.', category: 'Groups'},
  {name: '/group-delete', description: 'Delete a voice group.', category: 'Groups'},

  {name: '/points-add', description: 'Add points to a user.', category: 'Points'},
  {name: '/points-top', description: 'Show leaderboard.', category: 'Points'},

  {name: '/ticket-open', description: 'Open a support ticket.', category: 'Tickets'},
  {name: '/ticket-close', description: 'Close a support ticket.', category: 'Tickets'}
];
