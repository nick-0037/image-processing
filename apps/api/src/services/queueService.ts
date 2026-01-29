import amqp from 'amqplib';
import { QUEUES } from "@repo/shared";

let channel: amqp.Channel;

export const initQueue = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL!);
        
        // Assign the created channel to the top-level variable
        channel = await connection.createChannel();
        
        await channel.assertQueue(QUEUES.IMAGE_PROCESSING, { durable: true });
        console.log("RabbitMQ Channel initialized");
    } catch (error) {
        console.error("Failed to initialize RabbitMQ:", error);
        throw error;
    }
};

export const addTaskToQueue = (payload: object) => {
    // Now 'channel' is defined in this scope!
    if (!channel) {
        throw new Error("Channel of RabbitMQ not initialized. Did you call initQueue?");
    }
    
    channel.sendToQueue(QUEUES.IMAGE_PROCESSING, Buffer.from(JSON.stringify(payload)), {
        persistent: true 
    });
};