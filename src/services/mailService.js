import { MailApi } from 'src/api';

const mailService = {
  getEmails: (params = {}) => MailApi.getMails(params),
  searchEmails: (params = {}) => MailApi.searchMails(params),
  getEmailById: (id) => MailApi.getMailById(id),
  sendEmail: (data) => MailApi.sendMail(data),
  saveDraft: (data) => MailApi.saveDraft(data),
  markRead: (id) => MailApi.markRead(id),
  markUnread: (id) => MailApi.markUnread(id),
  star: (id) => MailApi.star(id),
  unstar: (id) => MailApi.unstar(id),
  move: (id, folder) => MailApi.move(id, folder),
  deleteEmail: (id) => MailApi.deleteMail(id),
  bulkRead: (ids) => MailApi.bulkRead(ids),
  bulkUnread: (ids) => MailApi.bulkUnread(ids),
  bulkMove: (ids, folder) => MailApi.bulkMove(ids, folder),
  bulkDelete: (ids) => MailApi.bulkDelete(ids),
  getStats: (email) => MailApi.getStats(email),
  getUnreadCount: (folder, email) => MailApi.getUnreadCount(folder, email),
  getSuggestions: (query, limit) => MailApi.getSuggestions(query, limit),
  uploadAttachment: async (file) => ({
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
  }),
};

export default mailService;
