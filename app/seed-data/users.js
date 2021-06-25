import faker from 'faker';
import User from '../models/user';
import { getCSVFiles, getContentCSVFiles, cleanField } from './scanDataFile';
import Role from '../models/role';

const Promise = require('bluebird');

faker.locale = 'vi';

export const createDefaultUser = async () => {
  try {
    const generateNumber = await User.countDocuments();

    if (generateNumber > 0) return;

    const userFile = await getCSVFiles('users');

    const { header, content } = await getContentCSVFiles(userFile[0]);

    await Promise.each(content, async (line) => {
      const field = cleanField(line.split(','));

      const roleCode = field[header.indexOf('role')];
      const role = await Role.findOne({ code: roleCode });
      const checkDataExits = await User.findOne({
        code: field[header.indexOf('code')],
      });

      const username = field[header.indexOf('email')];

      if (!checkDataExits) {
        const user = new User({
          _id: field[header.indexOf('_id')],
          username,
          fullName: field[header.indexOf('fullName')],
          email: field[header.indexOf('email')],
          birthDay: field[header.indexOf('birthDay')],
          gender: field[header.indexOf('gender')],
          phone: field[header.indexOf('phone')],
          role,
          publicKey: 'A9VMrb8olmifFj4QVhG63fIJDK1+kkKsdKE3bmm+E9Xx',
          encryptedPrivateKey:
            'U2FsdGVkX19Bw6GSZZsIF4Q96pqg6xxlQFlI91E4b0Vzhnj14SMAziyXim3u6Tq565DaJ6HNv8yFxMgb3WlWbQ==',
        });

        await user.save();

      }
    });

    console.log('Seed User Success');
  } catch (err) {
    throw new Error(err.message);
  }
};
