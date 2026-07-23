import { createClient } from "redis";

const client = createClient();
client.connect().then(async() => {

    while(1){
        const response = await client.rPop("problems");

        if(!response){
            await new Promise((r) => setTimeout(r, 1000));
            continue;
        }
       
        const parsedmsg = JSON.parse(response);
        
        if(parsedmsg.language == 'cpp'){
            console.log("running cpp code")
            await new Promise((r) => setTimeout(r, 1000));

        }

        if(parsedmsg.language == 'js'){
            console.log("running js code");
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
}
)