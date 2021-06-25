import express from 'express';
import Transaction from '../../../models/transaction';
import Customer from '../../../models/customer';
import Edition from '../../../models/edition';
import Episode from '../../../models/episode';
import Serie from '../../../models/serie';

import {
  clearCart,
  updateBookshelfTransfer,
} from '../customer/customer.service';
import { mint } from '../../../utils/blockchain-utils';
import { executeBlockChainTask } from './payment.service';
import { TaskQueue, Queue } from '../../../models/blockchain_queue';
import { createBatch } from '../edition/edition.service';
import BBPromise from 'bluebird';
const api = express.Router();
const bodyParser = require('body-parser');

api.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (request, response) => {
    try {
      const event = request.body;
      console.log(`Catch event: ${event.type}`);
      switch (event.type) {
        case 'blockchain.mint.failed':
          handleMintFail(event);
          break;
        case 'blockchain.mint.succeeded':
          handleMintSuccess(event);
          break;
        case 'blockchain.transfer.failed':
          handleTransferFailed(event);
          break;
        case 'blockchain.transfer.succeeded':
          handleTransferSuccess(event);
          break;
        case 'charge.succeeded':
          // console.log(event)
          break;
        case 'payment_intent.succeeded':
          handlePaymentSuccess(event);
          break;

        default:
          console.log(`No action for event type: ${event.type}.`);
      }
    } catch (err) {
      console.log(err);
    }

    response.send();
  }
);

const handlePaymentSuccess = async ({ data }) => {
  try {
    const checkoutTask = await TaskQueue.findOne({
      params: data.object.metadata.params,
    });
    if (!checkoutTask) throw new Error('WEBHOOK.PAYMENT.TASK_INVALID');
    if (checkoutTask.status === 'pending') {
      checkoutTask.status = 'done';
      await checkoutTask.save();
      await executeBlockChainTask({ queueId: checkoutTask.queue, time: 1 });
    }
  } catch (err) {
    console.log('err', err);
  }
};

const handleMintFail = async ({ data, params }) => {
  try {
    console.log('Mint failed, re-mint');
    const task = await TaskQueue.findOne({ params }).populate('queue');
    if (!task) throw new Error('WEBHOOK.BLOCKCHAIN.TASK_NOT_FOUND');
    task.attempt++;
    await task.save();
  
    if (task.attempt > 3) {
      
      const mintParams = JSON.parse(params)
      const episode = await Episode.findOne({_id : mintParams.episodeId})
      const serie = await Serie.findOne({_id : episode.serie})
      await Serie.removeEpisode(serie, mintParams.episodeId)
      await episode.remove()

      task.status = 'failed';
      await task.save();
      await Queue.getStatus(task.queue._id);
      return;
    }
  
    const p = JSON.parse(params);
    await mint(p);
  } catch (err) {
    console.log(err)
  }

};
const handleMintSuccess = async ({ data, params }) => {
  try {
    const task = await TaskQueue.findOne({ params }).populate('queue');
    if (!task) throw new Error('WEBHOOK.BLOCKCHAIN.TASK_NOT_FOUND');
    const p = JSON.parse(params);
    if (!data) {
      console.log('Recall blockchain ');
      mint(p);
      return;
    }
    await createBatch({
      userId: task.queue.caller,
      episodeId: p.episodeId,
      startId: Number(data.startId),
      amount: Number(data.amount),
      txHash: data.txHash,
    });
    task.status = 'done';
    await task.save();
    console.log('Mint success');
    const { isDone, isPending, isFailed } = await Queue.getStatus(task.queue._id);
    if (isFailed) {
      //recall
    }
  } catch (err) {
    console.log(err)
  }
};

const handleTransferSuccess = async ({ data, params }) => {
  try {
    const task = await TaskQueue.findOne({ params }).populate('queue');
    if (!task) throw new Error('WEBHOOK.BLOCKCHAIN.TASK_NOT_FOUND');
    if (!data || !data.hash) {
      console.log('transfer error');
      // await executeBlockChainTask({ queueId: checkoutTask.queue, time: 1 });
    }
    task.status = 'done';
    await task.save();
    await Queue.getStatus(task.queue._id);
    const caller = task.queue.caller;
    const tokenIds = JSON.parse(params).id;
    await updateTransferSuccess({ tokenIds, caller, hash: data.hash, fee: 1910 });
  } catch (err) {
    console.log(err)
  }
  
};

const updateTransferSuccess = async ({ tokenIds, caller, hash, fee }) => {
  console.log('update transfer success')
  const customer = await Customer.findOne({ user: caller }).lean();
  const bookshelf = customer.bookshelf.map((id) => id.toString());
  const editions = await BBPromise.map(
    tokenIds,
    async (id) =>
      Edition.findOneAndUpdate(
        {
          tokenId: id,
        },
        {
          $set: {
            txHash: hash,
            owner: caller,
          },
        },
        { useFindAndModify: false }
      ),
    { concurrency: 5 }
  );
  const notInBookshelf = editions
    .map((edt) => edt.episode)
    .filter((ep) => bookshelf.indexOf(ep.toString()) === -1);
  const [cart, ..._] = await Promise.all([
    clearCart({ user: customer._id }),
    updateBookshelfTransfer({ user: caller, episodes: notInBookshelf }),
  ]);
  addToTransaction({fee, buyer: customer._id, txHash : hash, cart: cart._id})
  return
};


const addToTransaction = async ({fee, buyer, txHash, cart}) => {
  const transaction = new Transaction({buyer, txHash, cart, fee})
  await transaction.save()

}
const handleTransferFailed = async ({ data, params }) => {
  try {
    const transferTask = await TaskQueue.findOne({ params });
    if (!transferTask) throw new Error('WEBHOOK.TRANSFER.INVALID_TASK');

    transferTask.status = 'failed';
    await transferTask.save();
    await Queue.getStatus(transferTask.queue);
    return;
  } catch (err) {
    console.log(err);
  }
};
module.exports = api;
