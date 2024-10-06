import express,{Response, Request} from "express";
import connectDb from "./db";
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
connectDb();
app.use("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "hello bun",
  });
});

app.listen(port,()=>{
    console.log(`Listening on port ${port}...`)
})