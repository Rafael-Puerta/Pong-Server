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
            return true;
        }else{
            return false;
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
            logic.setPlayerName(player,user)
            return true;
        }else{
            return false;
        }
    } catch (error) {
        console.log(error);
        return false
    }
}

async function saveGame(player1,player2,hits1,hits2,winner){
    let now=Date.now();
    let diff=(now.getTime() - startGame.getTime()) / 1000;
    try {
        let id1=await queryDatabase(`SELECT id FROM users WHERE name=${player1};`);
        id1=id1[0]
        let id2=await queryDatabase(`SELECT id FROM users WHERE name=${player2};`);
        id2=id2[0]
        let win=0
        if(winner==1){
            win=id1
        }else{
            win=id2
        }
        console.log(id1,id2);
        await queryDatabase(`INSERT INTO games(time,duration,player1,player2,hitsPlayer1,hitsPlayer2,winner) VALUES(${now},${diff},${id1},${id2},${hits1},${hits2},${win})`)
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
        let exists=await queryDatabase(`SELECT * FROM users WHERE id=${user};`)
        if(exists.length>0){

            let wins=await queryDatabase(`SELECT COUNT(id) FROM games WHERE winner=${id}`)
            let lose=await queryDatabase(`SELECT COUNT(id) FROM games WHERE winner<>${id} and player1=${id} or player2=${id};`)
            let longest=await queryDatabase(`SELECT * FROM games WHERE player1=${id} or player2=${id} ORDER BY time DESC LIMIT 1;`)
            let topHits1=await queryDatabase(`SELECT * FROM games WHERE player1=${id} ORDER BY hitsPlayer1 DESC LIMIT 1;`)
            let topHits2=await queryDatabase(`SELECT * FROM games WHERE  player2=${id} ORDER BY hitsPlayer2 DESC LIMIT 1;`)
            let toph=0
            if(topHits1[0].hitsPlayer1>topHits2[0].hitsPlayer2){
                toph=topHits1[0].hitsPlayer1
            }else{
                toph=topHits1[0].hitsPlayer2
            }
            let stat={wins:wins[0],loses:lose[0],long:longest[0],topHits:toph} // TODO test response, maybe need modify wins[0] to wins[0].count... others too
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

module.exports={login,singup,startGame,saveGame,playerList,stats,list}