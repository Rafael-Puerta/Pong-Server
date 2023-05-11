const logic=require('./gameLogic.js')
const mysql=require('mysql2')

let startGame

function queryDatabase (query) {

    return new Promise((resolve, reject) => {
      var connection = mysql.createConnection({
        host: process.env.MYSQLHOST || "containers-us-west-15.railway.app",
        port: process.env.MYSQLPORT || 7487,
        user: process.env.MYSQLUSER || "root",
        password: process.env.MYSQLPASSWORD || "6EAxCjsus0Pj6hB6dv7l",
        database: process.env.MYSQLDATABASE || "railway"
      });
  
      connection.query(query, (error, results) => { 
        if (error) reject(error);
        resolve(results)
      });
       
      connection.end();
    })
  }

// Wait 'ms' milliseconds
function wait (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

function toLocalTime(time) {
    var d = new Date(time);
    var offset = (new Date().getTimezoneOffset() / 60) * -1;
    var n = new Date(d.getTime() + offset);
    return n;
};

async function login(user,passwd){
    try {
        let exists=await queryDatabase(`SELECT * FROM users WHERE name='${user}' and password='${passwd}';`)
        if(exists.length>0){
            return exists[0];
        }else{
            return exists[0];
        }
    } catch (error) {
        console.log(error);
        return false
    }
}

async function singup(user,password,color,player){
    try {
        let exists=await queryDatabase(`SELECT * FROM users WHERE name='${user}';`)
        if(exists.length==0){
            await queryDatabase(`INSERT INTO users(name,password,color) VALUES('${user}','${password}','${color}')`)
            return {name: user, color: color};
        }else{
            return false;
        }
    } catch (error) {
        console.log(error);
        return false
    }
}

async function saveGame(player1,player2,hits1,hits2,points1, points2, winner){
    let now=Date.now();
    console.log(now- startGame)
    let diff=Math.round((now - startGame) / 1000);
    let today = new Date();
    let dateString = today.getFullYear() + ":" + (today.getMonth() > 10 ? today.getMonth() : "0" + today.getMonth()) + ":" + (today.getDate() > 0 ? today.getDate() : "0"+ today.getDate()) ;
    try {
        let id1=await queryDatabase(`SELECT id FROM users WHERE name='${player1}';`);
        id1=id1[0].id
        let id2=await queryDatabase(`SELECT id FROM users WHERE name='${player2}';`);
        id2=id2[0].id
        let win=0
        if(winner==1){
            win=id1
        }else{
            win=id2
        }
        await queryDatabase(`INSERT INTO games(time,duration,player1,player2,hitsPlayer1,hitsPlayer2,scorePlayer1,scorePlayer2,winner) VALUES('${dateString}',${diff},'${id1}','${id2}',${hits1},${hits2},${points1},${points2},${win})`)
        startGame=null;
        // return true
    } catch (error) {
        console.log(error);
        // return false
    }

}

async function list(){
    try {
        let results=await queryDatabase('SELECT * FROM users;');
        return results;
    } catch (error) {
        return false;
    }
}

async function stats(id){
    try {
        let exists=await queryDatabase(`SELECT * FROM users WHERE id='${id}';`)
        console.log("a " + exists)
        if(exists.length>0){
            let wins=await queryDatabase(`SELECT COUNT(id) as counter FROM games WHERE winner=${id}`)
            let lose=await queryDatabase(`SELECT COUNT(id) as counter FROM games WHERE winner<>${id} and player1=${id} or player2=${id};`)
            let longest=await queryDatabase(`SELECT * FROM games WHERE player1=${id} or player2=${id} ORDER BY duration DESC LIMIT 1;`)
            if (longest.length != 0) {
                let user1 = await queryDatabase(`SELECT * FROM users WHERE id = ${longest[0].player1}`);
                let user2 = await queryDatabase(`SELECT * FROM users WHERE id = ${longest[0].player2}`);
                longest[0].name1 = user1[0].name;
                longest[0].name2 = user2[0].name
            }
            let topHits1=await queryDatabase(`SELECT * FROM games WHERE player1=${id} ORDER BY hitsPlayer1 DESC LIMIT 1;`)
            if (topHits1.length != 0)
            {
                user1 = await queryDatabase(`SELECT * FROM users WHERE id = ${topHits1[0].player1}`);
                user2 = await queryDatabase(`SELECT * FROM users WHERE id = ${topHits1[0].player2}`);
                topHits1[0].name1 = user1[0].name
                topHits1[0].name2 = user2[0].name
            }
            let topHits2=await queryDatabase(`SELECT * FROM games WHERE  player2=${id} ORDER BY hitsPlayer2 DESC LIMIT 1;`)
            if (topHits2.length != 0) {
                user1 = await queryDatabase(`SELECT * FROM users WHERE id = ${topHits2[0].player1}`);
                user2 = await queryDatabase(`SELECT * FROM users WHERE id = ${topHits2[0].player2}`);
                topHits2[0].name1 = user1[0].name
                topHits2[0].name2 = user2[0].name
            }
            let toph=0
            console.log(topHits1)
            console.log(topHits2)
            let stat;
            if(wins[0].counter == 0 && lose[0].counter == 0) {
                stat = {};
            } else if (topHits1.length == 0) {
                stat = {wins:wins[0].counter,loses:lose[0].counter,long:longest[0],topHits:topHits2[0].hitsPlayer2, topHitsGame: topHits2[0]}
            } else if (topHits2.length == 0) {
                stat = {wins:wins[0].counter,loses:lose[0].counter,long:longest[0],topHits:topHits1[0].hitsPlayer1, topHitsGame: topHits1[0]}
            } else if(topHits1[0].hitsPlayer1>topHits2[0].hitsPlayer2){
                stat = {wins:wins[0].counter,loses:lose[0].counter,long:longest[0],topHits:topHits1[0].hitsPlayer1, topHitsGame: topHits1[0]}
            }else{
                stat = {wins:wins[0].counter,loses:lose[0].counter,long:longest[0],topHits:topHits2[0].hitsPlayer2, topHitsGame: topHits2[0]}
            }
            console.log(stat)
            // stat={wins:wins[0],loses:lose[0],long:longest[0],topHits:toph} // TODO test response, maybe need modify wins[0] to wins[0].count... others too
            return stat;
        }else{
            return false;
        }
    } catch (error) {
        console.log(error);
        return false
    }
}

async function playerList(){
    let results=await queryDatabase('SELECT id,name FROM users')
    return results;
}

function setStartGame() {
    startGame = Date.now()
}

module.exports={login,singup,setStartGame, startGame,saveGame,playerList,stats,list}