import express from "express";
import { createClient } from "redis";


const app = express();
const client = createClient();
client.connect().then(() => console.log("redis connected"))


app.use(express.json());

app.post("/submission", (req, res) => {
    const {userId, problemId, code, language} = req.body;

    client.lPush("problems", JSON.stringify({userId, problemId, code, language}));
    res.json("pushed to the queue");

    
})

app.get("/submission/:subId", (req, res) => {

})

app.listen(3000, () => console.log("backend running on port 3000"))