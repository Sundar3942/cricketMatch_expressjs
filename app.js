const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server getting started");
    });
  } catch (e) {
    console.log(`Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

const covertObjToDbObject_player = function (obj) {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};
const covertObjToDbObject_match = function (obj) {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};
const covertObjToDbObject_playerScores = function (obj) {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
    totalScore: obj.score,
    totalFours: obj.fours,
    totalSixes: obj.sixes,
  };
};
app.get("/players/", async (request, response) => {
  const query = `
    SELECT * from player_details ORDER BY player_id;
    `;
  const playersArray = await db.all(query);
  const converted = playersArray.map((eachObj) =>
    covertObjToDbObject_player(eachObj)
  );
  response.send(converted);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `
        SELECT * from player_details WHERE player_id = ${playerId};
    `;
  const dbResponse = await db.get(query);
  const converted = covertObjToDbObject_player(dbResponse);
  response.send(converted);
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const sqlQuery = `
        UPDATE
        player_details
        SET 
        player_name = '${playerName}'
        WHERE
        player_id = ${playerId};
    `;
  const dbResponse = await db.run(sqlQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `
        SELECT * from match_details WHERE match_id = ${matchId};
    `;
  const dbResponse = await db.get(query);
  const converted = covertObjToDbObject_match(dbResponse);
  response.send(converted);
});
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `
        SELECT  match_details.match_id as match_id,
            match_details.match as match,
            match_details.year as year
            FROM 
            player_match_score inner join match_details on player_match_score.match_id = match_details.match_id
            WHERE
            player_match_score.player_id = ${playerId};
    `;
  const matchesArray = await db.all(query);
  const converted = matchesArray.map((eachObj) =>
    covertObjToDbObject_match(eachObj)
  );
  response.send(converted);
});
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `
        SELECT 
        player_match_score.player_id as player_id,player_details.player_name as player_name
        FROM 
        player_match_score INNER JOIN player_details ON player_match_score.player_id = player_details.player_id
        WHERE 
        player_match_score.match_id = ${matchId};
    `;
  const playersArray = await db.all(query);
  const converted = playersArray.map((eachObj) =>
    covertObjToDbObject_player(eachObj)
  );
  response.send(converted);
});
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `
        SELECT 
        player_match_score.player_id as player_id,
        player_details.player_name as player_name,
        sum(player_match_score.score) as score , 
        sum(player_match_score.fours) as fours,
        sum(player_match_score.sixes) as sixes
        FROM 
        player_match_score INNER JOIN player_details ON player_match_score.player_id = player_details.player_id
        WHERE player_details.player_id = ${playerId};
    `;
  const matchesArray = await db.get(query);
  const converted = covertObjToDbObject_playerScores(matchesArray);
  console.log(converted);
  response.send(converted);
});
module.exports = app;
