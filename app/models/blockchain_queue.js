const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskQueueSchema = new Schema(
	{
    status: {
      type: String,
      enum: ['pending', 'done', 'failed'],
      default: 'pending',
    },
    name: {
      type: String,
      enum: ['blockchain.mint', 'blockchain.transfer', 'checkout.payment'],
    },
    params: {
      type: String,
    },
    queue: { type: Schema.Types.ObjectId, ref: 'Queue', require: true },
    attempt: {
      type: Number,
      default: 0,
    }
	},
	{ timestamps: true }
);


const QueueSchema = new Schema(
	{
    status: {
      type: String,
      enum: ['pending', 'done', 'failed'],
    },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'TaskQueue', default: [] }],
    caller: { type: Schema.Types.ObjectId, ref: 'User', require: true },
	},
	{ timestamps: true }
);

QueueSchema.statics.getStatus = async function(queueId) {
  const q = await Queue.findById(queueId).populate('tasks')
  const isPending = q.tasks.some(t => t.status === 'pending')
  const isFailed = q.tasks.some(t => t.status === 'failed') 
  const isDone = !isPending && !isFailed
  if (isDone) q.status = 'done'
  if (isFailed) q.status = 'failed'
  await q.save()
  return {isPending, isFailed, isDone}
  
}

const Queue = mongoose.model('Queue', QueueSchema);
const TaskQueue = mongoose.model('TaskQueue', TaskQueueSchema);

module.exports = {Queue, TaskQueue};
