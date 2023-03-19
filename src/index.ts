import dotenv from "dotenv";
dotenv.config();

import cluster from "cluster";
import { cpus } from "os";

if (cluster.isPrimary) {
  const cpuCount = cpus().length;

  console.log(`Number of CPUs: ${cpuCount}`);
  console.log(`Master process ${process.pid} is running`);

  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, starting a new worker`);
    cluster.fork();
  });
}
else {
  import("./app")
    .then(() => {
      console.log(`Worker ${process.pid} started`);;
    });
}