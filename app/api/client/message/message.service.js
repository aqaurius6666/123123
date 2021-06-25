const Conservation = require('../../../models/conservation');
const User = require('../../../models/user');
const Message = require('../../../models/message');
const NewMessage = require('../../../models/new_message');

const { isValidString } = require('../../../utils/validate-utils');

const validateMessage = async (body) => {
  const { content, type, conservationId, senderId, sendAt } = body;

  const conservation = await Conservation.findById(conservationId).lean();
  if (!conservation) throw new Error('400.MESSAGE.POST.CONSERVATION_NOT_FOUND');

  const sender = await User.findById(senderId).lean();
  if (!sender) await new Error('400.MESSAGE.POST.SENDER_NOT_FOUND');

  if (!isValidString(content))
    throw new Error('400.MESSAGE.POST.CONTENT_INVALID');

  if (!isValidString(type)) throw new Error('400.MESSAGE.POST.TYPE_INVALID');

  return { content, type, conservationId, senderId, sendAt };
};

const createMessage = async (body) => {

  const { content, type, conservationId, senderId, sendAt } =
    await validateMessage(body);

  const message = new Message({
    content,
    type,
    conservationId,
    senderId,
    sendAt,
  });

  return message.save();
};

const validateSeenMessage = async (body) => {
  const { conservationId, userId } = body;

  const conservation = await NewMessage.findOne({
    conservation: conservationId,
    user: userId,
  }).lean();
  if (!conservation) throw new Error('400.MESSAGE.POST.CONSERVATION_NOT_FOUND');

  return { conservationId, userId };
};

const clearNewMessage = async (body) => {
  
  const { conservationId, userId } = await validateSeenMessage(body);

  return NewMessage.remove({ conservation: conservationId, user: userId });
};
const shouldSendTelegram = async ({}) => {};
module.exports = {
  validateMessage,
  validateSeenMessage,
  createMessage,
  clearNewMessage,
};
