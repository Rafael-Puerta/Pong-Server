const logic=require('./gameLogic.js')

let startGame

function queryDatabase (query) {

    return new Promise((resolve, reject) => {
      var connection = mysql.createConnection({
        host: process.env.MYSQLHOST || "containers-us-west-140.railway.app",
        port: process.env.MYSQLPORT || 6606,
        user: process.env.MYSQLUSER || "root",
        password: process.env.MYSQLPASSWORD || "Hf8acLz5bmjPx43m0SqR",
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

async function login(user,passwd,player){
    try {
        let exists=await queryDatabase(`SELECT * FROM users WHERE name='${user}' and password='${passwd}';`)
        if(exists.length>0){
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

async function saveGame(player1,player2,hits1,hits2){
    let now=Date.now();
    let diff=(now.getTime() - startGame.getTime()) / 1000;
    try {
        await queryDatabase(`INSERT INTO games(time,duration,player1,player2,hitsPlayer1,hitsPlayer2) VALUES(${now},${diff},'${player1}','${player2}',${hits1},${hits2})`)
        startGame=null;
        // return true
    } catch (error) {
        console.log(error);
        // return false
    }

}

module.exports={login,singup,startGame,saveGame}