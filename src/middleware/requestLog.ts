export default function (req: IRequest, res: IResponse, next: INextFunction) {
  req._reqTime = Date.now();

  req._urlLog = `${req.method} -- ${req.protocol}://${req.hostname}${req.originalUrl}`;
  console.log(req._urlLog);
  next();
}