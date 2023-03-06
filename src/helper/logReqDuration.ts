export default function (reqTime: number, urlLog: string): void {
  const reqDuration = Date.now() - reqTime;
  console.log(`${urlLog} -- DONE -- ${reqDuration / 1000}s`);
}