import app from "@/app.js";
import { initQueue } from "./services/queueService.js";

const startServer = async () => {
	try {
		// Initialize RabbitMQ first
		await initQueue();
		console.log("Message Queue ready");

		// Start the Express server
		const PORT = process.env.PORT || 3001;
		app.listen(PORT, () => {
			console.log(`Server is running on ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();
