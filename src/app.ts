import express from "express";
import cors from "cors";

import requestLog from "@middleware/requestLog";
import apiRouter from "@router/index";
import errHandler from "@middleware/errHandler";

const port = Number(process.env.PORT);
const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

app.use(requestLog);

app.use("/api", apiRouter);

app.use(errHandler);

app.use("*", (req: IRequest, res: IResponse) => {
  console.log(`${req._urlLog} -- INVALID URL`);
  res.status(404).send();
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});