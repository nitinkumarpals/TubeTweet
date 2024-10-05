import express,{Response, Request} from "express";
const app = express();
const port = process.env.PORT;
app.use(express.json());

app.use("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "hello bun",
  });
});

app.listen(port,()=>{
    console.log(`Listening on port ${port}...`)
})