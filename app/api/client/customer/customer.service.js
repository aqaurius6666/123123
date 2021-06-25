import Customer from '../../../models/customer';
import Episode from '../../../models/episode';
import Serie from '../../../models/serie';
import Cart from '../../../models/cart';
import Creator from '../../../models/creator';
import Edition from '../../../models/edition';
import User from '../../../models/user';
import EpisodeService from '../episodes/episodes.service';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import Code from '../../../models/code';
import { sendEmail } from '../../../utils/sendEmail/sendEmail.service';
import {
  SymmetricDecrypt,
  SymmetricEncrypt,
} from '../../../utils/crypto-utils';
import { uuid } from 'uuidv4';
import { sendEmailv2 } from '../../../utils/sendEmail/send-email-v2';
import { SYMETRIC_SECRET } from '../../../environment';

const _generate2FASignature = ({ data, key }) => {
  if (!data.isVerified) return { isVerified: false };

  return {
    signature: SymmetricEncrypt(
      JSON.stringify({
        isVerified: true,
        userId: data.userId,
        createdTime: new Date().getTime(),
      }),
      key
    ),
    isVerified: true,
  };
};

const getByUserId = async ({ user }) => {
  const existingCustomer = await Customer.findOne({
    user,
  }).populate('user');
  if (!existingCustomer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  return existingCustomer.toJSON();
};

const getAll = async () => {
  const customers = await Customer.find({}).populate('user');

  if (!Array.isArray(customers)) {
    throw new Error('CUSTOMERS.NOT_FOUND');
  }

  return customers.map((customer) => customer.toJSON());
};
const clearCart = async ({ user }) => {
  const cart = await Cart.findOne({ user, isShopping: true });
  const items = await Promise.all(
    cart.cartItems.map(async (i) => {
      const e = await Episode.findById(i.episode).lean();
      return {
        _id : i._id,
        quantity: i.quantity,
        episode: i.episode,
        price: e.price,
      };
    })
  );
  // cart.cartItems = items
  // cart.isShopping = false
  // return cart.save()
  return Cart.findOneAndUpdate(
    { user, isShopping: true },
    { $set: { isShopping: false, cartItems: items } },
    { new: true, useFindAndModify: false }
  );
};

const updateMutipleItemInCart = async ({ user, cartInfo }) => {
	const customer = await Customer.findOne({
		user,
	}).populate('carts');

	if (!customer) {
		throw new Error('CUSTOMER.NOT_FOUND');
	}

	const { carts } = customer;

	const existingCartID = carts.find((e) => e.isShopping);

	if (!Array.isArray(cartInfo)) throw new Error('CART.INVALID');

	const vCartInfo = cartInfo.filter(({ episodeId, quantity }) => {
		return episodeId && Number.isInteger(quantity) && quantity > 0;
	});

	const creators = await Creator.find({}, { user: 1 }).lean();

	const cartItems = await Promise.all(
		vCartInfo.map(async ({ episodeId, quantity }) => {
			const existingProduct = await Episode.findOne({ _id: episodeId });

			if (!existingProduct) {
				throw new Error('EPISODE.NOT_FOUND');
			}

			if (!Number.isInteger(quantity) || quantity < 0) {
				throw new Error('QUANTITY.NOT_POSITIVE_INTERGER');
			}

			const maxNumberCanBuy = await Edition.countDocuments({
				episode: episodeId,
				owner: { $in: creators.map((e) => e.user) },
				status: 'public',
			});

			if (quantity > maxNumberCanBuy)
				throw new Error('CART.EXCEED_ITEM_QUANTITY');

			return { episode: episodeId, quantity };
		})
	);

	if (
		!carts ||
		!Array.isArray(carts) ||
		carts.length === 0 ||
		!existingCartID
	) {
		const newCart = new Cart({
			user: customer._id,
			cartItems,
		});

		const savedCart = await newCart.save();

		await Customer.findOneAndUpdate(
			{ _id: customer._id },
			{ $push: { carts: savedCart._id } },
			{ new: true }
		);

		return Cart.findOne({
			_id: savedCart,
			user: customer._id,
			isShopping: true,
		});
	} else {
		const existingCartInfo = await Cart.findOne({
			user: customer._id,
			isShopping: true,
			_id: existingCartID,
		});

		if (!existingCartInfo) throw new Error('CART.INVALID');

		return Cart.findOneAndUpdate(
			{
				user: customer._id,
				isShopping: true,
				_id: existingCartID,
			},
			{
				$set: {
					cartItems,
				},
			},
			{ new: true }
		);
	}
};

const updateCartv2 = async ({ user, episodeId, quantity }) => {
	const existingProduct = await Episode.findOne({ _id: episodeId });

	if (!existingProduct) {
		throw new Error('EPISODE.NOT_FOUND');
	}

	const customer = await Customer.findOne({
		user,
	}).populate('carts');

	if (!customer) {
		throw new Error('CUSTOMER.NOT_FOUND');
	}

	if (!Number.isInteger(quantity) || quantity < 0) {
		throw new Error('QUANTITY.NOT_POSITIVE_INTERGER');
	}

	const { carts } = customer;

	const existingCartID = carts.find((e) => e.isShopping);

	if (
		!carts ||
		!Array.isArray(carts) ||
		carts.length === 0 ||
		!existingCartID
	) {
		const newCart = new Cart({
			user: customer._id,
			cartItems: [{ episode: episodeId, quantity }],
		});

		const savedCart = await newCart.save();

		await Customer.findOneAndUpdate(
			{ _id: customer._id },
			{ $push: { carts: savedCart._id } },
			{ new: true }
		);

		return Cart.findOne({
			user: customer._id,
			isShopping: true,
		});
	} else {
		const existingCartInfo = await Cart.findOne({
			user: customer._id,
			isShopping: true,
			_id: existingCartID,
		});

		if (!existingCartInfo) throw new Error('CART.INVALID');

		const { cartItems } = existingCartInfo;

		let newCartItems = cartItems;

		if (cartItems.map((e) => e.episode).indexOf(episodeId) === -1) {
			newCartItems.push({
				episode: episodeId,
				quantity,
			});
		} else {
			const existingItemIndex = cartItems
				.map((e) => e.episode)
				.findIndex((e) => e.toString() === episodeId);

			const creators = await Creator.find({}, { user: 1 }).lean();

			const maxNumberCanBuy = await Edition.countDocuments({
				episode: episodeId,
				owner: { $in: creators.map((e) => e.user) },
				status: 'public',
			});

			const numberEditionToBuy = quantity;

			cartItems[existingItemIndex] = {
				episode: episodeId,
				quantity:
					numberEditionToBuy > maxNumberCanBuy
						? maxNumberCanBuy
						: numberEditionToBuy,
			};

			newCartItems = cartItems;
		}

		newCartItems = newCartItems.filter((e) => e.quantity > 0);

		return Cart.findOneAndUpdate(
			{
				user: customer._id,
				isShopping: true,
				_id: existingCartID,
			},
			{
				$set: {
					cartItems: newCartItems,
				},
			},
			{ new: true }
		);
	}
};

const updateCart = async ({ user, episodeId, quantity }) => {
  const existingProduct = await Episode.findOne({ _id: episodeId });
  if (!existingProduct) {
    throw new Error('EPISODE.NOT_FOUND');
  }
  const customer = await Customer.findOne({
    user,
  }).populate('carts');
  if (!customer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error('QUANTITY.NOT_POSITIVE_INTERGER');
  }

  const cart = await getCart({ user });

  const items = cart.cartItems;
  const index = items.map((item) => item.episode).indexOf(episodeId);
  let nItems = items;
  if (index === -1) {
    nItems = [...items, { quantity, episode: episodeId }];
  } else {
    if (quantity === 0) nItems.pop(index);
    else nItems[index] = { quantity, episode: episodeId };
  }

  return Cart.findOneAndUpdate(
    { _id: cart._id },
    { cartItems: nItems },
    { new: true, useFindAndModify: false }
  );
};

const getCart = async ({ user }) => {
  const customer = await Customer.findOne({ user });
  if (!customer) throw new Error('CUSTOMER.NOT_FOUND');

  const cart = await Cart.findOne({ user: customer._id, isShopping: true });
  if (cart) return cart;

  const nCart = new Cart({
    user: customer._id,
    isShopping: true,
    cartItems: [],
  });
  const sCart = await nCart.save();
  await Customer.findOneAndUpdate(
    { _id: customer._id },
    { $push: { carts: sCart._id } },
    { useFindAndModify: false }
  );
  return sCart;
};

const getBookshelf = async ({ customerId, serieId, creatorId }) => {
  const existingCustomer = await Customer.findOne({
    user: customerId,
  })
    .populate('bookshelf')
    .lean();

  if (!existingCustomer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  if (!serieId)
    return Promise.all(
      existingCustomer.bookshelf.map(async (episode) => {
        const numberOfCopy = await Edition.countDocuments({
          episode: episode._id,
          owner: customerId,
        });

        const episodeInfo = await EpisodeService.getByEpisodeId({
          userId: customerId,
          episodeId: episode._id,
          inPrivate: true,
        });

        return { ...episodeInfo, numberOfCopy };
      })
    );

  const existingSerie = await Serie.findOne({ _id: serieId });

  if (!existingSerie || existingSerie.createdBy.toString() !== creatorId) {
    throw new Error('SERIE.NOT_FOUND');
  }

  const episodes = existingCustomer.bookshelf.filter(
    (e) => e.serie.toString() === serieId
  );

  return Promise.all(
    episodes.map(async (episode) => {
      const numberOfCopy = await Edition.countDocuments({
        episode: episode._id,
        owner: customerId,
      });

      const episodeInfo = await EpisodeService.getByEpisodeId({
        userId: customerId,
        episodeId: episode._id,
        inPrivate: true,
      });

      return { ...episodeInfo, numberOfCopy };
    })
  );
};
const updateBookshelfTransfer = async ({ user, episodes }) => {
  await Customer.findOneAndUpdate(
    {
      user,
    },
    {
      $push: {
        bookshelf: { $each: episodes },
      },
    },
    { useFindAndModify: false }
  );
};

const updateBookshelf = async ({ user, episodeId }) => {
  const existingEpisode = await Episode.findOne({ _id: episodeId });

  if (!existingEpisode) {
    throw new Error('EPISODE.NOT_FOUND');
  }

  const existingCustomer = await Customer.findOne({
    user,
  }).populate('bookshelf');

  if (!existingCustomer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }
  const bookshelf = existingCustomer.bookshelf;

  if (existingEpisode.price == 0) {
    if (Array.isArray(bookshelf)) {
      const episode = bookshelf.find((episode) => episode._id == episodeId);
      if (!episode) {
        const customer = await Customer.findOneAndUpdate(
          { _id: existingCustomer._id },
          { $push: { bookshelf: episodeId } },
          { new: true, useFindAndModify: false }
        ).populate('bookshelf');
        return customer.bookshelf;
      }
      return bookshelf;
    }
  } else {
    return bookshelf;
  }
};

const checkUsernameAvailable = async ({ username }) => {
  if (!username) return false;

  const existingUsername = await Customer.countDocuments({
    displayName: username,
  });

  return existingUsername === 0;
};

const editCustomerPw = async ({
  currentPassword,
  publicKey,
  newPassword,
  encryptedPrivateKey,
  userInfo,
}) => {
  if (!currentPassword || !publicKey || !publicKey) {
    throw new Error('CUSTOMER.SET_PASSWORD.FAILED');
  }

  const _checkStrongPassword = (pw) => {
    if (/ +/gim.test(pw)) return false;

    if (!pw || pw.length < 8) return false;

    return (
      /(.*[a-z].*)/gm.test(pw) &&
      /(.*[A-Z].*)/gm.test(pw) &&
      /(.*\d.*)/gm.test(pw)
    );
  };

  if (!_checkStrongPassword(newPassword)) {
    throw new Error('CUSTOMER.PASSWORD.NOT_STRONG');
  }

  const customer = await Customer.findOne({
    user: userInfo._id,
  }).populate('user');

  if (!customer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  const _isMatchCurrentPassword = (pw, encryptedPrivateKey) => {
    const privateKey = SymmetricDecrypt(encryptedPrivateKey, pw);

    return typeof privateKey === 'string' && privateKey.length > 0;
  };

  if (
    !_isMatchCurrentPassword(currentPassword, customer.user.encryptedPrivateKey)
  ) {
    throw new Error('CUSTOMER.PASSWORD.NOT_MATCH');
  }

  if (!_isMatchCurrentPassword(newPassword, encryptedPrivateKey)) {
    throw new Error('CUSTOMER.KEY.NOT_VALID');
  }

  return User.findOneAndUpdate(
    {
      _id: userInfo._id,
    },
    {
      $set: {
        publicKey,
        encryptedPrivateKey,
      },
    },
    { useFindAndModify: false }
  );
};

const editCustomerName = async ({ username, userInfo }) => {
  if (!username || username.length > 20) {
    throw new Error('CUSTOMER.EDIT_USER_NAME.INVALID');
  }

  const customer = await Customer.findOne({
    user: userInfo._id,
  });

  if (!customer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  const { ok } = await Customer.updateOne(
    {
      user: userInfo._id,
    },
    {
      $set: {
        displayName: username,
      },
    }
  );

  if (ok !== 1) {
    throw new Error('CUSTOMER.EDIT_USER_NAME.FAILED');
  }

  return Customer.findOne({ user: userInfo._id });
};

const getCustomerProfile = async ({ userInfo }) => {
  const customer = await Customer.findOne({
    user: userInfo._id,
  })
    .populate('user')
    .lean();

  if (!customer) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  if (!customer.user) {
    throw new Error('CUSTOMER.NOT_FOUND');
  }

  const isEnabled2FA =
    typeof customer.user.token2FA === 'string' &&
    customer.user.token2FA.length > 0;

  return {
    ...customer,
    email: customer.user.email,
    isEnabled2FA,
    isVerifyEmail: customer.user.isVerifyEmail,
    user: undefined,
  };
};

const generateQRImage = async ({ userInfo }) => {
  const user = await User.findOne({ _id: userInfo._id });

  if (!user) {
    throw new Error('USER.NOT_FOUND');
  }

  if (user.token2FA) {
    throw new Error('USER.QR_CODE_ALREADY_ENABLE');
  }

  const existing2FACode = await Code.findOne({
    user: user._id,
    type: 'qr-authentication',
  });

  if (!existing2FACode) {
    throw new Error('CODE.NOT_SEND');
  }

  if (!existing2FACode.isVerified) {
    throw new Error('CODE.NOT_VERIFIED');
  }

  const secret = speakeasy.generateSecret({ length: 10, name: 'AriumKey' });

  const qrImage = await QRCode.toDataURL(secret.otpauth_url);

  return { qrImage, secret: secret.base32 };
};

const confirm2FA = async ({ userInfo, otp: token, secret }) => {
	if (!token || !secret) {
		throw new Error('CUSTOMER.CONFIRM_QR_FAILED');
	}

  const user = await User.findOne({ _id: userInfo._id });

  if (!user) {
    throw new Error('USER.NOT_FOUND');
  }

  if (user.token2FA) {
    throw new Error('USER.QR_CODE_ALREADY_ENABLE');
  }

  const existing2FACode = await Code.findOne({
    user: user._id,
    type: 'qr-authentication',
  });

  if (!existing2FACode) {
    throw new Error('CODE.NOT_SEND');
  }

  if (!existing2FACode.isVerified) {
    throw new Error('CODE.NOT_VERIFIED');
  }

  const isValidOTP = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
  });

  if (!isValidOTP) {
    throw new Error('CUSTOMER.CONFIRM_QR_FAILED');
  }

  user.token2FA = secret;

  await user.save();

  return _generate2FASignature({
    data: {
      isVerified: true,
      userId: user._id,
    },
    key: SYMETRIC_SECRET,
  });
};

const verifyEmailFor2FA = async ({ userInfo, type }) => {
  if (['email-authentication', 'qr-authentication'].indexOf(type) === -1) {
    throw new Error('EMAIL_VERIFICATION.TYPE.INVALID');
  }

  const user = await User.findOne({ _id: userInfo._id });

  if (!user) {
    throw new Error('USER.NOT_FOUND');
  }

  const existing2FACode = await Code.findOne({
    user: user._id,
    type,
  });

  const randomCode = Math.floor(100000 + Math.random() * 900000);

  if (!existing2FACode) {
    const newCode = new Code({
      user: user._id,
      type,
      value: randomCode,
      expireTime: new Date().getTime() + 5 * 60 * 1000,
    });

    await newCode.save();
  } else {
    const expireTime = new Date(existing2FACode.expireTime).getTime();

    const currentTime = new Date().getTime();

    if (currentTime < expireTime - 4 * 60 * 1000) {
      throw new Error('EMAIL.SPAM');
    }

    await Code.updateOne(
      {
        user: user._id,
        type,
      },
      {
        $set: {
          value: randomCode,
          expireTime: new Date(new Date(currentTime).getTime() + 5 * 60000),
          isVerified: false,
        },
      }
    );
  }

  sendEmail('', user.username, 'verifyOTP', randomCode);

  return { isSent: true };
};

const confirmEmailFor2FA = async ({ otp, userInfo, type }) => {
  if (['turn-on', 'turn-off'].indexOf(type) === -1) {
    throw new Error('TYPE.INVALID');
  }

  if (!otp) {
    throw new Error('CODE.NOT_FOUND');
  }

  const user = await User.findOne({ _id: userInfo._id });

  if (!user) {
    throw new Error('USER.NOT_FOUND');
  }

  if (type === 'turn-on' && user.token2FA) {
    throw new Error('USER.QR_CODE_ALREADY_ENABLE');
  }

  if (type === 'turn-off' && !user.token2FA) {
    throw new Error('USER.QR_CODE_ALREADY_DISABLE');
  }

  const existing2FACode = await Code.findOne({
    user: user._id,
    type: 'qr-authentication',
  });

  if (!existing2FACode) {
    throw new Error('CODE.NOT_SEND');
  }

  if (existing2FACode.isVerified) {
    throw new Error('CODE.ALREADY_VERIFIED');
  }

  const expireTime = new Date(existing2FACode.expireTime).getTime();

  const currentTime = new Date().getTime();

  const isVerified = otp === existing2FACode.value && currentTime < expireTime;

  await Code.updateOne(
    {
      user: user._id,
      type: 'qr-authentication',
    },
    {
      $set: {
        isVerified: isVerified,
      },
    }
  );

  return isVerified;
};

const confirmEmailAuthentication = async ({
  otp,
  userInfo,
  type = 'verify',
}) => {
  if (['turn-on', 'turn-off', 'verify'].indexOf(type) === -1) {
    throw new Error('TYPE.INVALID');
  }

  if (!otp) {
    throw new Error('CODE.NOT_FOUND');
  }

  const user = await User.findOne({ _id: userInfo._id });

  if (!user) {
    throw new Error('USER.NOT_FOUND');
  }

  if (type === 'verify' && !user.isVerifyEmail) {
    throw new Error('USER.NOT_ENABLE_EMAIL_AUTHENTICATION');
  }

  if (type === 'turn-on' && user.isVerifyEmail) {
    throw new Error('USER.QR_CODE_ALREADY_ENABLE');
  }

  if (type === 'turn-off' && !user.isVerifyEmail) {
    throw new Error('USER.QR_CODE_ALREADY_DISABLE');
  }

  const existingEmailCode = await Code.findOne({
    user: user._id,
    type: 'email-authentication',
  });

  if (!existingEmailCode) {
    throw new Error('CODE.NOT_SEND');
  }

  if (existingEmailCode.isVerified) {
    throw new Error('CODE.ALREADY_VERIFIED');
  }

  const expireTime = new Date(existingEmailCode.expireTime).getTime();

  const currentTime = new Date().getTime();

  const isVerified =
    otp === existingEmailCode.value && currentTime < expireTime;

  await Code.updateOne(
    {
      user: user._id,
      type: 'email-authentication',
    },
    {
      $set: {
        isVerified: isVerified,
      },
    }
  );

  if (isVerified) {
    switch (type) {
      case 'turn-off':
        user.isVerifyEmail = false;

        await user.save();

        break;

      case 'turn-on':
        user.isVerifyEmail = true;

        await user.save();

        break;
    }
  }

  if (type === 'turn-off') return { isVerified };

  return _generate2FASignature({
    data: {
      isVerified,
      userId: user._id,
    },
    key: SYMETRIC_SECRET,
  });
};

const confirmTurnOff2FA = async ({ userInfo }) => {
  const user = await User.findOne({ _id: userInfo._id });

  if (!user) {
    throw new Error('USER.NOT_FOUND');
  }

  if (!user.token2FA) {
    throw new Error('USER.QR_CODE_ALREADY_DISABLE');
  }

  const existing2FACode = await Code.findOne({
    user: user._id,
    type: 'qr-authentication',
  });

	if (!existing2FACode) {
		throw new Error('CODE.NOT_SEND');
	}

  if (!existing2FACode.isVerified) {
    throw new Error('CODE.NOT_VERIFIED');
  }

  user.token2FA = '';

  return user.save();
};

const checkEmailExist = async ({ email }) => {
  const regex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gim;

  if (!regex.test(String(email))) {
    return false;
  }

  const existingEmail = await User.findOne({ email });

  return { isExisted: existingEmail ? true : false };
};

const verifyEmailForgotPw = async ({ email }) => {
  if (!email) throw new Error('EMAIL.INVALID');

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('USER.NOT_FOUND');
  }

  const existingForgotPwCode = await Code.findOne({
    user: user._id,
    type: 'reset-password',
  });

  const randomCode = uuid();

  if (!existingForgotPwCode) {
    const newCode = new Code({
      user: user._id,
      type: 'reset-password',
      value: randomCode,
      expireTime: new Date().getTime() + 5 * 60 * 1000,
    });

    await newCode.save();
  } else {
    const expireTime = new Date(existingForgotPwCode.expireTime).getTime();

    const currentTime = new Date().getTime();

    if (currentTime < expireTime - 4 * 60 * 1000) {
      throw new Error('EMAIL.SPAM');
    }

    await Code.updateOne(
      {
        user: user._id,
        type: 'reset-password',
      },
      {
        $set: {
          value: randomCode,
          expireTime: new Date(new Date(currentTime).getTime() + 5 * 60 * 1000),
          isVerified: false,
        },
      }
    );
  }

  const response = await sendEmailv2({
    activeCode: randomCode,
    email,
    type: 'reset-password',
  });

  if (response.accepted && Array.isArray(response.accepted)) {
    if (response.accepted.indexOf(email) > -1)
      return {
        isSent: true,
      };
  }

  return { isSent: false };
};

const confirmEmailForgotPw = async ({
  encryptedPrivateKey,
  publicKey,
  user,
  code,
}) => {
  if (!encryptedPrivateKey || !publicKey) throw new Error('KEYPAIR.INVALID');

  if (!user || !code) throw new Error('FORGOT_PASSWORD_URL.INVALID');

  const existingUser = await User.findOne({ _id: user });

  if (!existingUser) throw new Error('USER.NOT_FOUND');

  const existingCode = await Code.findOne({ value: code });

  if (!existingCode) throw new Error('CODE.NOT_FOUND');

  const expireTime = new Date(existingCode.expireTime).getTime();

  const currentTime = new Date().getTime();

  if (currentTime > expireTime) throw new Error('CODE.EXPIRE');

  if (existingCode.isVerified) throw new Error('CODE.EXPIRE');

  await User.updateOne(
    {
      _id: user,
    },
    {
      $set: { publicKey, encryptedPrivateKey },
    }
  );

  await Code.updateOne(
    {
      value: code,
    },
    {
      isVerified: true,
    }
  );

  return { isResetPassword: true };
};

const confirmGoogleAuthentication = async ({ userInfo, otp }) => {
  if (!otp) {
    throw new Error('CODE.NOT_FOUND');
  }

  const user = await User.findOne({ _id: userInfo._id });

  if (!user) {
    throw new Error('USER.NOT_FOUND');
  }

  if (typeof user.token2FA !== 'string' || user.token2FA.length === 0) {
    throw new Error('USER.NOT_ENABLE_GG_AUTHENTICATION');
  }

  const isValidOTP = speakeasy.totp.verify({
    secret: user.token2FA,
    encoding: 'base32',
    token: otp,
  });

  return _generate2FASignature({
    data: {
      isVerified: isValidOTP,
      userId: user._id,
    },
    key: SYMETRIC_SECRET,
  });
};

const guestVerifyEmail = async ({ email }) => {
  if (!email) throw new Error('EMAIL.INVALID');

  const regex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gim;

  if (!regex.test(String(email))) {
    throw new Error('EMAIL.INVALID');
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('USER.NOT_FOUND');
  }

  const existingCode = await Code.findOne({
    user: user._id,
    type: 'guest-email-authentication',
  });

  const randomCode = Math.floor(100000 + Math.random() * 900000);

  if (!existingCode) {
    const newCode = new Code({
      user: user._id,
      type: 'guest-email-authentication',
      value: randomCode,
      expireTime: new Date().getTime() + 5 * 60 * 1000,
    });

    await newCode.save();
  } else {
    const expireTime = new Date(existingCode.expireTime).getTime();

    const currentTime = new Date().getTime();

    if (currentTime < expireTime - 4 * 60 * 1000) {
      throw new Error('EMAIL.SPAM');
    }

    await Code.updateOne(
      {
        user: user._id,
        type: 'guest-email-authentication',
      },
      {
        $set: {
          value: randomCode,
          expireTime: new Date(new Date(currentTime).getTime() + 5 * 60000),
          isVerified: false,
        },
      }
    );
  }

  sendEmail('', user.username, 'verifyOTP', randomCode);

  return { isSent: true };
};

const guestConfirmEmailAuthentication = async ({ otp, email }) => {
  if (!email) throw new Error('EMAIL.INVALID');

  const regex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gim;

  if (!regex.test(String(email))) {
    throw new Error('EMAIL.INVALID');
  }

  if (!otp) {
    throw new Error('CODE.NOT_FOUND');
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('USER.NOT_FOUND');
  }

  const existingEmailCode = await Code.findOne({
    user: user._id,
    type: 'guest-email-authentication',
  });

  if (!existingEmailCode) {
    throw new Error('CODE.NOT_SEND');
  }

  if (existingEmailCode.isVerified) {
    throw new Error('CODE.ALREADY_VERIFIED');
  }

  const expireTime = new Date(existingEmailCode.expireTime).getTime();

  const currentTime = new Date().getTime();

  const isVerified =
    otp === existingEmailCode.value && currentTime < expireTime;

  await Code.updateOne(
    {
      user: user._id,
      type: 'guest-email-authentication',
    },
    {
      $set: {
        isVerified: isVerified,
      },
    }
  );

  return _generate2FASignature({
    data: {
      isVerified,
      userId: user._id,
    },
    key: SYMETRIC_SECRET,
  });
};

const guestConfirmGGAuthentication = async ({ otp, email }) => {
  if (!email) throw new Error('EMAIL.INVALID');

  const regex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gim;

  if (!regex.test(String(email))) {
    throw new Error('EMAIL.INVALID');
  }

  if (!otp) {
    throw new Error('CODE.NOT_FOUND');
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('USER.NOT_FOUND');
  }

  const isVerified = speakeasy.totp.verify({
    secret: user.token2FA,
    encoding: 'base32',
    token: otp,
  });

  return _generate2FASignature({
    data: {
      isVerified,
      userId: user._id,
    },
    key: SYMETRIC_SECRET,
  });
};

module.exports = {
	getByUserId,
	getAll,
	getBookshelf,
	updateCart,
	getCart,
	updateBookshelf,
	checkUsernameAvailable,
	editCustomerName,
	getCustomerProfile,
	generateQRImage,
	confirm2FA,
	verifyEmailFor2FA,
	confirmEmailFor2FA,
	confirmTurnOff2FA,
	editCustomerPw,
	confirmEmailAuthentication,
	checkEmailExist,
	verifyEmailForgotPw,
	confirmEmailForgotPw,
	confirmGoogleAuthentication,
	guestVerifyEmail,
	guestConfirmEmailAuthentication,
	guestConfirmGGAuthentication,
	updateCartv2,
	updateMutipleItemInCart,
  clearCart,
  updateBookshelfTransfer,
};
