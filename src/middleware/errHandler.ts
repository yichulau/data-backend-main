export default function (err: any, req: IRequest, res: IResponse, next: INextFunction) {
  console.log(`${req._urlLog} -- ERROR -- ${err.status}`);
  res.status(err.status).send({});
}