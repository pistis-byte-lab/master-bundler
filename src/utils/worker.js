
const { parentPort, workerData } = require('worker_threads');

parentPort.on('message', async (task) => {
  try {
    // Dynamically import the processor file
    const module = require(task.filename);
    
    // Get the processor method
    const method = module[task.methodName];
    
    if (typeof method !== 'function') {
      throw new Error(`Method ${task.methodName} not found in ${task.filename}`);
    }
    
    // Execute the method
    const result = await method(task.data);
    
    // Send back the result
    parentPort.postMessage({
      id: task.id,
      result
    });
  } catch (error) {
    parentPort.postMessage({
      id: task.id,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});
